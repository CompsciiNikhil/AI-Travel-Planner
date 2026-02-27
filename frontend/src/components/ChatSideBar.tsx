import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { OptionCards } from './OptionCards';

interface ChatSideBarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onSendMessage: (message: string) => void;
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
  onStartPlanning: () => void;
  isPlanning: boolean;
  currentOptions?: {
    type: 'flights' | 'hotels' | 'activities';
    options: any[];
    message: string;
  } | null;
  onSelectOption: (option: any) => void;
}

export const ChatSideBar = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  collectedInfo,
  isComplete,
  onStartPlanning,
  isPlanning,
  currentOptions,
  onSelectOption
}: ChatSideBarProps) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentOptions]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-slate-800 shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">💬 Chat Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Collected Info Cards */}
        {(collectedInfo.departure_city || collectedInfo.destination) && !currentOptions && (
          <div className="p-4 bg-slate-700/50 border-b border-slate-700 space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Trip Details:</h3>
            {collectedInfo.departure_city && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">📍 From:</span>
                <span className="text-white font-medium">{collectedInfo.departure_city}</span>
              </div>
            )}
            {collectedInfo.destination && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">🎯 To:</span>
                <span className="text-white font-medium">{collectedInfo.destination}</span>
              </div>
            )}
            {collectedInfo.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">📅 Dates:</span>
                <span className="text-white font-medium">
                  {collectedInfo.start_date} → {collectedInfo.end_date || '...'}
                </span>
              </div>
            )}
            {collectedInfo.budget && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">💰 Budget:</span>
                <span className="text-white font-medium">₹{collectedInfo.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Messages or Options */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Show conversation if no options */}
          {!currentOptions && (
            <>
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-8">
                  <p className="text-lg mb-2">👋 Hi! I'm your AI travel assistant.</p>
                  <p className="text-sm">Tell me about your travel plans!</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Show options if available */}
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
                  disabled={isPlanning}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI Reviewing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Done - Let AI Review
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Finalize Button */}
        {isComplete && !currentOptions && (
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={onStartPlanning}
              disabled={isPlanning}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Agents Reviewing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Let AI Review My Choices
                </>
              )}
            </button>
          </div>
        )}

        {/* Input */}
        {!currentOptions && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};