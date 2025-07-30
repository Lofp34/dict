# 🛠️ Guide des Bonnes Pratiques - Dictée Magique

## 🎯 Introduction

Ce guide présente les bonnes pratiques de développement spécifiques à l'application **Dictée Magique**. Il s'adresse aux développeurs qui souhaitent comprendre, maintenir et améliorer le code.

---

## 📋 Standards de Code

### 🎨 Convention de Nommage

#### **Composants React**
```typescript
// ✅ Bon : PascalCase pour les composants
const VoiceRecognition: React.FC = () => { ... };
const NoteCard: React.FC<NoteCardProps> = ({ note }) => { ... };
const FullscreenChat: React.FC<FullscreenChatProps> = ({ note }) => { ... };

// ❌ Éviter : camelCase pour les composants
const voiceRecognition: React.FC = () => { ... };
```

#### **Hooks Personnalisés**
```typescript
// ✅ Bon : Préfixe "use" + PascalCase
export const useVoiceRecognition = () => { ... };
export const useNotes = () => { ... };
export const useAI = () => { ... };

// ❌ Éviter : Sans préfixe "use"
export const voiceRecognition = () => { ... };
```

#### **Interfaces TypeScript**
```typescript
// ✅ Bon : PascalCase, nom descriptif
interface SavedNote {
  id: string;
  originalText: string;
  title: string;
  // ...
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// ❌ Éviter : Noms génériques
interface Note { ... }
interface Message { ... }
```

#### **Variables et Fonctions**
```typescript
// ✅ Bon : camelCase, noms descriptifs
const handleSaveNote = useCallback(async () => { ... });
const processNoteWithGemini = useCallback(async (note: SavedNote) => { ... });
const isListening = useState<boolean>(false);
const interimTranscript = useState<string>('');

// ❌ Éviter : Noms trop courts ou génériques
const save = useCallback(async () => { ... });
const process = useCallback(async (n: SavedNote) => { ... });
const listening = useState<boolean>(false);
const interim = useState<string>('');
```

### 📁 Organisation des Fichiers

#### **Structure Recommandée**
```
src/
├── components/           # Composants React
│   ├── VoiceRecognition/
│   │   ├── index.ts      # Export principal
│   │   ├── VoiceRecognition.tsx
│   │   ├── useVoiceRecognition.ts
│   │   └── types.ts
│   ├── Notes/
│   │   ├── index.ts
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   └── types.ts
│   └── UI/
│       ├── IconButton.tsx
│       └── icons/
├── hooks/               # Hooks personnalisés
│   ├── useLocalStorage.ts
│   ├── useNotifications.ts
│   └── index.ts
├── context/             # Context API
│   ├── NotesContext.tsx
│   └── types.ts
├── services/            # Services externes
│   ├── gemini.ts
│   ├── speech.ts
│   └── storage.ts
├── utils/               # Utilitaires
│   ├── markdown.ts
│   ├── formatters.ts
│   └── validators.ts
├── types/               # Types globaux
│   └── index.ts
└── App.tsx              # Composant principal
```

#### **Convention d'Export**
```typescript
// ✅ Bon : Export nommé dans index.ts
// components/VoiceRecognition/index.ts
export { VoiceRecognition } from './VoiceRecognition';
export { useVoiceRecognition } from './useVoiceRecognition';
export type { VoiceRecognitionProps } from './types';

// ✅ Bon : Import depuis le dossier
import { VoiceRecognition, useVoiceRecognition } from '@/components/VoiceRecognition';
```

---

## 🧩 Patterns de Composants

### 🎯 Composants Fonctionnels avec TypeScript

```typescript
// ✅ Bon : Interface Props bien définie
interface NoteCardProps {
  note: SavedNote;
  isExpanded: boolean;
  onToggleExpansion: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onCopy: (note: SavedNote) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isExpanded,
  onToggleExpansion,
  onDelete,
  onCopy
}) => {
  return (
    <div className="note-card">
      {/* Contenu du composant */}
    </div>
  );
};
```

### 🔄 Hooks Personnalisés

```typescript
// ✅ Bon : Hook avec gestion d'état et logique métier
export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const startListening = useCallback(() => {
    // Logique de démarrage
  }, []);
  
  const stopListening = useCallback(() => {
    // Logique d'arrêt
  }, []);
  
  // Nettoyage des ressources
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);
  
  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  };
};
```

### 🎨 Composants avec Styling

