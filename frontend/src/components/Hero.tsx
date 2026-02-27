import { Mic, MessageCircle } from 'lucide-react';

interface HeroProps {
  onVoiceClick: () => void;
  onChatClick: () => void;
}

export const Hero = ({ onVoiceClick, onChatClick }: HeroProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Airplanes */}
        <div className="airplane-container">
          <svg
            className="airplane airplane-1"
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
              fill="currentColor"
              className="text-indigo-500/30"
            />
          </svg>
          <svg
            className="airplane airplane-2"
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
              fill="currentColor"
              className="text-purple-500/20"
            />
          </svg>
          <svg
            className="airplane airplane-3"
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
              fill="currentColor"
              className="text-pink-500/20"
            />
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Main Title */}
        <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in">
          AI Travel Planner
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 mb-12 animate-fade-in-delayed">
          Book smarter with voice-powered AI recommendations
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-delayed-more">
          {/* Voice Button */}
          <button
            onClick={onVoiceClick}
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-105 flex items-center gap-3 min-w-[240px] justify-center"
          >
            <Mic className="w-6 h-6 group-hover:animate-pulse" />
            <span className="text-lg">Start Voice Chat</span>
          </button>

          {/* Chat Button */}
          <button
            onClick={onChatClick}
            className="group relative px-8 py-4 bg-transparent border-2 border-indigo-500 text-indigo-400 font-semibold rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:scale-105 flex items-center gap-3 min-w-[240px] justify-center"
          >
            <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
            <span className="text-lg">Chat & Book</span>
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-indigo-500/50 transition">
            <div className="text-3xl mb-3">✈️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Flights</h3>
            <p className="text-slate-400 text-sm">
              Get live flight options from Amadeus API with best prices
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">🏨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Hotels</h3>
            <p className="text-slate-400 text-sm">
              AI-powered hotel recommendations based on your preferences
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-pink-500/50 transition">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Best Activities</h3>
            <p className="text-slate-400 text-sm">
              Curated experiences and activities for your destination
            </p>
          </div>
        </div>
      </div>

      {/* CSS for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes airplane-fly {
          0% { transform: translateX(-100px) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 100px)) translateY(-50px); opacity: 0; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-fade-in-delayed {
          animation: fade-in 1s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-fade-in-delayed-more {
          animation: fade-in 1s ease-out 0.6s forwards;
          opacity: 0;
        }

        .airplane-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .airplane {
          position: absolute;
          animation: airplane-fly linear infinite;
        }

        .airplane-1 {
          top: 20%;
          animation-duration: 25s;
          animation-delay: 0s;
        }

        .airplane-2 {
          top: 50%;
          animation-duration: 30s;
          animation-delay: 5s;
        }

        .airplane-3 {
          top: 70%;
          animation-duration: 35s;
          animation-delay: 10s;
        }
      `}</style>
    </div>
  );
};