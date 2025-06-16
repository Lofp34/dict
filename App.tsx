
import React, { useState, useEffect, useRef, useCallback } from 'react';
import IconButton from './components/IconButton';

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
  onerror?: (event: any) => void; // Using 'any' for SpeechRecognitionErrorEvent
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


const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const isStoppingInternallyRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current = null;
      }
    };
  }, []);


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
          placeholder={!isListening && !transcript && !interimTranscript ? "Appuyez sur le microphone pour commencer la dictée..." : ""}
          aria-label="Texte de la dictée"
          rows={10} // Initial rows, actual height controlled by flex layout
        />
        {(isListening || interimTranscript) && (
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


      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 w-full max-w-md pb-4">
        <IconButton
          onClick={handleClear}
          icon={<TrashIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
          label="Effacer le texte"
          className="bg-white/60 backdrop-blur-sm text-rose-600 hover:bg-rose-100/80 disabled:hover:bg-white/60 shadow-lg border border-rose-200"
          disabled={!transcript && !interimTranscript}
        />
        <IconButton
          onClick={handleListen}
          icon={<MicrophoneIcon className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${isListening ? 'text-red-500' : 'text-white'}`} />}
          label={isListening ? 'Arrêter la dictée' : 'Commencer la dictée'}
          className={`
            ${isListening ? 'bg-rose-500 hover:bg-rose-600 mic-pulse-conditional' : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'} 
            text-white p-4 sm:p-5 shadow-xl transform hover:scale-105 active:scale-95
          `}
          disabled={!isSupported}
          active={isListening}
        />
        <IconButton
          onClick={handleCopy}
          icon={<CopyIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
          label="Copier le texte"
          className="bg-white/60 backdrop-blur-sm text-indigo-600 hover:bg-indigo-100/80 disabled:hover:bg-white/60 shadow-lg border border-indigo-200"
          disabled={!transcript && !interimTranscript}
        />
      </div>
    </div>
  );
};

export default App;