```typescript
// ✅ Bon : Classes Tailwind organisées
const NoteCard: React.FC<NoteCardProps> = ({ note, isExpanded }) => {
  return (
    <div
      className={cn(
        // Base styles
        "bg-white/80 backdrop-blur-lg shadow-lg rounded-xl p-4",
        // Interactive states
        "hover:shadow-xl transition-all duration-300",
        // Conditional styles
        isExpanded && "ring-2 ring-indigo-200",
        // Responsive design
        "border border-slate-200 cursor-pointer"
      )}
    >
      {/* Contenu */}
    </div>
  );
};

// ✅ Bon : Utilisation de cn() pour les classes conditionnelles
import { cn } from '@/utils/cn';

const buttonClasses = cn(
  "px-4 py-2 rounded-lg transition-colors",
  isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-700",
  disabled && "opacity-50 cursor-not-allowed"
);
```

---

## 🧠 Gestion d'État

### 📊 Context API

```typescript
// ✅ Bon : Context avec types stricts
interface NotesContextType {
  notes: SavedNote[];
  expandedNotes: Set<string>;
  addNote: (note: SavedNote) => void;
  updateNote: (id: string, updates: Partial<SavedNote>) => void;
  deleteNote: (id: string) => void;
  toggleExpansion: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  const addNote = useCallback((note: SavedNote) => {
    setNotes(prev => [note, ...prev]);
  }, []);
  
  const updateNote = useCallback((id: string, updates: Partial<SavedNote>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  }, []);
  
  const value = useMemo(() => ({
    notes,
    expandedNotes,
    addNote,
    updateNote,
    // ... autres méthodes
  }), [notes, expandedNotes, addNote, updateNote]);
  
  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

// ✅ Bon : Hook pour utiliser le context
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
};
```

### 🔄 Optimisation des Re-renders

```typescript
// ✅ Bon : useMemo pour les calculs coûteux
const processedNotes = useMemo(() => {
  return notes.map(note => ({
    ...note,
    displayText: note.isProcessing ? note.originalText : note.structuredText,
    formattedDate: formatTimestamp(note.timestamp)
  }));
}, [notes]);

// ✅ Bon : useCallback pour les fonctions passées en props
const handleNoteClick = useCallback((noteId: string) => {
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

// ✅ Bon : React.memo pour les composants coûteux
export const NoteCard = React.memo<NoteCardProps>(({ note, isExpanded, onToggle }) => {
  return (
    <div onClick={() => onToggle(note.id)}>
      {/* Contenu */}
    </div>
  );
});
```

---

## 🔧 Gestion des Erreurs

### 🛡️ Try-Catch Systématique

```typescript
// ✅ Bon : Gestion d'erreur complète
const processNoteWithGemini = useCallback(async (note: SavedNote) => {
  if (!ai) {
    console.warn('API Gemini non disponible');
    return createFallbackNote(note);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: buildPrompt(note.originalText),
      config: {
        systemInstruction: "Tu es un expert en stratégie commerciale...",
      },
    });
    
    return parseResponse(response, note);
  } catch (error) {
    console.error('Erreur lors du traitement Gemini:', error);
    return createErrorNote(note, error);
  }
}, [ai]);

// ✅ Bon : Fonctions utilitaires pour la gestion d'erreur
const createFallbackNote = (note: SavedNote): SavedNote => ({
  ...note,
  title: "Note (IA non disponible)",
  structuredText: note.originalText,
  suggestions: ["Fonctionnalité IA désactivée"],
  isProcessing: false
});

const createErrorNote = (note: SavedNote, error: unknown): SavedNote => ({
  ...note,
  title: "Note non traitée",
  structuredText: note.originalText,
  suggestions: ["Erreur de traitement"],
  isProcessing: false
});
```

### 🚨 Validation des Données

```typescript
// ✅ Bon : Validation des entrées
const validateNote = (note: unknown): SavedNote => {
  if (!note || typeof note !== 'object') {
    throw new Error('Note invalide: doit être un objet');
  }
  
  const noteObj = note as any;
  
  if (!noteObj.id || typeof noteObj.id !== 'string') {
    throw new Error('Note invalide: ID manquant ou invalide');
  }
  
  if (!noteObj.originalText || typeof noteObj.originalText !== 'string') {
    throw new Error('Note invalide: texte original manquant ou invalide');
  }
  
  if (!noteObj.timestamp || !(noteObj.timestamp instanceof Date)) {
    throw new Error('Note invalide: timestamp manquant ou invalide');
  }
  
  return noteObj as SavedNote;
};

// ✅ Bon : Utilisation dans le code
useEffect(() => {
  const saved = localStorage.getItem('dictée-magique-notes');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const validatedNotes = parsed.map((note: any) => {
        const validatedNote = validateNote(note);
        return {
          ...validatedNote,
          timestamp: new Date(validatedNote.timestamp)
        };
      });
      setSavedNotes(validatedNotes);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      // Optionnel : nettoyer le localStorage corrompu
      localStorage.removeItem('dictée-magique-notes');
    }
  }
}, []);
```

