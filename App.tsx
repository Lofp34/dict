
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import IconButton from './components/IconButton';
import { GoogleGenAI } from "@google/genai";

// SpeechRecognition interface (may vary by browser)
interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart?: () => void;
  onend?: () => void;
  onresult?: (event: any) => void; // Using 'any' for broader compatibility with SpeechRecognitionEvent
  onerror?: (event: any) => void; // Using 'any' for broader compatibility with SpeechRecognitionErrorEvent
}

// Interface pour les notes sauvegardées enrichies par Gemini
interface SavedNote {
  id: string;
  originalText: string;
  title: string;
  structuredText: string;
  suggestions: string[];
  timestamp: Date;
  isProcessing?: boolean;
  type?: 'note' | 'email' | 'sms';
  chatMessages?: ChatMessage[];
}

// Interface pour les messages de chat
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Interface pour le bouton flottant
interface FloatingButtonPosition {
  x: number;
  y: number;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): CustomSpeechRecognition };
    webkitSpeechRecognition: { new(): CustomSpeechRecognition };
  }
}

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.041h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.041a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625v2.625m0 0H19.5m-2.25-2.625h-1.125c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125Z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

const SaveWithAIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [chatInputs, setChatInputs] = useState<{ [noteId: string]: string }>({});
  
  // États pour le bouton flottant
  const [floatingButtonPosition, setFloatingButtonPosition] = useState<FloatingButtonPosition>({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFloatingListening, setIsFloatingListening] = useState<boolean>(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);

  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const isStoppingInternallyRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialiser l'API Gemini avec gestion d'erreur
  const ai = useMemo(() => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '') {
        console.log('API Gemini initialisée avec succès');
        return new GoogleGenAI({ apiKey: apiKey });
      } else {
        console.warn('Clé API Gemini non configurée ou invalide. Les fonctionnalités IA seront désactivées.');
        console.warn('Vérifiez que GEMINI_API_KEY est définie dans vos variables d\'environnement.');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Gemini:', error);
      return null;
    }
  }, []);

  // Charger les notes sauvegardées depuis localStorage au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('dictée-magique-notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convertir les timestamps en objets Date
        const notesWithDates = parsed.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp)
        }));
        setSavedNotes(notesWithDates);
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
      }
    }
  }, []);

  // Sauvegarder les notes dans localStorage quand elles changent
  useEffect(() => {
    localStorage.setItem('dictée-magique-notes', JSON.stringify(savedNotes));
  }, [savedNotes]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };


  
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isStoppingInternallyRef.current = false; 
    };

    recognition.onend = () => {
      setIsListening(false);
      // Keep interimTranscript if recognition ended abruptly before finalization,
      // user might want to copy it or it might become final on next start.
      // setInterimTranscript(''); 
      isStoppingInternallyRef.current = false;
    };

    recognition.onresult = (event: any) => { 
      let finalTranscriptChunk = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const segment = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscriptChunk += segment;
        } else {
          currentInterim += segment;
        }
      }
      
      if (finalTranscriptChunk) {
        // Si on est dans un chat, ajouter au chat actif
        if (activeInputId && activeInputId.startsWith('chat-')) {
          const noteId = activeInputId.replace('chat-', '');
          setChatInputs(prev => ({
            ...prev,
            [noteId]: (prev[noteId] || '') + finalTranscriptChunk
          }));
        } else {
          // Sinon, ajouter au transcript principal
          setTranscript(prev => {
            const separator = (prev && !/\s$/.test(prev) && finalTranscriptChunk && !finalTranscriptChunk.startsWith(' ')) ? ' ' : '';
            let newText = (prev + separator + finalTranscriptChunk).trim();
            
            // Add a space after common sentence-ending punctuation for better flow in next dictation
            if (/[.?!]$/.test(finalTranscriptChunk.trim())) {
              newText += ' ';
            }
            return newText;
          });
        }
      }
      
      setInterimTranscript(currentInterim.trim());
    };

    recognition.onerror = (event: any) => { 
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = "Une erreur est survenue lors de la reconnaissance vocale.";

      if (event.error === 'aborted') {
        if (isStoppingInternallyRef.current) {
          isStoppingInternallyRef.current = false;
          return; 
        } else {
          errorMessage = "La reconnaissance vocale a été interrompue de manière inattendue.";
        }
      } else {
        switch (event.error) {
          case 'no-speech':
            errorMessage = "Aucune parole n'a été détectée. Veuillez réessayer.";
            break;
          case 'audio-capture':
            errorMessage = "Problème de capture audio. Vérifiez votre microphone et les permissions.";
            break;
          case 'not-allowed':
            errorMessage = "L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur ou de l'appareil.";
            break;
          case 'network':
            errorMessage = "Erreur de réseau. Vérifiez votre connexion internet et réessayez. La reconnaissance vocale nécessite une connexion active.";
            break;
          case 'service-not-allowed':
            errorMessage = "Le service de reconnaissance vocale est désactivé ou non autorisé. Vérifiez les paramètres de votre appareil ou navigateur.";
            break;
          default:
            errorMessage = `Une erreur inattendue est survenue (${event.error || 'inconnu'}). Veuillez réessayer.`;
        }
      }
      setError(errorMessage);
    };
    
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop();
        recognitionRef.current.onstart = undefined;
        recognitionRef.current.onend = undefined;
        recognitionRef.current.onresult = undefined;
        recognitionRef.current.onerror = undefined;
        recognitionRef.current = null;
      }
    };
  }, [activeInputId]);


  const handleListen = useCallback(() => {
    if (!isSupported) {
        setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
        return;
    }
    
    if (!recognitionRef.current) {
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
             setError("L'objet de reconnaissance vocale n'est pas initialisé. Essayez de rafraîchir la page.");
        } else {
            setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
        }
        return;
    }

    if (isListening) {
      isStoppingInternallyRef.current = true;
      recognitionRef.current.stop();
    } else {
      // If there's text and it doesn't end with a space, add one.
      setTranscript(prev => (prev && !/\s$/.test(prev) ? prev + ' ' : prev));
      setInterimTranscript(''); // Clear any stale interim text
      setError(null); 
      try {
        isStoppingInternallyRef.current = false;
        recognitionRef.current.start();
      } catch (e: any) {
        console.error("Error starting recognition:", e);
        setError(`Erreur au démarrage de la reconnaissance: ${e.message || String(e)}`);
        setIsListening(false); 
        isStoppingInternallyRef.current = false;
      }
    }
  }, [isListening, isSupported]);

  const handleCopy = useCallback(() => {
    // Combine final transcript and current interim transcript for copying
    const textToCopy = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToCopy) {
      showNotification("Rien à copier.");
      return;
    }
    navigator.clipboard.writeText(textToCopy)
      .then(() => showNotification("Texte copié !"))
      .catch(err => {
        console.error('Failed to copy: ', err);
        showNotification("Erreur lors de la copie.");
      });
  }, [transcript, interimTranscript]);

  const processNoteWithGemini = useCallback(async (note: SavedNote) => {
    if (!ai) {
      console.warn('API Gemini non disponible');
      return {
        ...note,
        title: "Note (IA non disponible)",
        structuredText: note.originalText,
        suggestions: ["Fonctionnalité IA désactivée"],
        isProcessing: false
      };
    }

    try {
      const prompt = `
Tu es un expert en stratégie commerciale et développement de produits. Analyse cette note professionnelle et fournis :

1. Un titre court et percutant (max 8 mots)
2. Une reformulation structurée qui clarifie et complète la pensée exprimée (pas de résumé, mais une amélioration de la structure et de la clarté)
3. 2-3 suggestions d'approfondissement ou questions stratégiques pertinentes

Note originale : "${note.originalText}"

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte supplémentaire :

{
  "title": "Titre de la note",
  "structuredText": "Texte reformulé et structuré",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en stratégie commerciale et développement de produits. Tu analyses des notes professionnelles pour les améliorer et proposer des pistes d'approfondissement.",
        },
      });

      // Nettoyer la réponse de Gemini qui peut contenir des backticks
      let cleanResponse = (response.text || '').trim();
      
      // Supprimer les backticks et "json" si présents
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanResponse);
      
      return {
        ...note,
        title: result.title,
        structuredText: result.structuredText,
        suggestions: result.suggestions,
        isProcessing: false
      };
    } catch (error) {
      console.error('Erreur lors du traitement Gemini:', error);
      return {
        ...note,
        title: "Note non traitée",
        structuredText: note.originalText,
        suggestions: ["Erreur de traitement"],
        isProcessing: false
      };
    }
  }, [ai]);

  const handleSaveNote = useCallback(async () => {
    const textToSave = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToSave) {
      showNotification("Rien à sauvegarder.");
      return;
    }
    
    const newNote: SavedNote = {
      id: Date.now().toString(),
      originalText: textToSave,
      title: "Traitement en cours...",
      structuredText: "",
      suggestions: [],
      timestamp: new Date(),
      isProcessing: true,
      type: 'note'
    };
    
    setSavedNotes(prev => [newNote, ...prev]);
    showNotification("Note sauvegardée et en cours de traitement...");
    
    // Traiter la note avec Gemini
    const processedNote = await processNoteWithGemini(newNote);
    setSavedNotes(prev => prev.map(note => 
      note.id === newNote.id ? processedNote : note
    ));
    
    showNotification("Note enrichie par l'IA !");
  }, [transcript, interimTranscript, processNoteWithGemini]);

  const handleCopyNote = useCallback((note: SavedNote) => {
    const textToCopy = note.isProcessing ? note.originalText : note.structuredText;
    navigator.clipboard.writeText(textToCopy)
      .then(() => showNotification("Note copiée !"))
      .catch(err => {
        console.error('Failed to copy note: ', err);
        showNotification("Erreur lors de la copie.");
      });
  }, []);

  const handleGenerateEmail = useCallback(async () => {
    const textToTransform = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToTransform) {
      showNotification("Rien à transformer en e-mail.");
      return;
    }

    if (!ai) {
      showNotification("IA non disponible pour la génération d'e-mail.");
      return;
    }

    // Créer une nouvelle note email avec isProcessing = true
    const emailNote: SavedNote = {
      id: Date.now().toString(),
      originalText: textToTransform,
      title: "E-mail en cours de génération...",
      structuredText: "",
      suggestions: [],
      timestamp: new Date(),
      isProcessing: true,
      type: 'email'
    };

    // Ajouter la note à la liste
    setSavedNotes(prev => [emailNote, ...prev]);

    try {
      showNotification("Génération de l'e-mail en cours...");
      
      const prompt = `
Tu es un expert en communication professionnelle. Transforme cette note en un e-mail professionnel complet.

Note originale : "${textToTransform}"

IMPORTANT : Génère un e-mail professionnel avec :
- Objet approprié
- Salutation professionnelle
- Corps du message structuré et clair
- Formule de politesse adaptée
- Signature professionnelle

Réponds UNIQUEMENT avec un objet JSON valide :

{
  "subject": "Objet de l'e-mail",
  "body": "Corps complet de l'e-mail avec salutation, contenu et signature"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en communication professionnelle. Tu transformes des notes en e-mails professionnels impeccables.",
        },
      });

      // Nettoyer la réponse de Gemini
      let cleanResponse = (response.text || '').trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const emailData = JSON.parse(cleanResponse);
      
      // Mettre à jour la note avec les données de l'e-mail
      const updatedNote: SavedNote = {
        ...emailNote,
        title: emailData.subject,
        structuredText: emailData.body,
        suggestions: [],
        isProcessing: false
      };

      // Mettre à jour la note dans la liste
      setSavedNotes(prev => prev.map(note => 
        note.id === emailNote.id ? updatedNote : note
      ));

      showNotification("E-mail professionnel généré et sauvegardé !");
      
    } catch (error) {
      console.error('Erreur lors de la génération d\'e-mail:', error);
      
      // Mettre à jour la note avec l'erreur
      const errorNote: SavedNote = {
        ...emailNote,
        title: "Erreur lors de la génération",
        structuredText: "Impossible de générer l'e-mail. Veuillez réessayer.",
        suggestions: [],
        isProcessing: false
      };

      setSavedNotes(prev => prev.map(note => 
        note.id === emailNote.id ? errorNote : note
      ));

      showNotification("Erreur lors de la génération de l'e-mail.");
    }
  }, [transcript, interimTranscript, ai]);

  const handleGenerateSMS = useCallback(async () => {
    const textToTransform = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToTransform) {
      showNotification("Rien à transformer en SMS.");
      return;
    }

    if (!ai) {
      showNotification("IA non disponible pour la génération de SMS.");
      return;
    }

    // Créer une nouvelle note SMS avec isProcessing = true
    const smsNote: SavedNote = {
      id: Date.now().toString(),
      originalText: textToTransform,
      title: "SMS en cours de génération...",
      structuredText: "",
      suggestions: [],
      timestamp: new Date(),
      isProcessing: true,
      type: 'sms'
    };

    // Ajouter la note à la liste
    setSavedNotes(prev => [smsNote, ...prev]);

    try {
      showNotification("Génération du SMS en cours...");
      
      const prompt = `
Tu es un expert en communication mobile. Transforme cette note en un SMS professionnel synthétique et structuré.

Note originale : "${textToTransform}"

IMPORTANT : Génère un SMS professionnel avec :
- Message synthétique et concis (max 160 caractères idéalement)
- Structure en bullet points ou points clés
- Ton professionnel mais direct
- Informations essentielles uniquement
- Format adapté aux SMS

Réponds UNIQUEMENT avec un objet JSON valide :

{
  "subject": "Titre/Sujet du SMS",
  "body": "Contenu du SMS structuré et synthétique"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en communication mobile. Tu transformes des notes en SMS professionnels synthétiques et structurés.",
        },
      });

      // Nettoyer la réponse de Gemini
      let cleanResponse = (response.text || '').trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const smsData = JSON.parse(cleanResponse);
      
      // Mettre à jour la note avec les données du SMS
      const updatedNote: SavedNote = {
        ...smsNote,
        title: smsData.subject,
        structuredText: smsData.body,
        suggestions: [],
        isProcessing: false
      };

      // Mettre à jour la note dans la liste
      setSavedNotes(prev => prev.map(note => 
        note.id === smsNote.id ? updatedNote : note
      ));

      showNotification("SMS professionnel généré et sauvegardé !");
      
    } catch (error) {
      console.error('Erreur lors de la génération de SMS:', error);
      
      // Mettre à jour la note avec l'erreur
      const errorNote: SavedNote = {
        ...smsNote,
        title: "Erreur lors de la génération",
        structuredText: "Impossible de générer le SMS. Veuillez réessayer.",
        suggestions: [],
        isProcessing: false
      };

      setSavedNotes(prev => prev.map(note => 
        note.id === smsNote.id ? errorNote : note
      ));

      showNotification("Erreur lors de la génération du SMS.");
    }
  }, [transcript, interimTranscript, ai]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setSavedNotes(prev => prev.filter(note => note.id !== noteId));
    // Retirer aussi de la liste des notes étendues
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });
    showNotification("Note supprimée.");
  }, []);

  const toggleNoteExpansion = useCallback((noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);



  const handleChatInputChange = useCallback((noteId: string, value: string) => {
    setChatInputs(prev => ({
      ...prev,
      [noteId]: value
    }));
  }, []);

  const handleSendChatMessage = useCallback(async (noteId: string) => {
    const message = chatInputs[noteId]?.trim();
    if (!message || !ai) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    // Ajouter le message utilisateur
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { 
            ...note, 
            chatMessages: [...(note.chatMessages || []), userMessage]
          }
        : note
    ));

    // Vider l'input
    setChatInputs(prev => ({
      ...prev,
      [noteId]: ''
    }));

    try {
      // Créer une session de chat avec l'historique existant
      const note = savedNotes.find(n => n.id === noteId);
      const chatHistory = (note?.chatMessages || []).map(msg => ({
        role: msg.isUser ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      }));

      // Ajouter le contexte de la note au début de l'historique
      const contextMessage = {
        role: "user" as const,
        parts: [{ text: `Note originale : "${note?.originalText}"\n\nSuggestions : ${note?.suggestions?.join(', ') || 'Aucune'}\n\nTu es un assistant expert en stratégie commerciale et développement de produits. Réponds de manière concise et utile.` }]
      };

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [contextMessage, ...chatHistory]
      });

      // Créer un message IA temporaire pour le streaming
      const tempAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "▋", // Curseur de frappe pour indiquer le streaming
        isUser: false,
        timestamp: new Date()
      };

      // Ajouter le message temporaire
      setSavedNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              chatMessages: [...(note.chatMessages || []), tempAiMessage]
            }
          : note
      ));

      // Envoyer le message avec streaming
      const stream = await chat.sendMessageStream({
        message: message
      });

      let fullResponse = "";
      
      // Traiter le streaming en temps réel
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        
        // Mettre à jour le message en temps réel
        setSavedNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                chatMessages: note.chatMessages?.map(msg => 
                  msg.id === tempAiMessage.id 
                    ? { ...msg, content: fullResponse }
                    : msg
                ) || []
              }
            : note
        ));
      }

    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, une erreur s'est produite lors de la génération de la réponse.",
        isUser: false,
        timestamp: new Date()
      };

      setSavedNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              chatMessages: [...(note.chatMessages || []), errorMessage]
            }
          : note
      ));
    }
  }, [chatInputs, ai, savedNotes]);

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleClear = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null); 
    if (isListening && recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop(); 
    }
    showNotification("Texte effacé.");
    textareaRef.current?.focus();
  }, [isListening]);
  
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(event.target.value);
  };

  // Fonction pour gérer le clic sur le bouton flottant
  const handleFloatingMicClick = useCallback(() => {
    if (!isSupported) {
      setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
      return;
    }

    if (isFloatingListening) {
      // Arrêter l'écoute
      if (recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop();
      }
      setIsFloatingListening(false);
    } else {
      // Démarrer l'écoute
      setError('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsFloatingListening(true);
        } catch (error) {
          console.error('Erreur lors du démarrage de la reconnaissance vocale:', error);
          setError("Impossible de démarrer la reconnaissance vocale.");
        }
      }
    }
  }, [isFloatingListening, isSupported]);

  // Fonction pour gérer le début du drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  // Fonction pour gérer le drag
  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Limiter aux bords de l'écran
    const maxX = window.innerWidth - 70; // Largeur du bouton + marge
    const maxY = window.innerHeight - 70; // Hauteur du bouton + marge
    
    setFloatingButtonPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  // Fonction pour gérer la fin du drag
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Fonction pour gérer le focus sur un input
  const handleInputFocus = useCallback((inputId: string) => {
    setActiveInputId(inputId);
  }, []);

  // Fonction pour gérer la perte de focus
  const handleInputBlur = useCallback(() => {
    setActiveInputId(null);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-200 text-slate-800 font-sans">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl animate-fadeInOut" role="status">
          {notification}
        </div>
      )}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-fadeInOut { animation: fadeInOut 2s ease-in-out; }

        .mic-pulse-conditional {
           animation: ${isListening ? 'pulse-mic 1.5s infinite ease-in-out' : 'none'};
        }
        @keyframes pulse-mic {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } /* rose-500 */
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <h1 className="text-4xl font-extrabold my-6 sm:my-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-center">
        Dictée Magique
      </h1>



      {error && (
        <div className="w-full max-w-2xl bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
      )}
      {!isSupported && !error && (
         <div className="w-full max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-md" role="alert">
          <p className="font-bold">Attention</p>
          <p>La reconnaissance vocale n'est pas prise en charge par ce navigateur.</p>
        </div>
      )}

      <div 
        className="flex-grow w-full max-w-3xl bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl text-lg sm:text-xl leading-relaxed overflow-hidden flex flex-col min-h-[50vh] mb-8 cursor-text"
        onClick={() => textareaRef.current?.focus()}
        role="presentation"
      >
        <textarea
          ref={textareaRef}
          className="flex-grow w-full p-6 sm:p-8 bg-transparent focus:outline-none custom-scrollbar resize-none placeholder-slate-400 placeholder-italic"
          value={transcript}
          onChange={handleTextChange}
          onFocus={() => handleInputFocus('main')}
          onBlur={handleInputBlur}
          placeholder={!isListening && !transcript && !interimTranscript ? "Appuyez sur le microphone pour commencer la dictée..." : ""}
          aria-label="Texte de la dictée"
          rows={10} // Initial rows, actual height controlled by flex layout
        />
        {(isListening || isFloatingListening || interimTranscript) && (
          <div className="p-6 sm:p-8 pt-0 text-slate-500" aria-live="polite">
            {isListening && !interimTranscript && !transcript && <p className="italic">Écoute en cours...</p>}
            {interimTranscript && (
              <>
                {(transcript && !/\s$/.test(transcript) && interimTranscript ? ' ' : '')}
                {interimTranscript}
              </>
            )}
          </div>
        )}
      </div>


      {/* Barre d'actions en bas */}
      <div className="w-full max-w-4xl mt-6 mb-8">
        <div className="flex items-center justify-center space-x-3">
          {/* Effacer */}
          <IconButton
            onClick={handleClear}
            icon={<TrashIcon className="w-5 h-5" />}
            label="Effacer"
            className="bg-white/80 backdrop-blur-sm text-rose-600 hover:bg-rose-100/80 disabled:hover:bg-white/80 shadow-lg border border-rose-200 px-4 py-2"
            disabled={!transcript && !interimTranscript}
          />
          
          {/* Copier */}
          <IconButton
            onClick={handleCopy}
            icon={<CopyIcon className="w-5 h-5" />}
            label="Copier"
            className="bg-white/80 backdrop-blur-sm text-indigo-600 hover:bg-indigo-100/80 disabled:hover:bg-white/80 shadow-lg border border-indigo-200 px-4 py-2"
            disabled={!transcript && !interimTranscript}
          />
          
          {/* Sauvegarder avec IA */}
          <IconButton
            onClick={handleSaveNote}
            icon={<SaveWithAIIcon className="w-5 h-5" />}
            label="Sauvegarder"
            className="bg-white/80 backdrop-blur-sm text-green-600 hover:bg-green-100/80 disabled:hover:bg-white/80 shadow-lg border border-green-200 px-4 py-2"
            disabled={!transcript && !interimTranscript}
          />
          
          {/* Générer E-mail */}
          <IconButton
            onClick={handleGenerateEmail}
            icon={<EnvelopeIcon className="w-5 h-5" />}
            label="E-mail"
            className="bg-white/80 backdrop-blur-sm text-purple-600 hover:bg-purple-100/80 disabled:hover:bg-white/80 shadow-lg border border-purple-200 px-4 py-2"
            disabled={!transcript && !interimTranscript}
          />
          
          {/* Générer SMS */}
          <IconButton
            onClick={handleGenerateSMS}
            icon={<ChatBubbleIcon className="w-5 h-5" />}
            label="SMS"
            className="bg-white/80 backdrop-blur-sm text-orange-600 hover:bg-orange-100/80 disabled:hover:bg-white/80 shadow-lg border border-orange-200 px-4 py-2"
            disabled={!transcript && !interimTranscript}
          />
        </div>
      </div>


      {/* Section des notes sauvegardées */}
      {savedNotes.length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">
            Notes Sauvegardées
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedNotes.map((note) => {
              const isExpanded = expandedNotes.has(note.id);
              const displayText = note.isProcessing ? note.originalText : note.structuredText;
              const firstLine = displayText.split('\n')[0];
              
              return (
                <div
                  key={note.id}
                  className="bg-white/80 backdrop-blur-lg shadow-lg rounded-xl p-4 hover:shadow-xl transition-all duration-300 border border-slate-200 cursor-pointer"
                  onClick={() => toggleNoteExpansion(note.id)}
                >
                  {/* En-tête de la carte */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {formatTimestamp(note.timestamp)}
                      </span>
                      {note.type === 'email' && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          📧 E-mail
                        </span>
                      )}
                      {note.type === 'sms' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                          💬 SMS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* Bouton de suppression */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        aria-label="Supprimer la note"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Titre de la note */}
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">
                    {note.isProcessing ? "⏳ Traitement en cours..." : note.title}
                  </h3>

                  {/* Contenu de la note */}
                  <div className="space-y-2">
                    {/* Vue réduite (première ligne seulement) */}
                    {!isExpanded && (
                      <p className="text-slate-700 text-sm leading-relaxed line-clamp-2 mb-2">
                        {firstLine}
                      </p>
                    )}

                    {/* Vue étendue (contenu complet) */}
                    {isExpanded && (
                      <>
                        <div className="text-slate-700 text-sm leading-relaxed max-h-60 overflow-y-auto">
                          {/* Affichage formaté du texte structuré */}
                          <div className="prose prose-sm max-w-none">
                            {displayText.split('\n').map((line, index) => {
                              // Détection et formatage des éléments Markdown
                              if (line.startsWith('## ')) {
                                return <h3 key={index} className="text-lg font-semibold text-slate-800 mt-3 mb-2">{line.substring(3)}</h3>;
                              }
                              if (line.startsWith('# ')) {
                                return <h2 key={index} className="text-xl font-bold text-slate-800 mt-4 mb-3">{line.substring(2)}</h2>;
                              }
                              if (line.startsWith('### ')) {
                                return <h4 key={index} className="text-base font-semibold text-slate-700 mt-2 mb-1">{line.substring(4)}</h4>;
                              }
                              if (line.startsWith('- ') || line.startsWith('* ')) {
                                return <li key={index} className="ml-4 text-slate-600">{line.substring(2)}</li>;
                              }
                              if (line.startsWith('1. ')) {
                                return <li key={index} className="ml-4 text-slate-600 list-decimal">{line.substring(3)}</li>;
                              }
                              if (line.startsWith('**') && line.endsWith('**')) {
                                return <p key={index} className="font-semibold text-slate-800">{line.substring(2, line.length - 2)}</p>;
                              }
                              if (line.startsWith('*') && line.endsWith('*')) {
                                return <p key={index} className="italic text-slate-700">{line.substring(1, line.length - 1)}</p>;
                              }
                              if (line.trim() === '') {
                                return <br key={index} />;
                              }
                              return <p key={index} className="mb-2">{line}</p>;
                            })}
                          </div>
                        </div>
                        
                        {/* Suggestions (si disponibles) */}
                        {!note.isProcessing && note.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-600 font-medium mb-2">Suggestions :</p>
                            <ul className="text-xs text-slate-500 space-y-1">
                              {note.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-indigo-500 mr-1">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Zone de Chat - Affichage direct */}
                        {!note.isProcessing && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                              {/* Messages existants */}
                              {note.chatMessages && note.chatMessages.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                  {note.chatMessages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-xs px-3 py-2 rounded-lg text-xs relative ${
                                          msg.isUser
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-white text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <div className="pr-6 prose prose-sm max-w-none">
                                          {msg.content.split('\n').map((line, lineIndex) => {
                                            // Titres
                                            if (line.startsWith('## ')) {
                                              return <h3 key={lineIndex} className="text-sm font-semibold mt-2 mb-1">{line.substring(3)}</h3>;
                                            }
                                            if (line.startsWith('### ')) {
                                              return <h4 key={lineIndex} className="text-xs font-semibold mt-2 mb-1">{line.substring(4)}</h4>;
                                            }
                                            if (line.startsWith('# ')) {
                                              return <h2 key={lineIndex} className="text-base font-bold mt-2 mb-1">{line.substring(2)}</h2>;
                                            }
                                            
                                            // Listes
                                            if (line.startsWith('- ') || line.startsWith('* ')) {
                                              return <li key={lineIndex} className="ml-4">{line.substring(2)}</li>;
                                            }
                                            if (line.match(/^\d+\. /)) {
                                              return <li key={lineIndex} className="ml-4">{line.replace(/^\d+\. /, '')}</li>;
                                            }
                                            
                                            // Texte en gras et italique
                                            let processedLine = line;
                                            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
                                            
                                            // Ligne vide
                                            if (line.trim() === '') {
                                              return <br key={lineIndex} />;
                                            }
                                            
                                            // Texte normal
                                            return <p key={lineIndex} className="mb-1" dangerouslySetInnerHTML={{ __html: processedLine }} />;
                                          })}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                          <p className={`text-xs ${msg.isUser ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {formatTimestamp(msg.timestamp)}
                                          </p>
                                          {/* Bouton de copie pour les réponses IA */}
                                          {!msg.isUser && msg.content && (
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(msg.content);
                                                showNotification("Réponse copiée !");
                                              }}
                                              className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
                                              title="Copier la réponse"
                                            >
                                              <CopyIcon className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic mb-3">
                                  Posez une question à l'IA sur cette note...
                                </p>
                              )}

                              {/* Input de message avec icône chat */}
                              <div className="flex space-x-2">
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={chatInputs[note.id] || ''}
                                    onChange={(e) => handleChatInputChange(note.id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage(note.id)}
                                    onFocus={() => handleInputFocus(`chat-${note.id}`)}
                                    onBlur={handleInputBlur}
                                    placeholder="Posez une question à l'IA..."
                                    className="w-full text-xs pl-8 pr-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <ChatIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendChatMessage(note.id);
                                  }}
                                  disabled={!chatInputs[note.id]?.trim()}
                                  className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Envoyer le message"
                                >
                                  <SendIcon className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Indicateur de streaming pour le chat */}
                              {(isListening || isFloatingListening || interimTranscript) && activeInputId === `chat-${note.id}` && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs" aria-live="polite">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${(isListening || isFloatingListening) ? 'bg-blue-500 animate-pulse' : 'bg-blue-400'}`}></div>
                                    <span className="text-blue-700 font-medium">
                                      {(isListening || isFloatingListening) ? 'Écoute en cours...' : 'Traitement...'}
                                    </span>
                                  </div>
                                  {interimTranscript && (
                                    <div className="text-blue-600 italic">
                                      <span className="text-blue-500">Streaming : </span>
                                      {interimTranscript}
                                      <span className="inline-block w-0.5 h-3 bg-blue-400 ml-1 animate-pulse"></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      {note.isProcessing ? "Traitement en cours..." : `${isExpanded ? "Vue complète" : "Vue réduite"}`}
                    </div>
                    {!note.isProcessing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyNote(note);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        Copier
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bouton flottant pour le microphone */}
      <div
        className={`fixed z-50 cursor-move transition-all duration-200 ${
          isDragging ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{
          left: `${floatingButtonPosition.x}px`,
          top: `${floatingButtonPosition.y}px`
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <button
          onClick={handleFloatingMicClick}
          className={`w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-all duration-200 ${
            isFloatingListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
          title={isFloatingListening ? "Arrêter l'écoute" : "Démarrer l'écoute vocale"}
        >
          <MicrophoneIcon className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default App;
