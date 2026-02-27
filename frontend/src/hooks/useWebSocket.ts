import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage, CollectedInfo, FinalDecision } from '../types';

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState<CollectedInfo>({});
  const [isComplete, setIsComplete] = useState(false);
  const [debateTranscript, setDebateTranscript] = useState<string>('');
  const [finalDecision, setFinalDecision] = useState<FinalDecision | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageListeners = useRef<((data: WebSocketMessage) => void)[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === 'bot_response') {
          if (data.collected_info) {
            setCollectedInfo(data.collected_info);
          }
          if (data.is_complete !== undefined) {
            setIsComplete(data.is_complete);
          }
        } else if (data.type === 'planning_result') {
          if (data.debate_transcript) {
            setDebateTranscript(data.debate_transcript);
          }
          if (data.final_decision) {
            setFinalDecision(data.final_decision);
          }
        }

        messageListeners.current.forEach(listener => listener(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const addMessageListener = useCallback((listener: (data: WebSocketMessage) => void) => {
    messageListeners.current.push(listener);
    return () => {
      messageListeners.current = messageListeners.current.filter(l => l !== listener);
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    addMessageListener,
    collectedInfo,
    isComplete,
    debateTranscript,
    finalDecision,
  };
};