---

## 🎤 Reconnaissance Vocale

### 🔧 Configuration Robuste

```typescript
// ✅ Bon : Configuration avec fallbacks
const initializeSpeechRecognition = (): CustomSpeechRecognition | null => {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognitionAPI) {
    console.warn('Speech Recognition non supporté par ce navigateur');
    return null;
  }
  
  try {
    const recognition = new SpeechRecognitionAPI();
    
    // Configuration de base
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';
    
    return recognition;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Speech Recognition:', error);
    return null;
  }
};

// ✅ Bon : Gestion des événements avec types
const setupRecognitionEvents = (
  recognition: CustomSpeechRecognition,
  callbacks: {
    onStart: () => void;
    onEnd: () => void;
    onResult: (final: string, interim: string) => void;
    onError: (error: string) => void;
  }
) => {
  recognition.onstart = () => {
    callbacks.onStart();
  };
  
  recognition.onend = () => {
    callbacks.onEnd();
  };
  
  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    callbacks.onResult(finalTranscript, interimTranscript);
  };
  
  recognition.onerror = (event: any) => {
    const errorMessage = getErrorMessage(event.error);
    callbacks.onError(errorMessage);
  };
};

// ✅ Bon : Messages d'erreur localisés
const getErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    'no-speech': "Aucune parole n'a été détectée. Veuillez réessayer.",
    'audio-capture': "Problème de capture audio. Vérifiez votre microphone.",
    'not-allowed': "L'accès au microphone a été refusé.",
    'network': "Erreur de réseau. Vérifiez votre connexion internet.",
    'service-not-allowed': "Le service de reconnaissance vocale est désactivé.",
    'aborted': "La reconnaissance vocale a été interrompue.",
    'language-not-supported': "La langue française n'est pas supportée."
  };
  
  return errorMessages[error] || `Une erreur inattendue est survenue (${error}).`;
};
```

---

## 🤖 Intégration IA

### 🚀 Service Modulaire

```typescript
// ✅ Bon : Classe de service avec gestion d'erreur
export class GeminiService {
  private ai: GoogleGenAI | null;
  private isInitialized: boolean = false;
  
  constructor() {
    this.ai = this.initializeAI();
    this.isInitialized = this.ai !== null;
  }
  
  private initializeAI(): GoogleGenAI | null {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
        console.warn('Clé API Gemini non configurée');
        return null;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      console.log('API Gemini initialisée avec succès');
      return ai;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Gemini:', error);
      return null;
    }
  }
  
  async processNote(note: SavedNote): Promise<ProcessedNote> {
    if (!this.isInitialized || !this.ai) {
      return this.createFallbackNote(note);
    }
    
    try {
      const prompt = this.buildNotePrompt(note.originalText);
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "Tu es un expert en stratégie commerciale et développement de produits.",
        },
      });
      
      return this.parseResponse(response, note);
    } catch (error) {
      console.error('Erreur lors du traitement Gemini:', error);
      return this.createErrorNote(note, error);
    }
  }
  
  private buildNotePrompt(originalText: string): string {
    return `
      Tu es un expert en stratégie commerciale et développement de produits. 
      Analyse cette note professionnelle et fournis :
      1. Un titre court et percutant (max 8 mots)
      2. Une reformulation structurée qui clarifie et complète la pensée
      3. 2-3 suggestions d'approfondissement ou questions stratégiques
      
      Note originale : "${originalText}"
      
      IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide :
      {
        "title": "Titre de la note",
        "structuredText": "Texte reformulé et structuré",
        "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
      }
    `;
  }
  
  private parseResponse(response: any, originalNote: SavedNote): ProcessedNote {
    let cleanResponse = (response.text || '').trim();
    
    // Nettoyage des backticks Markdown
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      const result = JSON.parse(cleanResponse);
      
      return {
        ...originalNote,
        title: result.title || "Note traitée",
        structuredText: result.structuredText || originalNote.originalText,
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        isProcessing: false
      };
    } catch (parseError) {
      console.error('Erreur lors du parsing de la réponse JSON:', parseError);
      return this.createErrorNote(originalNote, parseError);
    }
  }
  
  private createFallbackNote(note: SavedNote): ProcessedNote {
    return {
      ...note,
      title: "Note (IA non disponible)",
      structuredText: note.originalText,
      suggestions: ["Fonctionnalité IA désactivée"],
      isProcessing: false
    };
  }
  
  private createErrorNote(note: SavedNote, error: unknown): ProcessedNote {
    return {
      ...note,
      title: "Note non traitée",
      structuredText: note.originalText,
      suggestions: ["Erreur de traitement"],
      isProcessing: false
    };
  }
}
```

