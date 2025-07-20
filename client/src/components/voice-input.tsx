import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onSpeaking?: (speaking: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({ onTranscript, onSpeaking, disabled, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript(interimTranscript);

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onSpeaking?.(false);
        
        let errorMessage = 'Voice recognition error occurred';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error occurred during voice recognition';
            break;
          case 'not-allowed':
            errorMessage = 'Please allow microphone access to use voice input';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Try speaking more clearly';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found or audio capture failed';
            break;
        }

        toast({
          title: 'Voice Recognition Error',
          description: errorMessage,
          variant: 'destructive',
        });
      };

      recognition.onstart = () => {
        setIsListening(true);
        onSpeaking?.(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        onSpeaking?.(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onSpeaking, toast]);

  const startListening = () => {
    if (!recognitionRef.current || disabled) return;

    try {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast({
        title: 'Voice Recognition Error',
        description: 'Failed to start voice recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (!isSupported) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <MicOff className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm">
              Voice input is not supported in your browser
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-nexus-green" />
              <span className="text-white text-sm font-medium">Voice Input</span>
              {isListening && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                  Recording
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={clearTranscript}
                variant="ghost"
                size="sm"
                disabled={!transcript && !interimTranscript}
                className="text-slate-400 hover:text-white"
              >
                Clear
              </Button>
              
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={disabled}
                className={`${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-nexus-green hover:bg-nexus-green/90 text-black'
                } shadow-lg transition-all duration-200`}
                size="sm"
              >
                {isListening ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Speak
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Transcript Display */}
          {(transcript || interimTranscript) && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600/50">
              <div className="text-white text-sm">
                {transcript}
                {interimTranscript && (
                  <span className="text-slate-400 italic">{interimTranscript}</span>
                )}
              </div>
            </div>
          )}

          {/* Visual feedback when listening */}
          {isListening && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-nexus-green rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>Click "Speak" and start talking</span>
            <span>Supports English (US)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Speech synthesis utility for text-to-speech
export class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    try {
      this.synth = window.speechSynthesis;
      this.initVoice();
      this.initialized = true;
    } catch (error) {
      console.warn('Error initializing TextToSpeech:', error);
    }
  }

  private initVoice() {
    if (!this.synth) return;
    
    const setVoice = () => {
      try {
        if (!this.synth) return;
        
        const voices = this.synth.getVoices();
        if (voices.length === 0) return;
        
        // Prefer English voices
        this.voice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      } catch (error) {
        console.warn('Error setting voice:', error);
      }
    };

    try {
      const currentVoices = this.synth.getVoices();
      if (currentVoices.length > 0) {
        setVoice();
      } else {
        this.synth.addEventListener('voiceschanged', setVoice);
      }
    } catch (error) {
      console.warn('Error initializing voice:', error);
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!text.trim() || !this.initialized || !this.synth) {
      return Promise.resolve();
    }

    try {
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;

      this.synth.speak(utterance);

      return new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
      });
    } catch (error) {
      console.warn('Error speaking text:', error);
      return Promise.resolve();
    }
  }

  stop() {
    if (this.synth && this.initialized) {
      try {
        this.synth.cancel();
      } catch (error) {
        console.warn('Error stopping speech:', error);
      }
    }
  }

  get isSpeaking() {
    if (!this.synth || !this.initialized) return false;
    
    try {
      return this.synth.speaking;
    } catch (error) {
      console.warn('Error checking speaking status:', error);
      return false;
    }
  }
}

// Global TTS instance (lazily initialized)
let ttsInstance: TextToSpeech | null = null;

export const tts = {
  get instance() {
    if (!ttsInstance) {
      ttsInstance = new TextToSpeech();
    }
    return ttsInstance;
  },
  speak: (text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    const instance = tts.instance;
    return instance ? instance.speak(text, options) : Promise.resolve();
  },
  stop: () => {
    const instance = tts.instance;
    if (instance) instance.stop();
  },
  get isSpeaking() {
    const instance = tts.instance;
    return instance ? instance.isSpeaking : false;
  }
};

// Type declarations for better TypeScript support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}