
// ============================================================================
// IMPORTS ET DÉFINITIONS DES TYPES
// ============================================================================

// Import des hooks React essentiels pour l'application
// - useState : pour gérer l'état local des composants
// - useEffect : pour les effets de bord (chargement, nettoyage)
// - useRef : pour référencer des éléments DOM ou des valeurs persistantes
// - useCallback : pour mémoriser des fonctions et éviter les re-renders
// - useMemo : pour mémoriser des calculs coûteux
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Import du composant personnalisé pour les boutons avec icônes
import IconButton from './components/IconButton';

// Import de l'API Google Gemini pour l'intelligence artificielle
import { GoogleGenAI } from "@google/genai";

// ============================================================================
// INTERFACES TYPESCRIPT - DÉFINITION DES STRUCTURES DE DONNÉES
// ============================================================================

/**
 * Interface pour la reconnaissance vocale du navigateur
 * Cette interface définit la structure de l'API Web Speech Recognition
 * qui peut varier selon les navigateurs (Chrome, Safari, Firefox, etc.)
 */
interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;        // Permet une reconnaissance continue (pas d'arrêt automatique)
  interimResults: boolean;    // Affiche les résultats en temps réel pendant la parole
  lang: string;              // Langue de reconnaissance (ex: 'fr-FR' pour français)
  start: () => void;         // Méthode pour démarrer la reconnaissance
  stop: () => void;          // Méthode pour arrêter la reconnaissance
  onstart?: () => void;      // Événement déclenché quand la reconnaissance démarre
  onend?: () => void;        // Événement déclenché quand la reconnaissance se termine
  onresult?: (event: any) => void;  // Événement déclenché quand un résultat est disponible
  onerror?: (event: any) => void;   // Événement déclenché en cas d'erreur
}

/**
 * Interface pour les notes sauvegardées enrichies par l'IA Gemini
 * Une note représente un texte dicté qui a été traité et enrichi par l'intelligence artificielle
 */
interface SavedNote {
  id: string;                    // Identifiant unique de la note (timestamp)
  originalText: string;          // Texte original dicté par l'utilisateur
  title: string;                 // Titre généré automatiquement par l'IA
  structuredText: string;        // Texte reformulé et structuré par l'IA
  suggestions: string[];         // Suggestions d'approfondissement proposées par l'IA
  timestamp: Date;               // Date et heure de création de la note
  isProcessing?: boolean;        // Indique si la note est en cours de traitement par l'IA
  type?: 'note' | 'email' | 'sms'; // Type de contenu (note normale, email généré, ou SMS)
  chatMessages?: ChatMessage[];  // Historique des messages du chat IA pour cette note
}

/**
 * Interface pour les messages du chat avec l'IA
 * Chaque message peut être soit de l'utilisateur, soit de l'IA
 */
interface ChatMessage {
  id: string;           // Identifiant unique du message
  content: string;      // Contenu textuel du message
  isUser: boolean;      // true = message de l'utilisateur, false = message de l'IA
  timestamp: Date;      // Date et heure d'envoi du message
  isThinking?: boolean; // true = message de réflexion en cours, false = message normal
}



// ============================================================================
// DÉCLARATIONS GLOBALES POUR LA RECONNAISSANCE VOCALE
// ============================================================================

/**
 * Extension de l'interface Window pour inclure les APIs de reconnaissance vocale
 * Différents navigateurs utilisent des noms différents pour cette API :
 * - Chrome/Edge : SpeechRecognition
 * - Safari : webkitSpeechRecognition
 */
declare global {
  interface Window {
    SpeechRecognition: { new(): CustomSpeechRecognition };        // API standard
    webkitSpeechRecognition: { new(): CustomSpeechRecognition };  // API WebKit (Safari)
    // API Document Picture-in-Picture (Chrome/Edge)
    documentPictureInPicture?: {
      requestWindow: (options?: any) => Promise<Window>;
      window?: Window;
    };
  }
}

// ============================================================================
// COMPOSANTS D'ICÔNES SVG - INTERFACE UTILISATEUR
// ============================================================================

/**
 * Icône de microphone pour les boutons de reconnaissance vocale
 * Utilise SVG inline pour une meilleure performance (pas de requête réseau)
 * La classe 'currentColor' permet de changer la couleur via CSS
 */
const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.041h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.041a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
  </svg>
);

/**
 * Icône de copie pour les boutons de copie de texte
 * Permet de copier le texte dicté ou les notes dans le presse-papiers
 */
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625v2.625m0 0H19.5m-2.25-2.625h-1.125c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125Z" />
  </svg>
);

/**
 * Icône de poubelle pour les boutons de suppression
 * Utilisée pour supprimer des notes sauvegardées
 */
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

/**
 * Icône X (croix) pour les boutons de fermeture
 * Utilisée pour fermer des modales ou supprimer des éléments
 */
const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Icône d'enveloppe pour la génération d'emails
 * Utilisée sur le bouton qui transforme le texte dicté en email professionnel
 */
const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

/**
 * Icône de bulle de chat pour la génération de SMS
 * Utilisée sur le bouton qui transforme le texte dicté en SMS professionnel
 */
const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

/**
 * Icône de flèche vers le bas pour indiquer l'expansion
 * Utilisée pour montrer qu'un élément peut être développé
 */
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

/**
 * Icône de flèche vers le haut pour indiquer la réduction
 * Utilisée pour montrer qu'un élément peut être réduit
 */
const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

/**
 * Icône de sauvegarde avec IA (bouclier avec étoile)
 * Utilisée sur le bouton qui sauvegarde une note et l'enrichit avec l'IA
 */
const SaveWithAIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