---

## 💾 Persistance des Données

### 💿 Gestion du localStorage

```typescript
// ✅ Bon : Hook personnalisé pour localStorage
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue] as const;
};

// ✅ Bon : Utilisation avec validation
const [notes, setNotes] = useLocalStorage<SavedNote[]>('dictée-magique-notes', []);

// Validation des notes au chargement
useEffect(() => {
  const validNotes = notes.filter(note => {
    try {
      validateNote(note);
      return true;
    } catch (error) {
      console.warn('Note invalide détectée et supprimée:', note, error);
      return false;
    }
  });
  
  if (validNotes.length !== notes.length) {
    setNotes(validNotes);
  }
}, [notes, setNotes]);
```

---

## 🎨 Styling et Design

### 🎯 Classes Tailwind Organisées

```typescript
// ✅ Bon : Organisation des classes par catégorie
const buttonClasses = cn(
  // Base styles
  "px-4 py-2 rounded-lg font-medium transition-all duration-200",
  
  // Interactive states
  "hover:scale-105 active:scale-95",
  
  // Conditional styles
  isActive 
    ? "bg-indigo-500 text-white shadow-lg hover:bg-indigo-600" 
    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  
  // Disabled state
  disabled && "opacity-50 cursor-not-allowed hover:scale-100",
  
  // Responsive design
  "text-sm sm:text-base"
);

// ✅ Bon : Composants avec variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  children,
  onClick 
}) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200";
  
  const variantClasses = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && "opacity-50 cursor-not-allowed"
  );
  
  return (
    <button 
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### 📱 Responsive Design

```typescript
// ✅ Bon : Classes responsive organisées
const cardClasses = cn(
  // Mobile first
  "w-full p-4 rounded-lg shadow-md",
  
  // Tablet
  "sm:p-6 sm:rounded-xl",
  
  // Desktop
  "md:p-8 md:rounded-2xl lg:max-w-2xl"
);

// ✅ Bon : Grilles responsive
const gridClasses = cn(
  // Mobile: 1 colonne
  "grid grid-cols-1 gap-4",
  
  // Tablet: 2 colonnes
  "sm:grid-cols-2 sm:gap-6",
  
  // Desktop: 3 colonnes
  "lg:grid-cols-3 lg:gap-8"
);

// ✅ Bon : Textes responsive
const titleClasses = cn(
  "text-2xl font-bold text-slate-800",
  "sm:text-3xl",
  "lg:text-4xl"
);
```

---

## 🧪 Tests

### 📋 Structure des Tests

```typescript
// ✅ Bon : Tests organisés par fonctionnalité
// __tests__/hooks/useVoiceRecognition.test.ts
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

describe('useVoiceRecognition', () => {
  beforeEach(() => {
    // Mock de SpeechRecognition
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      continuous: false,
      interimResults: false,
      lang: '',
      start: jest.fn(),
      stop: jest.fn(),
      onstart: null,
      onend: null,
      onresult: null,
      onerror: null
    }));
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('startListening', () => {
    it('should start listening when called', () => {
      const { result } = renderHook(() => useVoiceRecognition());
      
      act(() => {
        result.current.startListening();
      });
      
      expect(result.current.isListening).toBe(true);
    });
    
    it('should handle errors gracefully', () => {
      const mockRecognition = global.SpeechRecognition();
      mockRecognition.start.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const { result } = renderHook(() => useVoiceRecognition());
      
      act(() => {
        result.current.startListening();
      });
      
      expect(result.current.error).toBeTruthy();
      expect(result.current.isListening).toBe(false);
    });
  });
  
  describe('stopListening', () => {
    it('should stop listening when called', () => {
      const { result } = renderHook(() => useVoiceRecognition());
      
      act(() => {
        result.current.startListening();
        result.current.stopListening();
      });
      
      expect(result.current.isListening).toBe(false);
    });
  });
});

// ✅ Bon : Tests de composants
// __tests__/components/NoteCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteCard } from '@/components/Notes/NoteCard';

