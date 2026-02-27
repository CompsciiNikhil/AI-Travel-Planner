import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Navbar } from './components/NavBar';
import { VoiceModal } from './components/VoiceModal';
import { ChatSideBar } from './components/ChatSideBar';
import { ResultsSection } from './components/ResultsSection';
import { DebateTranscript } from './components/DebateTranscript';
import { BottomSummary } from './components/BottomSummary';
import { VerificationModal } from './components/VerificationModal';

interface CollectedInfo {
  departure_city: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  persona: string | null;
  selected_flight: any;
  selected_hotel: any;
  selected_activities: any[];
}

interface PlanningResult {
  debate_transcript: any;
  final_decision: {
    flight: any;
    hotel: any;
    activities: any[];
  };
}

interface OptionsData {
  type: 'flights' | 'hotels' | 'activities';
  options: any[];
  message: string;
}

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [collectedInfo, setCollectedInfo] = useState<CollectedInfo>({
    departure_city: null,
    destination: null,
    start_date: null,
    end_date: null,
    budget: null,
    persona: null,
    selected_flight: null,
    selected_hotel: null,
    selected_activities: []
  });
  
  const [isComplete, setIsComplete] = useState(false);
  const [planningResult, setPlanningResult] = useState<PlanningResult | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<OptionsData | null>(null);

  // WebSocket setup
  useEffect(() => {
    console.log('🔌 Setting up WebSocket connection...');
    
    const websocket = new WebSocket('ws://localhost:8000/ws/voice');

    websocket.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 Received from backend:', data);

      if (data.type === 'bot_response') {
        console.log('🤖 Adding bot message to chat');
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setCollectedInfo(data.collected_info);
        setIsComplete(data.is_complete);
      }

      if (data.type === 'show_options') {
        console.log('🎯 Showing options:', data.options_type);
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setCurrentOptions({
          type: data.options_type,
          options: data.options,
          message: data.message
        });
      }

      if (data.type === 'planning_result') {
        console.log('✨ Planning complete!');
        setPlanningResult(data);
        setShowResults(true);
        setIsPlanning(false);
        setCurrentOptions(null);
      }

      if (data.type === 'error') {
        console.error('❌ Error from backend:', data.message);
        alert('Error: ' + data.message);
        setIsPlanning(false);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log('⚠️ WebSocket Disconnected');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      console.log('🔌 Cleaning up WebSocket...');
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  const sendMessage = (message: string) => {
    console.log('📤 Sending message:', message);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected!');
      alert('Not connected to server!');
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    ws.send(JSON.stringify({
      type: 'user_message',
      message: message
    }));
    
    console.log('✅ Message sent to backend');
  };

  const handleSelectOption = (option: any) => {
    if (!currentOptions || !ws) return;

    console.log('✅ Option selected:', option);

    if (currentOptions.type === 'flights') {
      ws.send(JSON.stringify({
        type: 'select_flight',
        flight: option
      }));
      setCurrentOptions(null);
    } else if (currentOptions.type === 'hotels') {
      ws.send(JSON.stringify({
        type: 'select_hotel',
        hotel: option
      }));
      setCurrentOptions(null);
    } else if (currentOptions.type === 'activities') {
      ws.send(JSON.stringify({
        type: 'select_activity',
        activity: option
      }));
    }
  };

  const handleFinalize = () => {
    if (!ws) return;

    console.log('🎯 Finalizing selections...');
    setIsPlanning(true);
    setCurrentOptions(null);
    
    ws.send(JSON.stringify({
      type: 'finalize'
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    if (collectedInfo.selected_flight) {
      total += collectedInfo.selected_flight.price || 0;
    }
    if (collectedInfo.selected_hotel) {
      const nights = collectedInfo.start_date && collectedInfo.end_date
        ? Math.ceil((new Date(collectedInfo.end_date).getTime() - new Date(collectedInfo.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 1;
      total += (collectedInfo.selected_hotel.price_per_night || 0) * nights;
    }
    collectedInfo.selected_activities.forEach(activity => {
      total += activity.price || 0;
    });
    return total;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      
      <Hero
        onVoiceClick={() => setShowVoiceModal(true)}
        onChatClick={() => setShowChatSidebar(true)}
      />

      {!isConnected && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          ⚠️ Not connected to backend
        </div>
      )}

      {showVoiceModal && (
        <VoiceModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onSendMessage={sendMessage}
          onStartPlanning={handleFinalize}
          isPlanning={isPlanning}
          messages={messages}
          collectedInfo={collectedInfo}
          isComplete={isComplete}
          currentOptions={currentOptions}
          onSelectOption={handleSelectOption}
        />
      )}

      {showChatSidebar && (
        <ChatSideBar
          isOpen={showChatSidebar}
          onClose={() => setShowChatSidebar(false)}
          messages={messages}
          onSendMessage={sendMessage}
          collectedInfo={collectedInfo}
          isComplete={isComplete}
          onStartPlanning={handleFinalize}
          isPlanning={isPlanning}
          currentOptions={currentOptions}
          onSelectOption={handleSelectOption}
        />
      )}

      {showResults && planningResult && (
        <div className="container mx-auto px-4 py-8">
          <ResultsSection
            planningResult={planningResult}
            onSelectFlight={(flight) => setCollectedInfo({...collectedInfo, selected_flight: flight})}
            onSelectHotel={(hotel) => setCollectedInfo({...collectedInfo, selected_hotel: hotel})}
            onSelectActivity={(activity) => setCollectedInfo({
              ...collectedInfo, 
              selected_activities: [...collectedInfo.selected_activities, activity]
            })}
            selectedFlight={collectedInfo.selected_flight}
            selectedHotel={collectedInfo.selected_hotel}
            selectedActivities={collectedInfo.selected_activities}
          />
          <DebateTranscript transcript={planningResult.debate_transcript} />
        </div>
      )}

      {(collectedInfo.selected_flight || collectedInfo.selected_hotel || collectedInfo.selected_activities.length > 0) && showResults && (
        <BottomSummary
          selectedFlight={collectedInfo.selected_flight}
          selectedHotel={collectedInfo.selected_hotel}
          selectedActivities={collectedInfo.selected_activities}
          collectedInfo={collectedInfo}
          total={calculateTotal()}
          onProceed={() => setShowVerification(true)}
        />
      )}

      {showVerification && (
        <VerificationModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          collectedInfo={collectedInfo}
          selectedFlight={collectedInfo.selected_flight}
          selectedHotel={collectedInfo.selected_hotel}
          selectedActivities={collectedInfo.selected_activities}
          total={calculateTotal()}
          onConfirm={() => {
            alert('Booking confirmed! 🎉');
            setShowVerification(false);
          }}
        />
      )}
    </div>
  );
}

export default App;