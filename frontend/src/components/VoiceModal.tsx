import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { OptionCards } from './OptionCards';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onStartPlanning: () => void;
  isPlanning: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  collectedInfo: {
    departure_city: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    selected_flight: any;
    selected_hotel: any;
    selected_activities: any[];
  };
  isComplete: boolean;
  currentOptions?: {
    type: 'flights' | 'hotels' | 'activities';
    options: any[];
    message: string;
  } | null;
  onSelectOption: (option: any) => void;
}

export const VoiceModal = ({
  isOpen,
  onClose,
  onSendMessage,
  onStartPlanning,
  isPlanning,
  messages,
  collectedInfo,
  isComplete,
  currentOptions,
  onSelectOption
}: VoiceModalProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenIndexRef = useRef(-1);
  const isBotSpeakingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentOptions]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      if (isBotSpeakingRef.current) {
        console.log('🔇 Bot is speaking, ignoring user input');
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      if (finalTranscript) {
        console.log('🎤 You said:', finalTranscript);
        onSendMessage(finalTranscript);
        setTranscript('');
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening && !isBotSpeakingRef.current && !isComplete) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Recognition restart error:', e);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [isListening, onSendMessage, isComplete]);

  // Auto-speak NEW assistant messages
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const currentIndex = messages.length - 1;
    
    console.log('📨 Last message:', lastMsg.role, 'Index:', currentIndex, 'Last spoken:', lastSpokenIndexRef.current);
    
    if (lastMsg.role === 'assistant' && currentIndex > lastSpokenIndexRef.current) {
      console.log('🔊 New assistant message detected, speaking...');
      lastSpokenIndexRef.current = currentIndex;
      speakText(lastMsg.content);
    }
  }, [messages, isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      console.log('🛑 Stopping listening');
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      console.log('▶️ Starting listening');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const speakText = (text: string) => {
    console.log('🔊 Bot speaking:', text.substring(0, 50) + '...');
    
    isBotSpeakingRef.current = true;
    setIsSpeaking(true);

    if (isListening && recognitionRef.current) {
      console.log('⏸️ Pausing listening for bot speech');
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsListening(false);
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      console.log('✅ Bot finished speaking, waiting before resuming...');
      
      setTimeout(() => {
        isBotSpeakingRef.current = false;
        setIsSpeaking(false);
        
        if (isOpen && !isComplete) {
          console.log('▶️ Resuming listening...');
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }, 500);
        }
      }, 1000);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      isBotSpeakingRef.current = false;
      setIsSpeaking(false);
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 300);
  };

  if (!isOpen) return null;

  const getSelectedIds = () => {
    if (currentOptions?.type === 'flights' && collectedInfo.selected_flight) {
      return [collectedInfo.selected_flight.id];
    }
    if (currentOptions?.type === 'hotels' && collectedInfo.selected_hotel) {
      return [collectedInfo.selected_hotel.id];
    }
    if (currentOptions?.type === 'activities') {
      return collectedInfo.selected_activities.map((a: any) => a.id);
    }
    return [];
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">
              🎤 Voice Assistant
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-6 h-6 text-slate-300" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="text-center">
              {isSpeaking && (
                <div className="text-purple-400 font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Speaking...
                </div>
              )}
              {isListening && !isSpeaking && (
                <div className="text-indigo-400 font-medium animate-pulse">
                  🎧 Listening...
                </div>
              )}
              {!isListening && !isSpeaking && (
                <div className="text-slate-400 font-medium">
                  {isComplete ? '✅ Ready to finalize' : 'Click the mic to start'}
                </div>
              )}
            </div>

            {/* Microphone Button */}
            {!currentOptions && (
              <div className="flex justify-center">
                <button
                  onClick={toggleListening}
                  disabled={isSpeaking || isComplete}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse shadow-lg shadow-red-500/50'
                      : isComplete
                      ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isListening ? (
                    <MicOff className="w-16 h-16 text-white" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </button>
              </div>
            )}

            {/* Live Transcript */}
            {transcript && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-300 mb-1">Hearing:</p>
                <p className="text-white font-medium">{transcript}</p>
              </div>
            )}

            {/* Collected Info */}
            {(collectedInfo.departure_city || collectedInfo.destination) && !currentOptions && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Trip Details:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {collectedInfo.departure_city && (
                    <div>
                      <span className="text-slate-400">From:</span>
                      <span className="text-white font-medium ml-2">{collectedInfo.departure_city}</span>
                    </div>
                  )}
                  {collectedInfo.destination && (
                    <div>
                      <span className="text-slate-400">To:</span>
                      <span className="text-white font-medium ml-2">{collectedInfo.destination}</span>
                    </div>
                  )}
                  {collectedInfo.start_date && (
                    <div>
                      <span className="text-slate-400">Start:</span>
                      <span className="text-white font-medium ml-2">{collectedInfo.start_date}</span>
                    </div>
                  )}
                  {collectedInfo.end_date && (
                    <div>
                      <span className="text-slate-400">End:</span>
                      <span className="text-white font-medium ml-2">{collectedInfo.end_date}</span>
                    </div>
                  )}
                  {collectedInfo.budget && (
                    <div>
                      <span className="text-slate-400">Budget:</span>
                      <span className="text-white font-medium ml-2">₹{collectedInfo.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Option Cards */}
            {currentOptions && (
              <div className="space-y-4">
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {currentOptions.type === 'flights' && '✈️ Choose Your Flight'}
                    {currentOptions.type === 'hotels' && '🏨 Choose Your Hotel'}
                    {currentOptions.type === 'activities' && '🎯 Choose Activities'}
                  </h3>
                  <p className="text-slate-300 text-sm">
                    {currentOptions.type === 'activities' 
                      ? 'Select as many as you like! Click "Done" when finished.'
                      : 'Click on your preferred option'}
                  </p>
                </div>

                <OptionCards
                  type={currentOptions.type}
                  options={currentOptions.options}
                  onSelect={onSelectOption}
                  selectedIds={getSelectedIds()}
                />

                {/* Done button for activities */}
                {currentOptions.type === 'activities' && collectedInfo.selected_activities.length > 0 && (
                  <button
                    onClick={onStartPlanning}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-6 h-6" />
                    Done - Let AI Review My Choices
                  </button>
                )}
              </div>
            )}

            {/* Conversation History */}
            {!currentOptions && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400">Conversation:</h3>
                {messages.slice(-5).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/20 border border-indigo-500/30'
                        : 'bg-slate-700/50 border border-slate-600'
                    }`}
                  >
                    <p className="text-xs text-slate-400 mb-1">
                      {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                    </p>
                    <p className="text-sm text-white">{msg.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer - Finalize Button */}
          {isComplete && !currentOptions && (
            <div className="p-6 border-t border-slate-700 bg-slate-800/50">
              <button
                onClick={onStartPlanning}
                disabled={isPlanning}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    AI Agents Reviewing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Let AI Review My Choices
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};