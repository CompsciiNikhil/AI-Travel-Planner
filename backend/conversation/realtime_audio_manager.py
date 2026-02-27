import asyncio
import websockets
import json
import base64
import os
from typing import Callable, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RealtimeAudioManager:
    """Manages WebSocket connection to Azure OpenAI Realtime API for speech-to-speech conversation"""
    
    def __init__(self):
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.deployment = "gpt-4o-realtime-preview"  # Your realtime deployment name
        
        # Build WebSocket URL for Azure
        # Format: wss://<resource-name>.openai.azure.com/openai/realtime?api-version=2024-10-01-preview&deployment=<deployment-name>
        base_url = self.endpoint.replace("https://", "wss://").replace("http://", "ws://").rstrip('/')
        self.ws_url = f"{base_url}/openai/realtime?api-version=2024-10-01-preview&deployment={self.deployment}"
        
        self.websocket = None
        self.is_connected = False
        
        # Callbacks
        self.on_transcript_callback: Optional[Callable] = None
        self.on_audio_callback: Optional[Callable] = None
        self.on_error_callback: Optional[Callable] = None
        
        # Session configuration
        self.session_config = {
            "modalities": ["text", "audio"],
            "instructions": self._get_system_instructions(),
            "voice": "alloy",  # Options: alloy, echo, shimmer
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "input_audio_transcription": {
                "model": "whisper-1"
            },
            "turn_detection": {
                "type": "server_vad",  # Server-side voice activity detection
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 500
            }
        }
        
        # Travel planning state
        self.collected_info = {
            "destination": None,
            "start_date": None,
            "end_date": None,
            "budget": None,
            "persona": None
        }
    
    def _get_system_instructions(self):
        """System prompt for the realtime conversational agent"""
        return """You are a friendly travel planning assistant having a voice conversation with users.

Your job is to collect travel preferences through natural speech:
1. Destination (where they want to go)
2. Start date (when they want to leave)
3. End date (when they want to return)
4. Budget (how much they can spend in rupees)
5. Travel persona (budget traveler, balanced, luxury, cultural explorer, or adventure seeker)

Guidelines:
- Speak naturally as if having a phone conversation
- Ask ONE question at a time
- Be conversational, warm, and friendly
- If user provides multiple details, acknowledge all and ask for missing ones
- Keep responses SHORT (2-3 sentences)
- Use simple, clear language
- Once you have all 5 pieces of information, summarize and confirm

Remember: This is a VOICE conversation, so avoid using text-specific formatting or lists."""

    async def connect(self):
        """Establish WebSocket connection to Azure OpenAI Realtime API"""
        try:
            headers = {
                "api-key": self.api_key
            }
            
            logger.info(f"Connecting to Azure Realtime API: {self.ws_url}")
            self.websocket = await websockets.connect(
                self.ws_url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=20
            )
            
            self.is_connected = True
            logger.info("✅ Connected to Azure Realtime API")
            
            # Configure session
            await self._configure_session()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection failed: {str(e)}")
            self.is_connected = False
            if self.on_error_callback:
                self.on_error_callback(f"Connection failed: {str(e)}")
            return False
    
    async def _configure_session(self):
        """Send session configuration to the API"""
        config_message = {
            "type": "session.update",
            "session": self.session_config
        }
        await self.websocket.send(json.dumps(config_message))
        logger.info("Session configured")
    
    async def disconnect(self):
        """Close WebSocket connection"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            logger.info("Disconnected from Realtime API")
    
    async def send_audio(self, audio_bytes: bytes):
        """Send audio data to the API
        
        Args:
            audio_bytes: PCM16 audio data at 24kHz, mono
        """
        if not self.is_connected:
            logger.warning("Not connected. Cannot send audio.")
            return
        
        try:
            # Encode audio as base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Send audio append message
            message = {
                "type": "input_audio_buffer.append",
                "audio": audio_base64
            }
            
            await self.websocket.send(json.dumps(message))
            
        except Exception as e:
            logger.error(f"Error sending audio: {str(e)}")
            if self.on_error_callback:
                self.on_error_callback(f"Error sending audio: {str(e)}")
    
    async def commit_audio(self):
        """Signal that audio input is complete and request a response"""
        if not self.is_connected:
            return
        
        try:
            message = {
                "type": "input_audio_buffer.commit"
            }
            await self.websocket.send(json.dumps(message))
            
            # Create response
            response_message = {
                "type": "response.create"
            }
            await self.websocket.send(json.dumps(response_message))
            
        except Exception as e:
            logger.error(f"Error committing audio: {str(e)}")
    
    async def listen(self):
        """Listen for messages from the API"""
        try:
            async for message in self.websocket:
                await self._handle_message(json.loads(message))
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("Connection closed")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error in listen loop: {str(e)}")
            if self.on_error_callback:
                self.on_error_callback(f"Listen error: {str(e)}")
    
    async def _handle_message(self, message: dict):
        """Handle incoming messages from the API"""
        msg_type = message.get("type")
        
        # Log all message types for debugging
        logger.debug(f"Received: {msg_type}")
        
        if msg_type == "session.created":
            logger.info("✅ Session created successfully")
        
        elif msg_type == "session.updated":
            logger.info("✅ Session updated")
        
        elif msg_type == "input_audio_buffer.speech_started":
            logger.info("🎤 User started speaking")
        
        elif msg_type == "input_audio_buffer.speech_stopped":
            logger.info("🎤 User stopped speaking")
        
        elif msg_type == "conversation.item.input_audio_transcription.completed":
            # User's speech was transcribed
            transcript = message.get("transcript", "")
            logger.info(f"📝 User said: {transcript}")
            
            # Extract information from transcript
            self._extract_information(transcript)
            
            if self.on_transcript_callback:
                self.on_transcript_callback(transcript, role="user")
        
        elif msg_type == "response.audio.delta":
            # Audio chunk from AI response
            audio_base64 = message.get("delta", "")
            if audio_base64:
                audio_bytes = base64.b64decode(audio_base64)
                if self.on_audio_callback:
                    self.on_audio_callback(audio_bytes)
        
        elif msg_type == "response.audio_transcript.delta":
            # Text transcript of AI's speech (partial)
            delta = message.get("delta", "")
            logger.debug(f"AI speaking: {delta}")
        
        elif msg_type == "response.audio_transcript.done":
            # Complete transcript of AI's response
            transcript = message.get("transcript", "")
            logger.info(f"🤖 AI said: {transcript}")
            
            if self.on_transcript_callback:
                self.on_transcript_callback(transcript, role="assistant")
        
        elif msg_type == "response.done":
            logger.info("✅ Response complete")
        
        elif msg_type == "error":
            error_msg = message.get("error", {})
            logger.error(f"❌ API Error: {error_msg}")
            if self.on_error_callback:
                self.on_error_callback(f"API Error: {error_msg}")
    
    def _extract_information(self, transcript: str):
        """Extract travel information from user's speech transcript"""
        text_lower = transcript.lower()
        
        # Import here to avoid circular dependency
        import re
        from datetime import datetime
        
        # Extract destination
        destinations = ["mumbai", "goa", "bangalore", "delhi", "jaipur", "kerala", "rajasthan", "manali"]
        for dest in destinations:
            if dest in text_lower:
                self.collected_info['destination'] = dest.capitalize()
                logger.info(f"✓ Destination: {dest.capitalize()}")
        
        # Extract budget
        if "rupees" in text_lower or "₹" in transcript or "thousand" in text_lower or "lakh" in text_lower:
            # Pattern for numbers
            numbers = re.findall(r'\d+(?:,\d+)*', transcript.replace(',', ''))
            if numbers:
                budget_num = int(max(numbers, key=lambda x: int(x)))
                
                # Handle "thousand" and "lakh"
                if "thousand" in text_lower:
                    budget_num *= 1000
                elif "lakh" in text_lower:
                    budget_num *= 100000
                
                self.collected_info['budget'] = budget_num
                logger.info(f"✓ Budget: ₹{budget_num}")
        
        # Extract persona
        personas = {
            "budget": ["budget", "cheap", "affordable", "economic", "economical"],
            "luxury": ["luxury", "premium", "expensive", "5 star", "five star", "lavish"],
            "cultural": ["cultural", "heritage", "history", "museums", "culture"],
            "adventure": ["adventure", "hiking", "trekking", "sports", "adventurous"],
            "balanced": ["balanced", "moderate", "normal", "mix", "combination"]
        }
        
        for persona_type, keywords in personas.items():
            if any(keyword in text_lower for keyword in keywords):
                self.collected_info['persona'] = persona_type
                logger.info(f"✓ Persona: {persona_type}")
        
        # Extract dates
        dates_found = []
        
        # Month names
        months = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        
        for month_name, month_num in months.items():
            if month_name in text_lower:
                # Look for day numbers near the month
                patterns = [
                    rf'{month_name}\s+(\d{{1,2}})',  # "February 11"
                    rf'(\d{{1,2}})\s*(?:st|nd|rd|th)?\s+{month_name}',  # "11th February"
                ]
                for pattern in patterns:
                    matches = re.finditer(pattern, text_lower)
                    for match in matches:
                        day = int(match.group(1))
                        year = 2026  # Default year
                        date_str = f"{year}-{month_num:02d}-{day:02d}"
                        dates_found.append(date_str)
        
        # Assign dates
        dates_found = sorted(list(set(dates_found)))
        if len(dates_found) >= 2:
            self.collected_info['start_date'] = dates_found[0]
            self.collected_info['end_date'] = dates_found[1]
            logger.info(f"✓ Dates: {dates_found[0]} to {dates_found[1]}")
        elif len(dates_found) == 1:
            if not self.collected_info['start_date']:
                self.collected_info['start_date'] = dates_found[0]
                logger.info(f"✓ Start date: {dates_found[0]}")
            elif not self.collected_info['end_date']:
                self.collected_info['end_date'] = dates_found[0]
                logger.info(f"✓ End date: {dates_found[0]}")
    
    def is_information_complete(self):
        """Check if all required information is collected"""
        complete = all(value is not None for value in self.collected_info.values())
        if complete:
            logger.info("✅ All information collected!")
        return complete
    
    def get_collected_info(self):
        """Return collected travel information"""
        return self.collected_info
    
    def reset_info(self):
        """Reset collected information"""
        self.collected_info = {
            "destination": None,
            "start_date": None,
            "end_date": None,
            "budget": None,
            "persona": None
        }
        logger.info("🔄 Information reset")
    
    # Callback setters
    def set_transcript_callback(self, callback: Callable):
        """Set callback for transcript updates"""
        self.on_transcript_callback = callback
    
    def set_audio_callback(self, callback: Callable):
        """Set callback for audio playback"""
        self.on_audio_callback = callback
    
    def set_error_callback(self, callback: Callable):
        """Set callback for errors"""
        self.on_error_callback = callback