/**
 * Icône de chat pour les interfaces de conversation avec l'IA
 * Utilisée dans les zones de chat pour indiquer la fonctionnalité de conversation
 */
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

/**
 * Icône d'envoi (avion en papier) pour les boutons d'envoi de messages
 * Utilisée dans les interfaces de chat pour envoyer des messages
 */
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

/**
 * Icône d'expansion (flèches vers l'extérieur) pour le mode plein écran
 * Utilisée pour ouvrir le chat en mode plein écran
 */
const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

/**
 * Icône de minimisation (X) pour fermer le mode plein écran
 * Utilisée pour fermer le chat en mode plein écran
 */
const MinimizeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Icône d'export (flèche vers le bas) pour l'exportation de contenu
 * Utilisée sur le bouton qui exporte la note et son chat en format texte
 */
const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// ============================================================================
// COMPOSANT PRINCIPAL DE L'APPLICATION
// ============================================================================

/**
 * Composant principal App - Point d'entrée de l'application
 * Gère toute la logique métier : reconnaissance vocale, IA, gestion des notes, chat
 */
const App: React.FC = () => {
  // ============================================================================
  // ÉTATS DE L'APPLICATION - GESTION DES DONNÉES
  // ============================================================================
  
  // États pour la reconnaissance vocale
  const [transcript, setTranscript] = useState<string>('');           // Texte final transcrit
  const [interimTranscript, setInterimTranscript] = useState<string>(''); // Texte temporaire en cours de reconnaissance
  const [isListening, setIsListening] = useState<boolean>(false);    // Indique si la reconnaissance est active
  const [error, setError] = useState<string | null>(null);           // Messages d'erreur à afficher
  const [notification, setNotification] = useState<string | null>(null); // Notifications temporaires (copie, sauvegarde, etc.)
  const [isSupported, setIsSupported] = useState<boolean>(true);     // Indique si la reconnaissance vocale est supportée
  
  // États pour la gestion des notes
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);      // Liste des notes sauvegardées
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set()); // Notes actuellement développées
  const [chatInputs, setChatInputs] = useState<{ [noteId: string]: string }>({}); // Texte des champs de chat par note
  
  // États pour le bouton flottant de reconnaissance vocale
  const [isFloatingListening, setIsFloatingListening] = useState<boolean>(false); // État du bouton flottant
  const [activeInputId, setActiveInputId] = useState<string | null>(null); // Identifiant du champ actif (principal ou chat)
  
  // États pour le mode plein écran du chat
  const [fullscreenChat, setFullscreenChat] = useState<{ noteId: string; note: SavedNote } | null>(null); // Note en mode plein écran
  
  // États pour la gestion des notes
  const [isFirstNote, setIsFirstNote] = useState<boolean>(true); // Indique si c'est la première note de l'utilisateur

  // ============================================================================
  // RÉFÉRENCES ET ÉTATS PERSISTANTS
  // ============================================================================
  
  /**
   * Référence vers l'objet de reconnaissance vocale du navigateur
   * Permet d'accéder aux méthodes start() et stop() de l'API Web Speech Recognition
   * Cette référence persiste entre les re-renders du composant
   */
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  
  /**
   * Référence pour éviter les conflits lors de l'arrêt de la reconnaissance vocale
   * Quand l'utilisateur arrête manuellement la reconnaissance, on évite de déclencher
   * les événements d'erreur qui pourraient survenir lors de l'arrêt programmatique
   */
  const isStoppingInternallyRef = useRef<boolean>(false);
  
  /**
   * Référence vers le champ de texte principal (textarea)
   * Permet de donner le focus au champ de texte et de contrôler son comportement
   * Utile pour repositionner le curseur après certaines actions
   */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  /**
   * Référence de l'identifiant du champ actif pour utilisation dans les callbacks
   * Évite de recréer les gestionnaires SpeechRecognition quand le focus change
   */
  const activeInputIdRef = useRef<string | null>(null);

  /**
   * Fenêtre flottante (Document Picture-in-Picture) pour rester au-dessus des autres fenêtres
   * Compatible Chrome/Edge uniquement à ce jour. Fallback: message d'instructions macOS.
   */
  const pipWindowRef = useRef<Window | null>(null);

  // ============================================================================
  // INITIALISATION DE L'API GEMINI - INTELLIGENCE ARTIFICIELLE
  // ============================================================================
  
  /**
   * Initialisation de l'API Google Gemini pour l'intelligence artificielle
   * Cette fonction utilise useMemo pour éviter de recréer l'instance à chaque render
   * Elle vérifie la présence et la validité de la clé API dans les variables d'environnement
   */
  const ai = useMemo(() => {
    try {
      // Récupération de la clé API depuis les variables d'environnement
      const apiKey = process.env.GEMINI_API_KEY;
      
      // Vérification que la clé API est présente et valide
      if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '') {
        console.log('API Gemini initialisée avec succès');
        return new GoogleGenAI({ apiKey: apiKey });
      } else {
        // Avertissement si la clé API n'est pas configurée
        console.warn('Clé API Gemini non configurée ou invalide. Les fonctionnalités IA seront désactivées.');
        console.warn('Vérifiez que GEMINI_API_KEY est définie dans vos variables d\'environnement.');
        return null;
      }
    } catch (error) {
      // Gestion des erreurs d'initialisation
      console.error('Erreur lors de l\'initialisation de Gemini:', error);
      return null;
    }
  }, []);

  // ============================================================================
  // EFFETS DE BORD - PERSISTANCE DES DONNÉES
  // ============================================================================
  
  /**
   * Effet de chargement des notes sauvegardées au démarrage de l'application
   * Récupère les notes depuis le localStorage et les convertit en objets JavaScript
   * Les timestamps sont convertis en objets Date pour une manipulation correcte
   */
  useEffect(() => {
    const saved = localStorage.getItem('dictée-magique-notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convertir les timestamps en objets Date pour une manipulation correcte
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

  /**
   * Ouvre une fenêtre flottante toujours au premier plan (Document PiP) si supporté
   */
  const openFloatingWindow = useCallback(async () => {
    try {
      const docPiP = window.documentPictureInPicture;
      if (!docPiP || typeof docPiP.requestWindow !== 'function') {
        showNotification(
          "Fenêtre flottante non supportée. Sur Mac, installe l'app (PWA) puis dans le Dock: Options > Affecter à > Tous les bureaux."
        );
        return;
      }

      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.focus();
        return;
      }

      const pipWin = await docPiP.requestWindow({ width: 380, height: 160 });
      pipWindowRef.current = pipWin;
      const d = pipWin.document;
      d.title = "Dictée Magique — Fenêtre flottante";
      d.body.style.margin = '0';
      d.body.innerHTML = `
        <style>
          :root { color-scheme: light dark; }
          @keyframes pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(239,68,68,.6);} 50%{ box-shadow:0 0 0 10px rgba(239,68,68,0);} }
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #ffffff; color:#0f172a; }
          .wrap { display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid #e2e8f0; }
          .btn { border:none; border-radius:9999px; width:42px; height:42px; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s ease; }
          .btn:hover { transform: scale(1.05); }
          .status { display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px; color:#334155; }
          .dot { width:10px; height:10px; border-radius:999px; background:#64748b; }
          .main { padding:8px 12px; font-size:12px; color:#475569; }
          .stream { color:#0ea5e9; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .preview { color:#64748b; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        </style>
        <div class="wrap">
          <button id="mic-btn" class="btn" title="Basculer micro">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
              <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.041h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.041a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
            </svg>
          </button>
          <div class="status"><div id="status-dot" class="dot"></div><div id="status-text">Initialisation…</div></div>
        </div>
        <div class="main">
          <div id="interim" class="stream"></div>
          <div id="preview" class="preview"></div>
        </div>
      `;

      d.getElementById('mic-btn')?.addEventListener('click', () => {
        handleListen();
      });

      pipWin.addEventListener('unload', () => {
        pipWindowRef.current = null;
      });

      // Première mise à jour d'UI
      // Le contenu sera maintenu à jour par l'effet ci-dessous
    } catch (e) {
      console.error(e);
      showNotification("Impossible d'ouvrir la fenêtre flottante.");
    }
  }, [handleListen]);

  /**
   * Synchronise le contenu de la fenêtre flottante avec l'état courant
   */
  useEffect(() => {
    const pipWin = pipWindowRef.current;
    if (!pipWin || pipWin.closed) return;
    try {
      const d = pipWin.document;
      const statusText = d.getElementById('status-text');
      const statusDot = d.getElementById('status-dot');
      const micBtn = d.getElementById('mic-btn') as HTMLButtonElement | null;
      const interimEl = d.getElementById('interim');
      const previewEl = d.getElementById('preview');

      if (statusText) statusText.textContent = isListening ? 'Écoute en cours' : 'Arrêté';
      if (statusDot) {
        (statusDot as HTMLElement).style.background = isListening ? '#ef4444' : '#64748b';
        (statusDot as HTMLElement).style.animation = isListening ? 'pulse 1.5s infinite' : 'none';
      }
      if (micBtn) {
        micBtn.style.background = isListening ? '#ef4444' : '#6366f1';
      }
      if (interimEl) interimEl.textContent = interimTranscript || '';
      if (previewEl) previewEl.textContent = transcript ? transcript.slice(-150) : '';
    } catch (e) {
      console.warn('Mise à jour PiP ignorée:', e);
    }
  }, [isListening, interimTranscript, transcript]);

  // Ferme la fenêtre flottante à la fermeture de la page
  useEffect(() => {
    return () => {
      try { pipWindowRef.current?.close(); } catch {}
      pipWindowRef.current = null;
    };
  }, []);

  /**
   * Effet de sauvegarde automatique des notes dans le localStorage
   * Se déclenche à chaque modification de la liste des notes sauvegardées
   * Assure la persistance des données entre les sessions de navigation
   */
  useEffect(() => {
    localStorage.setItem('dictée-magique-notes', JSON.stringify(savedNotes));
  }, [savedNotes]);

  // ============================================================================
  // FONCTIONS UTILITAIRES - GESTION DE L'INTERFACE UTILISATEUR
  // ============================================================================
  
  /**
   * Fonction utilitaire pour afficher des notifications temporaires
   * Affiche un message en haut à droite de l'écran pendant 2 secondes
   * Utilisée pour confirmer les actions (copie, sauvegarde, suppression, etc.)
   * 
   * @param message - Le message à afficher dans la notification
   */
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };


  
  // ============================================================================
  // INITIALISATION DE LA RECONNAISSANCE VOCALE
  // ============================================================================
  
  /**
   * Effet d'initialisation de l'API de reconnaissance vocale
   * Configure l'objet de reconnaissance vocale avec les paramètres optimaux
   * Gère la compatibilité multi-navigateurs (Chrome, Safari, Firefox, etc.)
   */
  useEffect(() => {
    // Détection de l'API de reconnaissance vocale selon le navigateur
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
      setIsSupported(false);
      return;
    }

    // Création et configuration de l'objet de reconnaissance vocale
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;      // Reconnaissance continue (pas d'arrêt automatique)
    recognition.interimResults = true;  // Affichage des résultats en temps réel
    recognition.lang = 'fr-FR';         // Langue française pour la reconnaissance

    /**
     * Gestionnaire d'événement : début de la reconnaissance vocale
     * Met à jour l'état d'écoute et efface les erreurs précédentes
     */
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isStoppingInternallyRef.current = false; 
      // Synchroniser l'état visuel du bouton flottant avec l'état réel d'écoute
      setIsFloatingListening(true);
    };

    /**
     * Gestionnaire d'événement : fin de la reconnaissance vocale
     * Met à jour l'état d'écoute et réinitialise les flags internes
     * Conserve le texte temporaire en cas d'arrêt brutal pour permettre la récupération
     */
    recognition.onend = () => {
      setIsListening(false);
      // Conservation du texte temporaire en cas d'arrêt brutal
      // L'utilisateur peut vouloir le copier ou il peut devenir final au prochain démarrage
      // setInterimTranscript(''); 
      isStoppingInternallyRef.current = false;
      // Assurer la cohérence du bouton micro si l'écoute s'interrompt
      setIsFloatingListening(false);
    };

    /**
     * Gestionnaire d'événement : résultats de la reconnaissance vocale
     * Traite les résultats finaux et temporaires de la reconnaissance
     * Gère la distinction entre le texte final et le texte en cours de reconnaissance
     * Redirige le texte vers le bon champ selon le contexte (principal ou chat)
     */
    recognition.onresult = (event: any) => { 
      let finalTranscriptChunk = '';  // Texte final validé par l'API
      let currentInterim = '';        // Texte temporaire en cours de reconnaissance

      // Parcours de tous les résultats de reconnaissance
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const segment = event.results[i][0].transcript;
        
        // Séparation entre texte final et texte temporaire
        if (event.results[i].isFinal) {
          finalTranscriptChunk += segment;
        } else {
          currentInterim += segment;
        }
      }
      
      // Traitement du texte final validé
      if (finalTranscriptChunk) {
        // Redirection vers le chat si un chat est actif (via ref pour éviter les re-inits)
        const currentActiveId = activeInputIdRef.current;
        if (currentActiveId && currentActiveId.startsWith('chat-')) {
          const noteId = currentActiveId.replace('chat-', '');
          setChatInputs(prev => ({
            ...prev,
            [noteId]: (prev[noteId] || '') + finalTranscriptChunk
          }));
        } else {
          // Sinon, ajout au transcript principal avec gestion des espaces
          setTranscript(prev => {
            const separator = (prev && !/\s$/.test(prev) && finalTranscriptChunk && !finalTranscriptChunk.startsWith(' ')) ? ' ' : '';
            let newText = (prev + separator + finalTranscriptChunk).trim();
            
            // Ajout d'un espace après la ponctuation pour faciliter la suite de la dictée
            if (/[.?!]$/.test(finalTranscriptChunk.trim())) {
              newText += ' ';
            }
            return newText;
          });
        }
      }
      
      // Mise à jour du texte temporaire en cours de reconnaissance
      setInterimTranscript(currentInterim.trim());
    };

    /**
     * Gestionnaire d'événement : erreurs de reconnaissance vocale
     * Traite les différents types d'erreurs et affiche des messages appropriés
     * Gère les erreurs d'arrêt programmatique pour éviter les faux positifs
     */
    recognition.onerror = (event: any) => { 
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = "Une erreur est survenue lors de la reconnaissance vocale.";

      // Gestion spéciale des erreurs d'arrêt programmatique
      if (event.error === 'aborted') {
        if (isStoppingInternallyRef.current) {
          isStoppingInternallyRef.current = false;
          return; // Ignorer les erreurs d'arrêt programmatique
        } else {
          errorMessage = "La reconnaissance vocale a été interrompue de manière inattendue.";
        }
      } else {
        // Traitement des différents types d'erreurs avec messages spécifiques
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
    
    // Stockage de la référence pour utilisation dans les autres fonctions
    recognitionRef.current = recognition;

    /**
     * Fonction de nettoyage appelée lors du démontage du composant
     * Arrête la reconnaissance vocale et nettoie les références
     * Évite les fuites mémoire et les événements orphelins
     */
    return () => {
      if (recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop();
        // Nettoyage des gestionnaires d'événements
        recognitionRef.current.onstart = undefined;
        recognitionRef.current.onend = undefined;
        recognitionRef.current.onresult = undefined;
        recognitionRef.current.onerror = undefined;
        recognitionRef.current = null;
      }
    };
  }, []);


  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS PRINCIPAUX - RECONNAISSANCE VOCALE
  // ============================================================================
  
  /**
   * Gestionnaire principal pour démarrer/arrêter la reconnaissance vocale
   * Utilise useCallback pour optimiser les performances et éviter les re-renders
   * Gère les vérifications de compatibilité et les erreurs de démarrage
   */
  const handleListen = useCallback(() => {
    // Vérification de la compatibilité du navigateur
    if (!isSupported) {
        setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
        return;
    }
    
    // Vérification de l'initialisation de l'objet de reconnaissance
    if (!recognitionRef.current) {
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
             setError("L'objet de reconnaissance vocale n'est pas initialisé. Essayez de rafraîchir la page.");
        } else {
            setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
        }
        return;
    }

    if (isListening) {
      // Arrêt de la reconnaissance vocale
      isStoppingInternallyRef.current = true;
      recognitionRef.current.stop();
    } else {
      // Démarrage de la reconnaissance vocale
      // Ajout d'un espace si le texte existant ne se termine pas par un espace
      setTranscript(prev => (prev && !/\s$/.test(prev) ? prev + ' ' : prev));
      setInterimTranscript(''); // Nettoyage du texte temporaire obsolète
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

  /**
   * Gestionnaire pour copier le texte dicté dans le presse-papiers
   * Combine le texte final et le texte temporaire en cours de reconnaissance
   * Gère les erreurs de copie et affiche des notifications appropriées
   */
  const handleCopy = useCallback(() => {
    // Combinaison du texte final et du texte temporaire pour la copie
    const textToCopy = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToCopy) {
      showNotification("Rien à copier.");
      return;
    }
    // Utilisation de l'API Clipboard pour copier le texte
    navigator.clipboard.writeText(textToCopy)
      .then(() => showNotification("Texte copié !"))
      .catch(err => {
        console.error('Failed to copy: ', err);
        showNotification("Erreur lors de la copie.");
      });
  }, [transcript, interimTranscript]);

  // ============================================================================
  // FONCTIONS DE TRAITEMENT IA - ENRICHISSEMENT DES NOTES
  // ============================================================================
  
  /**
   * Fonction de traitement d'une note avec l'IA Gemini
   * Analyse le texte dicté et génère un titre, une version structurée et des suggestions
   * Utilise le modèle gemini-2.5-pro pour une analyse approfondie
   * 
   * @param note - La note à traiter avec l'IA
   * @returns La note enrichie avec les résultats de l'IA
   */
  const processNoteWithGemini = useCallback(async (note: SavedNote) => {
    // Vérification de la disponibilité de l'API Gemini
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
      // Prompt détaillé pour guider l'IA dans l'analyse de la note
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

      // Appel à l'API Gemini avec le modèle le plus avancé
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en stratégie commerciale et développement de produits. Tu analyses des notes professionnelles pour les améliorer et proposer des pistes d'approfondissement.",
        },
      });

      // Nettoyage de la réponse de Gemini qui peut contenir des backticks
      let cleanResponse = (response.text || '').trim();
      
      // Suppression des backticks et "json" si présents dans la réponse
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parsing de la réponse JSON
      const result = JSON.parse(cleanResponse);
      
      // Retour de la note enrichie avec les résultats de l'IA
      return {
        ...note,
        title: result.title,
        structuredText: result.structuredText,
        suggestions: result.suggestions,
        isProcessing: false
      };
    } catch (error) {
      // Gestion des erreurs de traitement IA
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

  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS - GESTION DES NOTES
  // ============================================================================
  
  /**
   * Gestionnaire pour sauvegarder une note avec enrichissement IA
   * Crée une nouvelle note avec le texte dicté et lance le traitement IA
   * Affiche des notifications pour informer l'utilisateur du processus
   */
  const handleSaveNote = useCallback(async () => {
    // Combinaison du texte final et temporaire pour la sauvegarde
    const textToSave = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToSave) {
      showNotification("Rien à sauvegarder.");
      return;
    }
    
    // Création d'une nouvelle note avec état de traitement
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
    
    // Ajout de la note à la liste (en première position)
    setSavedNotes(prev => [newNote, ...prev]);
    showNotification("Note sauvegardée et en cours de traitement...");
    
    // Traitement de la note avec l'IA Gemini
    const processedNote = await processNoteWithGemini(newNote);
    setSavedNotes(prev => prev.map(note => 
      note.id === newNote.id ? processedNote : note
    ));
    
    showNotification("Note enrichie par l'IA !");
  }, [transcript, interimTranscript, processNoteWithGemini]);

  /**
   * Gestionnaire pour copier une note dans le presse-papiers
   * Copie le texte structuré si disponible, sinon le texte original
   * Gère les erreurs de copie et affiche des notifications
   * 
   * @param note - La note à copier
   */
  const handleCopyNote = useCallback((note: SavedNote) => {
    // Sélection du texte à copier selon l'état de traitement
    const textToCopy = note.isProcessing ? note.originalText : note.structuredText;
    navigator.clipboard.writeText(textToCopy)
      .then(() => showNotification("Note copiée !"))
      .catch(err => {
        console.error('Failed to copy note: ', err);
        showNotification("Erreur lors de la copie.");
      });
  }, []);

  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS - GÉNÉRATION DE CONTENU
  // ============================================================================
  
  /**
   * Gestionnaire pour générer un email professionnel à partir du texte dicté
   * Utilise l'IA Gemini pour transformer la note en email structuré
   * Crée une nouvelle note de type 'email' avec le contenu généré
   */
  const handleGenerateEmail = useCallback(async () => {
    // Combinaison du texte final et temporaire pour la transformation
    const textToTransform = (transcript + (interimTranscript ? ((transcript && !/\s$/.test(transcript) ? ' ' : '') + interimTranscript) : '')).trim();
    if (!textToTransform) {
      showNotification("Rien à transformer en e-mail.");
      return;
    }

    // Vérification de la disponibilité de l'IA
    if (!ai) {
      showNotification("IA non disponible pour la génération d'e-mail.");
      return;
    }

    // Création d'une nouvelle note email avec état de traitement
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

    // Ajout de la note à la liste
    setSavedNotes(prev => [emailNote, ...prev]);

    try {
      showNotification("Génération de l'e-mail en cours...");
      
      // Prompt spécialisé pour la génération d'emails professionnels
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

      // Appel à l'API Gemini pour la génération
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en communication professionnelle. Tu transformes des notes en e-mails professionnels impeccables.",
        },
      });

      // Nettoyage de la réponse de Gemini
      let cleanResponse = (response.text || '').trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parsing de la réponse JSON
      const emailData = JSON.parse(cleanResponse);
      
      // Mise à jour de la note avec les données de l'email généré
      const updatedNote: SavedNote = {
        ...emailNote,
        title: emailData.subject,
        structuredText: emailData.body,
        suggestions: [],
        isProcessing: false
      };

      // Mise à jour de la note dans la liste
      setSavedNotes(prev => prev.map(note => 
        note.id === emailNote.id ? updatedNote : note
      ));

      showNotification("E-mail professionnel généré et sauvegardé !");
      
    } catch (error) {
      // Gestion des erreurs de génération
      console.error('Erreur lors de la génération d\'e-mail:', error);
      
      // Mise à jour de la note avec l'erreur
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

  /**
   * Gestionnaire pour supprimer une note de la liste
   * Retire la note de la liste principale et de la liste des notes étendues
   * Affiche une notification de confirmation
   * 
   * @param noteId - L'identifiant de la note à supprimer
   */
  const handleDeleteNote = useCallback((noteId: string) => {
    // Suppression de la note de la liste principale
    setSavedNotes(prev => prev.filter(note => note.id !== noteId));
    // Retrait de la note de la liste des notes étendues
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });
    showNotification("Note supprimée.");
  }, []);

  /**
   * Gestionnaire pour basculer l'état d'expansion d'une note
   * Ajoute ou retire la note de la liste des notes étendues
   * Permet d'afficher/masquer le contenu détaillé de la note
   * 
   * @param noteId - L'identifiant de la note à basculer
   */
  const toggleNoteExpansion = useCallback((noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId); // Masquer la note
      } else {
        newSet.add(noteId);    // Afficher la note en détail
      }
      return newSet;
    });
  }, []);



  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS - CHAT IA
  // ============================================================================
  
  /**
   * Gestionnaire pour les changements dans les champs de saisie du chat
   * Met à jour l'état des inputs de chat pour chaque note
   * 
   * @param noteId - L'identifiant de la note
   * @param value - La nouvelle valeur du champ de saisie
   */
  const handleChatInputChange = useCallback((noteId: string, value: string) => {
    setChatInputs(prev => ({
      ...prev,
      [noteId]: value
    }));
  }, []);

  /**
   * Gestionnaire pour envoyer un message dans le chat IA
   * Crée une conversation avec l'IA en utilisant le streaming pour une réponse en temps réel
   * Gère l'historique des messages et le contexte de la note
   * Inclut la visualisation des pensées du modèle dans le chat
   * 
   * @param noteId - L'identifiant de la note pour laquelle envoyer le message
   */
  const handleSendChatMessage = useCallback(async (noteId: string) => {
    const message = chatInputs[noteId]?.trim();
    if (!message || !ai) return;

    // Création du message utilisateur
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    // Ajout du message utilisateur à l'historique
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { 
            ...note, 
            chatMessages: [...(note.chatMessages || []), userMessage]
          }
        : note
    ));

    // Vidage du champ de saisie
    setChatInputs(prev => ({
      ...prev,
      [noteId]: ''
    }));

    try {
      // Récupération de la note et création de l'historique de chat
      const note = savedNotes.find(n => n.id === noteId);
      const chatHistory = (note?.chatMessages || []).map(msg => ({
        role: msg.isUser ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      }));

      // Ajout du contexte de la note au début de l'historique
      const contextMessage = {
        role: "user" as const,
        parts: [{ text: `Note originale : "${note?.originalText}"\n\nSuggestions : ${note?.suggestions?.join(', ') || 'Aucune'}\n\nTu es un assistant expert en stratégie commerciale et développement de produits. Réponds de manière concise et utile.` }]
      };

      // Création de la session de chat avec l'IA
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [contextMessage, ...chatHistory]
      });

      // Création d'un message de réflexion pour montrer le processus de pensée
      const thinkingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "🤔 Je réfléchis à votre question...",
        isUser: false,
        timestamp: new Date(),
        isThinking: true // Nouveau flag pour identifier les messages de réflexion
      };

      // Ajout du message de réflexion à l'historique
      setSavedNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              chatMessages: [...(note.chatMessages || []), thinkingMessage]
            }
          : note
      ));

      // Simulation de progression de la réflexion
      const thinkingSteps = [
        "🤔 Je réfléchis à votre question...",
        "🧠 J'analyse le contexte de votre note...",
        "💭 Je formule une réponse appropriée...",
        "✨ Je finalise ma réponse..."
      ];

      for (let i = 0; i < thinkingSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Délai entre les étapes
        
        setSavedNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                chatMessages: note.chatMessages?.map(msg => 
                  msg.id === thinkingMessage.id 
                    ? { ...msg, content: thinkingSteps[i] }
                    : msg
                ) || []
              }
            : note
        ));
      }

      // Envoi du message avec streaming pour une réponse en temps réel
      const stream = await chat.sendMessageStream({
        message: message
      });

      let fullResponse = "";
      
      // Traitement du streaming en temps réel
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        
        // Mise à jour du message en temps réel
        setSavedNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                chatMessages: note.chatMessages?.map(msg => 
                  msg.id === thinkingMessage.id 
                    ? { ...msg, content: fullResponse, isThinking: false }
                    : msg
                ) || []
              }
            : note
        ));
      }

    } catch (error) {
      // Gestion des erreurs de génération de réponse
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

  // ============================================================================
  // FONCTIONS UTILITAIRES - FORMATAGE ET AFFICHAGE
  // ============================================================================
  
  /**
   * Fonction utilitaire pour formater les timestamps en français
   * Affiche des durées relatives (il y a X minutes/heures) ou des dates absolues
   * Utilisée pour afficher les dates de création des notes et messages
   * 
   * @param date - La date à formater
   * @returns Une chaîne de caractères formatée en français
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      // Affichage en minutes pour les durées inférieures à 1 heure
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      // Affichage en heures pour les durées inférieures à 24 heures
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      // Affichage de la date complète pour les durées supérieures à 24 heures
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS - INTERFACE UTILISATEUR
  // ============================================================================
  
  /**
   * Gestionnaire pour effacer le texte dicté
   * Réinitialise tous les états liés au texte et arrête la reconnaissance vocale
   * Redonne le focus au champ de texte principal
   */
  const handleClear = useCallback(() => {
    setTranscript('');           // Effacement du texte final
    setInterimTranscript('');    // Effacement du texte temporaire
    setError(null);              // Effacement des erreurs
    if (isListening && recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop(); // Arrêt de la reconnaissance vocale
    }
    showNotification("Texte effacé.");
    textareaRef.current?.focus(); // Retour du focus sur le champ de texte
  }, [isListening]);
  
  /**
   * Gestionnaire pour les changements dans le champ de texte principal
   * Met à jour l'état du transcript quand l'utilisateur tape manuellement
   * 
   * @param event - L'événement de changement du textarea
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(event.target.value);
  };

  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS - BOUTON FLOTTANT ET MODE PLEIN ÉCRAN
  // ============================================================================
  
  /**
   * Gestionnaire pour le clic sur le bouton flottant de microphone
   * Permet de démarrer/arrêter la reconnaissance vocale depuis n'importe où dans l'interface
   * Gère les erreurs de démarrage et la compatibilité du navigateur
   */
  const handleFloatingMicClick = useCallback(() => {
    // Vérification de la compatibilité du navigateur
    if (!isSupported) {
      setError("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
      return;
    }

    if (isFloatingListening) {
      // Arrêt de l'écoute via le bouton flottant
      if (recognitionRef.current) {
        isStoppingInternallyRef.current = true;
        recognitionRef.current.stop();
      }
      setIsFloatingListening(false);
    } else {
      // Démarrage de l'écoute via le bouton flottant
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



  /**
   * Gestionnaire pour le focus sur un champ de saisie
   * Identifie quel champ est actif pour rediriger la reconnaissance vocale
   * 
   * @param inputId - L'identifiant du champ qui reçoit le focus
   */
  const handleInputFocus = useCallback((inputId: string) => {
    setActiveInputId(inputId);
    activeInputIdRef.current = inputId;
  }, []);

  /**
   * Gestionnaire pour la perte de focus sur un champ de saisie
   * Réinitialise l'identifiant du champ actif
   */
  const handleInputBlur = useCallback(() => {
    setActiveInputId(null);
    activeInputIdRef.current = null;
  }, []);

  /**
   * Fonction pour ouvrir le chat en mode plein écran
   * Crée une modal dédiée pour une meilleure expérience de chat
   * 
   * @param note - La note pour laquelle ouvrir le chat plein écran
   */
  const openFullscreenChat = useCallback((note: SavedNote) => {
    setFullscreenChat({ noteId: note.id, note });
  }, []);

  /**
   * Fonction pour fermer le chat en mode plein écran
   * Ferme la modal et retourne à l'interface principale
   */
  const closeFullscreenChat = useCallback(() => {
    setFullscreenChat(null);
  }, []);

  // ============================================================================
  // FONCTIONS D'EXPORT - EXPORTATION DE CONTENU
  // ============================================================================
  
  /**
   * Fonction pour exporter une note complète avec son chat en format texte
   * Génère un texte structuré contenant la note originale, enrichie et tout l'historique du chat
   * Copie le contenu dans le presse-papiers avec notification
   * 
   * @param note - La note à exporter avec son contenu complet
   */
  const handleExportNote = useCallback((note: SavedNote) => {
    try {
      // Construction du contenu exporté
      let exportContent = '';
      
      // En-tête avec informations de base
      exportContent += `=== NOTE EXPORTÉE ===\n`;
      exportContent += `Titre: ${note.title}\n`;
      exportContent += `Date: ${note.timestamp.toLocaleString('fr-FR')}\n`;
      exportContent += `Type: ${note.type || 'note'}\n\n`;
      
      // Note originale
      exportContent += `--- NOTE ORIGINALE ---\n`;
      exportContent += `${note.originalText}\n\n`;
      
      // Note enrichie par l'IA
      if (note.structuredText && !note.isProcessing) {
        exportContent += `--- NOTE ENRICHIE PAR L'IA ---\n`;
        exportContent += `${note.structuredText}\n\n`;
      }
      
      // Suggestions de l'IA
      if (note.suggestions && note.suggestions.length > 0) {
        exportContent += `--- SUGGESTIONS D'APPROFONDISSEMENT ---\n`;
        note.suggestions.forEach((suggestion, index) => {
          exportContent += `${index + 1}. ${suggestion}\n`;
        });
        exportContent += `\n`;
      }
      
      // Historique du chat
      if (note.chatMessages && note.chatMessages.length > 0) {
        exportContent += `--- HISTORIQUE DU CHAT AVEC L'IA ---\n`;
        note.chatMessages.forEach((message) => {
          const timestamp = message.timestamp.toLocaleString('fr-FR');
          const role = message.isUser ? 'Utilisateur' : 'IA Gemini';
          exportContent += `[${timestamp}] ${role}:\n`;
          exportContent += `${message.content}\n\n`;
        });
      }
      
      // Copie dans le presse-papiers
      navigator.clipboard.writeText(exportContent)
        .then(() => {
          showNotification("Note exportée ! Contenu copié dans le presse-papiers.");
        })
        .catch(err => {
          console.error('Erreur lors de l\'export:', err);
          showNotification("Erreur lors de l'export. Veuillez réessayer.");
        });
        
    } catch (error) {
      console.error('Erreur lors de la génération de l\'export:', error);
      showNotification("Erreur lors de la génération de l'export.");
    }
  }, []);


  // ============================================================================
  // RENDU JSX - INTERFACE UTILISATEUR
  // ============================================================================
  
  /**
   * Rendu principal de l'application
   * Structure l'interface utilisateur avec tous les composants nécessaires
   * Inclut les notifications, la zone de dictée, les actions, les notes et le bouton flottant
   */
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
                      {/* Bouton d'export */}
                      {!note.isProcessing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportNote(note);
                          }}
                          className="text-green-600 hover:text-green-800 transition-colors p-1"
                          aria-label="Exporter la note"
                          title="Exporter la note et son chat"
                        >
                          <ExportIcon className="w-4 h-4" />
                        </button>
                      )}
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
                              {/* En-tête du chat avec bouton plein écran */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <ChatIcon className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-600">Chat avec l'IA</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFullscreenChat(note);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                  title="Ouvrir en plein écran"
                                >
                                  <ExpandIcon className="w-4 h-4" />
                                </button>
                              </div>

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
                                            : msg.isThinking
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 animate-pulse'
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
                                          <p className={`text-xs ${msg.isUser ? 'text-indigo-100' : msg.isThinking ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {formatTimestamp(msg.timestamp)}
                                          </p>
                                          {/* Bouton de copie pour les réponses IA (pas pour les messages de réflexion) */}
                                          {!msg.isUser && !msg.isThinking && msg.content && (
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

      {/* Bouton flottant fixe pour le microphone */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleFloatingMicClick}
          className={`w-16 h-16 sm:w-14 sm:h-14 rounded-full shadow-xl border-3 border-white flex items-center justify-center transition-all duration-200 hover:scale-105 ${
            isFloatingListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
          title={isFloatingListening ? "Arrêter l'écoute" : "Démarrer l'écoute vocale"}
        >
          <MicrophoneIcon className="w-7 h-7 sm:w-6 sm:h-6 text-white" />
        </button>
        {/* Bouton pour la fenêtre flottante (toujours visible) */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={openFloatingWindow}
            className="px-3 py-1.5 rounded-full text-xs bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white shadow border border-slate-200"
            title="Ouvrir une petite fenêtre flottante"
          >
            Fenêtre flottante
          </button>
        </div>
      </div>



      {/* Modal de chat plein écran */}
      {fullscreenChat && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* En-tête de la modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Chat avec l'IA - {fullscreenChat.note.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Bouton d'export */}
                  <button
                    onClick={() => handleExportNote(fullscreenChat.note)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                    title="Exporter la note et son chat"
                  >
                    <ExportIcon className="w-5 h-5" />
                  </button>
                  {/* Bouton de fermeture */}
                  <button
                    onClick={closeFullscreenChat}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Fermer le chat"
                  >
                    <MinimizeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Messages existants */}
                {fullscreenChat.note.chatMessages && fullscreenChat.note.chatMessages.length > 0 ? (
                  fullscreenChat.note.chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-2xl text-sm relative ${
                          msg.isUser
                            ? 'bg-indigo-500 text-white'
                            : msg.isThinking
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm animate-pulse'
                            : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          {msg.content.split('\n').map((line, lineIndex) => {
                            // Titres
                            if (line.startsWith('## ')) {
                              return <h3 key={lineIndex} className="text-base font-semibold mt-3 mb-2">{line.substring(3)}</h3>;
                            }
                            if (line.startsWith('### ')) {
                              return <h4 key={lineIndex} className="text-sm font-semibold mt-3 mb-2">{line.substring(4)}</h4>;
                            }
                            if (line.startsWith('# ')) {
                              return <h2 key={lineIndex} className="text-lg font-bold mt-3 mb-2">{line.substring(2)}</h2>;
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
                            return <p key={lineIndex} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />;
                          })}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <p className={`text-xs ${msg.isUser ? 'text-indigo-100' : msg.isThinking ? 'text-blue-500' : 'text-slate-400'}`}>
                            {formatTimestamp(msg.timestamp)}
                          </p>
                          {/* Bouton de copie pour les réponses IA (pas pour les messages de réflexion) */}
                          {!msg.isUser && !msg.isThinking && msg.content && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                showNotification("Réponse copiée !");
                              }}
                              className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
                              title="Copier la réponse"
                            >
                              <CopyIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ChatIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">
                      Posez une question à l'IA sur cette note...
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      L'IA vous aidera à analyser et développer vos idées
                    </p>
                  </div>
                )}

                {/* Indicateur de streaming pour le chat plein écran */}
                {(isListening || isFloatingListening || interimTranscript) && activeInputId === `chat-${fullscreenChat.note.id}` && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" aria-live="polite">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${(isListening || isFloatingListening) ? 'bg-blue-500 animate-pulse' : 'bg-blue-400'}`}></div>
                      <span className="text-blue-700 font-medium">
                        {(isListening || isFloatingListening) ? 'Écoute en cours...' : 'Traitement...'}
                      </span>
                    </div>
                    {interimTranscript && (
                      <div className="text-blue-600 italic">
                        <span className="text-blue-500">Streaming : </span>
                        {interimTranscript}
                        <span className="inline-block w-1 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="p-6 border-t border-slate-200 bg-white">
              <div className="max-w-3xl mx-auto">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInputs[fullscreenChat.note.id] || ''}
                      onChange={(e) => handleChatInputChange(fullscreenChat.note.id, e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage(fullscreenChat.note.id)}
                      onFocus={() => handleInputFocus(`chat-${fullscreenChat.note.id}`)}
                      onBlur={handleInputBlur}
                      placeholder="Posez une question à l'IA sur cette note..."
                      className="w-full text-base pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    <ChatIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                  <button
                    onClick={() => handleSendChatMessage(fullscreenChat.note.id)}
                    disabled={!chatInputs[fullscreenChat.note.id]?.trim()}
                    className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    title="Envoyer le message"
                  >
                    <SendIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT DU COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Export du composant App comme composant par défaut
 * Ce composant est le point d'entrée principal de l'application
 * Il encapsule toute la logique métier et l'interface utilisateur
 */
export default App;
