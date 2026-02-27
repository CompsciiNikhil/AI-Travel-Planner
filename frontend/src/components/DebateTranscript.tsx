import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';

interface DebateTranscriptProps {
  transcript: string | any;
}

interface DebateMessage {
  agent: string;
  preferred_flight?: string;
  preferred_hotel?: string;
  preferred_activities?: string[];
  argument: string;
  counterarguments?: string | null;
}

export const DebateTranscript = ({ transcript }: DebateTranscriptProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parseDebateData = () => {
    try {
      // If it's already an array, use it
      if (Array.isArray(transcript)) {
        return transcript;
      }
      
      // If it's a string, try to parse it
      if (typeof transcript === 'string') {
        return JSON.parse(transcript);
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing debate transcript:', error);
      return [];
    }
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Budget')) {
      return {
        bg: 'bg-green-900/20',
        border: 'border-green-500',
        text: 'text-green-400',
        icon: '💰'
      };
    } else if (agent.includes('Luxury')) {
      return {
        bg: 'bg-purple-900/20',
        border: 'border-purple-500',
        text: 'text-purple-400',
        icon: '💎'
      };
    } else if (agent.includes('Experience')) {
      return {
        bg: 'bg-blue-900/20',
        border: 'border-blue-500',
        text: 'text-blue-400',
        icon: '🎭'
      };
    } else {
      return {
        bg: 'bg-indigo-900/20',
        border: 'border-indigo-500',
        text: 'text-indigo-400',
        icon: '🏛️'
      };
    }
  };

  const debateMessages = parseDebateData();
  
  // Group messages by round (first 3 = Round 1, next 3 = Round 2)
  const round1 = debateMessages.slice(0, 3);
  const round2 = debateMessages.slice(3, 6);

  const renderDebateMessage = (msg: DebateMessage, index: number) => {
    const colors = getAgentColor(msg.agent);
    
    return (
      <div key={index} className={`mb-6 p-5 ${colors.bg} border-l-4 ${colors.border} rounded-r-xl`}>
        {/* Agent Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{colors.icon}</span>
          <h4 className={`font-bold text-lg ${colors.text}`}>
            {msg.agent}
          </h4>
        </div>

        {/* What They Recommend */}
        <div className="mb-4 space-y-2">
          <p className="text-slate-300 text-sm font-semibold">📋 Recommendations:</p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {msg.preferred_flight && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400">✈️ Flight:</span>
                <span className="text-white font-medium">{msg.preferred_flight}</span>
              </div>
            )}
            {msg.preferred_hotel && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400">🏨 Hotel:</span>
                <span className="text-white font-medium">{msg.preferred_hotel}</span>
              </div>
            )}
            {msg.preferred_activities && msg.preferred_activities.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400">🎯 Activities:</span>
                <span className="text-white font-medium">{msg.preferred_activities.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Their Argument */}
        <div className="mb-3">
          <p className="text-slate-300 text-sm font-semibold mb-2">💬 Why they chose this:</p>
          <p className="text-slate-200 text-sm leading-relaxed">
            {msg.argument}
          </p>
        </div>

        {/* Counterarguments */}
        {msg.counterarguments && msg.counterarguments !== 'null' && !msg.counterarguments.includes('No counterarguments') && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-slate-300 text-sm font-semibold mb-2">🔄 Response to others:</p>
            <p className="text-slate-200 text-sm leading-relaxed italic">
              {msg.counterarguments}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!debateMessages || debateMessages.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mt-8">
        <div className="text-center text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No debate transcript available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mt-8">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-slate-700/50 p-4 rounded-lg transition"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          <div className="text-left">
            <h3 className="text-2xl font-bold text-white">
              How Our AI Agents Chose Your Trip
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              3 smart agents debated to find the perfect recommendations for you
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-slate-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-slate-400" />
        )}
      </button>

      {/* Transcript Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6 max-h-[700px] overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="p-5 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/30">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              How It Works
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our AI agents work like a team of travel experts. Each one has different priorities:
              <span className="text-green-400 font-semibold"> Budget Agent</span> focuses on saving money,
              <span className="text-purple-400 font-semibold"> Luxury Agent</span> wants comfort and quality, and
              <span className="text-blue-400 font-semibold"> Experience Agent</span> looks for memorable adventures.
              They debate to find the perfect balance for YOU!
            </p>
          </div>

          {/* Round 1 */}
          {round1.length > 0 && (
            <div>
              <div className="mb-4">
                <h4 className="text-xl font-bold text-white text-center py-3 bg-slate-700 rounded-lg">
                  🎯 Round 1: Initial Recommendations
                </h4>
                <p className="text-center text-slate-400 text-sm mt-2">
                  Each agent shares their top picks and explains why
                </p>
              </div>
              {round1.map((msg: DebateMessage, idx: number) => renderDebateMessage(msg, idx))}
            </div>
          )}

          {/* Round 2 */}
          {round2.length > 0 && (
            <div>
              <div className="mb-4">
                <h4 className="text-xl font-bold text-white text-center py-3 bg-slate-700 rounded-lg">
                  🔥 Round 2: The Debate Heats Up!
                </h4>
                <p className="text-center text-slate-400 text-sm mt-2">
                  Agents respond to each other and defend their choices
                </p>
              </div>
              {round2.map((msg: DebateMessage, idx: number) => renderDebateMessage(msg, idx + 3))}
            </div>
          )}

          {/* Final Note */}
          <div className="p-5 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
            <p className="text-emerald-300 text-sm leading-relaxed">
              <span className="font-bold">✨ Final Decision:</span> After all this debate, our Host Agent reviewed
              all the arguments and picked the best combination for YOUR specific needs, budget, and travel style!
            </p>
          </div>
        </div>
      )}

      {/* Preview when collapsed */}
      {!isExpanded && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Click to see the full debate between our AI travel experts
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-xs text-slate-500">💰 Budget Agent</div>
            <div className="text-xs text-slate-500">💎 Luxury Agent</div>
            <div className="text-xs text-slate-500">🎭 Experience Agent</div>
          </div>
        </div>
      )}
    </div>
  );
};