describe('NoteCard', () => {
  const mockNote = {
    id: '1',
    title: 'Test Note',
    originalText: 'Test content',
    structuredText: 'Structured content',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    timestamp: new Date('2024-01-01'),
    type: 'note' as const
  };
  
  const defaultProps = {
    note: mockNote,
    isExpanded: false,
    onToggleExpansion: jest.fn(),
    onDelete: jest.fn(),
    onCopy: jest.fn()
  };
  
  it('should render note title and content', () => {
    render(<NoteCard {...defaultProps} />);
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Structured content')).toBeInTheDocument();
  });
  
  it('should call onToggleExpansion when clicked', () => {
    render(<NoteCard {...defaultProps} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(defaultProps.onToggleExpansion).toHaveBeenCalledWith('1');
  });
  
  it('should show suggestions when expanded', () => {
    render(<NoteCard {...defaultProps} isExpanded={true} />);
    
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });
  
  it('should call onDelete when delete button is clicked', () => {
    render(<NoteCard {...defaultProps} />);
    
    const deleteButton = screen.getByLabelText('Supprimer la note');
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
  });
});
```

---

## 🚀 Performance

### ⚡ Optimisations Recommandées

```typescript
// ✅ Bon : Lazy loading des composants
const FullscreenChat = lazy(() => import('./components/Chat/FullscreenChat'));
const VoiceRecognition = lazy(() => import('./components/VoiceRecognition'));

// ✅ Bon : Suspense avec fallback
<Suspense fallback={<div className="loading-spinner">Chargement...</div>}>
  <FullscreenChat note={selectedNote} />
</Suspense>

// ✅ Bon : Debounce pour les inputs
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// ✅ Bon : Virtualisation pour les longues listes
import { FixedSizeList as List } from 'react-window';

const VirtualizedNoteList: React.FC<{ notes: SavedNote[] }> = ({ notes }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <NoteCard note={notes[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={notes.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

---

## 🔒 Sécurité

### 🛡️ Validation et Sanitisation

```typescript
// ✅ Bon : Sanitisation des entrées utilisateur
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    // Supprimer les scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Supprimer les protocoles dangereux
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Supprimer les événements inline
    .replace(/on\w+\s*=/gi, '')
    // Limiter la longueur
    .slice(0, 10000);
};

// ✅ Bon : Validation des URLs
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ✅ Bon : Validation des emails
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

---

## 📝 Documentation

### 📚 Commentaires et JSDoc

```typescript
/**
 * Hook personnalisé pour la gestion de la reconnaissance vocale
 * 
 * @returns {Object} Objet contenant l'état et les méthodes de reconnaissance vocale
 * @returns {boolean} returns.isListening - Indique si l'écoute est active
 * @returns {string} returns.transcript - Texte final transcrit
 * @returns {string} returns.interimTranscript - Texte temporaire en cours
 * @returns {string|null} returns.error - Message d'erreur éventuel
 * @returns {Function} returns.startListening - Fonction pour démarrer l'écoute
 * @returns {Function} returns.stopListening - Fonction pour arrêter l'écoute
 * 
 * @example
 * ```typescript
 * const { isListening, transcript, startListening, stopListening } = useVoiceRecognition();
 * 
 * return (
 *   <div>
 *     <button onClick={startListening}>Démarrer</button>
 *     <button onClick={stopListening}>Arrêter</button>
 *     <p>{transcript}</p>
 *   </div>
 * );
 * ```
 */
export const useVoiceRecognition = () => {
  // Implementation...
};

/**
 * Traite une note avec l'IA Gemini pour générer un titre, 
 * une reformulation structurée et des suggestions
 * 
 * @param {SavedNote} note - La note à traiter
 * @returns {Promise<SavedNote>} La note enrichie par l'IA
 * 
 * @throws {Error} Si l'API Gemini n'est pas disponible
 * @throws {Error} Si la réponse de l'IA est invalide
 * 
 * @example
 * ```typescript
 * const processedNote = await processNoteWithGemini({
 *   id: '1',
 *   originalText: 'Ma note originale',
 *   title: '',
 *   structuredText: '',
 *   suggestions: [],
 *   timestamp: new Date()
 * });
 * ```
 */
export const processNoteWithGemini = async (note: SavedNote): Promise<SavedNote> => {
  // Implementation...
};
```

---

## 🎉 Conclusion

Ce guide des bonnes pratiques fournit une base solide pour maintenir et améliorer l'application **Dictée Magique**. En suivant ces conventions :

- ✅ **Code plus lisible** et maintenable
- ✅ **Moins de bugs** grâce aux validations
- ✅ **Performance optimisée** avec les bonnes pratiques React
- ✅ **Tests robustes** pour la fiabilité
- ✅ **Sécurité renforcée** avec validation et sanitisation
- ✅ **Documentation claire** pour les futurs développeurs

Ces pratiques peuvent être adaptées et étendues selon les besoins spécifiques du projet. 