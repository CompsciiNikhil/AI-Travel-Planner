import sounddevice as sd
import numpy as np
import queue
import threading
import logging
from typing import Callable, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AudioHandler:
    """Handles audio input/output for real-time speech conversation"""
    
    # Audio configuration for Azure OpenAI Realtime API
    SAMPLE_RATE = 24000  # 24kHz required by API
    CHANNELS = 1  # Mono
    DTYPE = np.int16  # PCM16 format
    CHUNK_SIZE = 4800  # 200ms chunks (24000 * 0.2)
    
    def __init__(self):
        self.is_recording = False
        self.is_playing = False
        
        # Queues for audio data
        self.input_queue = queue.Queue()
        self.output_queue = queue.Queue()
        
        # Callbacks
        self.on_audio_data_callback: Optional[Callable] = None
        
        # Threads
        self.record_thread = None
        self.playback_thread = None
        
        # Check audio devices
        self._check_audio_devices()
    
    def _check_audio_devices(self):
        """Check available audio devices"""
        try:
            devices = sd.query_devices()
            logger.info("Available audio devices:")
            logger.info(devices)
            
            # Get default devices
            default_input = sd.query_devices(kind='input')
            default_output = sd.query_devices(kind='output')
            
            logger.info(f"Default input device: {default_input['name']}")
            logger.info(f"Default output device: {default_output['name']}")
            
        except Exception as e:
            logger.error(f"Error checking audio devices: {str(e)}")
    
    def start_recording(self):
        """Start capturing microphone input"""
        if self.is_recording:
            logger.warning("Already recording")
            return
        
        self.is_recording = True
        self.record_thread = threading.Thread(target=self._record_loop, daemon=True)
        self.record_thread.start()
        logger.info("🎤 Started recording")
    
    def stop_recording(self):
        """Stop capturing microphone input"""
        self.is_recording = False
        if self.record_thread:
            self.record_thread.join(timeout=1.0)
        logger.info("🎤 Stopped recording")
    
    def _record_loop(self):
        """Audio recording loop"""
        try:
            with sd.InputStream(
                samplerate=self.SAMPLE_RATE,
                channels=self.CHANNELS,
                dtype=self.DTYPE,
                blocksize=self.CHUNK_SIZE,
                callback=self._audio_input_callback
            ):
                while self.is_recording:
                    sd.sleep(100)  # Sleep for 100ms
                    
        except Exception as e:
            logger.error(f"Recording error: {str(e)}")
            self.is_recording = False
    
    def _audio_input_callback(self, indata, frames, time_info, status):
        """Callback for audio input stream"""
        if status:
            logger.warning(f"Input status: {status}")
        
        # Convert to bytes
        audio_bytes = indata.tobytes()
        
        # Send to callback if registered
        if self.on_audio_data_callback:
            self.on_audio_data_callback(audio_bytes)
    
    def start_playback(self):
        """Start audio playback thread"""
        if self.is_playing:
            logger.warning("Already playing")
            return
        
        self.is_playing = True
        self.playback_thread = threading.Thread(target=self._playback_loop, daemon=True)
        self.playback_thread.start()
        logger.info("🔊 Started playback")
    
    def stop_playback(self):
        """Stop audio playback"""
        self.is_playing = False
        if self.playback_thread:
            self.playback_thread.join(timeout=1.0)
        
        # Clear any remaining audio in queue
        while not self.output_queue.empty():
            try:
                self.output_queue.get_nowait()
            except queue.Empty:
                break
        
        logger.info("🔊 Stopped playback")
    
    def _playback_loop(self):
        """Audio playback loop"""
        try:
            with sd.OutputStream(
                samplerate=self.SAMPLE_RATE,
                channels=self.CHANNELS,
                dtype=self.DTYPE,
                blocksize=self.CHUNK_SIZE,
                callback=self._audio_output_callback
            ):
                while self.is_playing:
                    sd.sleep(100)
                    
        except Exception as e:
            logger.error(f"Playback error: {str(e)}")
            self.is_playing = False
    
    def _audio_output_callback(self, outdata, frames, time_info, status):
        """Callback for audio output stream"""
        if status:
            logger.warning(f"Output status: {status}")
        
        try:
            # Get audio data from queue (non-blocking)
            audio_bytes = self.output_queue.get_nowait()
            
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_bytes, dtype=self.DTYPE)
            
            # Reshape to match output shape
            if len(audio_array) < frames:
                # Pad with zeros if not enough data
                audio_array = np.pad(audio_array, (0, frames - len(audio_array)))
            elif len(audio_array) > frames:
                # Truncate if too much data (shouldn't happen)
                audio_array = audio_array[:frames]
            
            # Copy to output
            outdata[:] = audio_array.reshape(-1, 1)
            
        except queue.Empty:
            # No data available, output silence
            outdata.fill(0)
    
    def queue_audio_for_playback(self, audio_bytes: bytes):
        """Add audio data to playback queue"""
        self.output_queue.put(audio_bytes)
    
    def set_audio_data_callback(self, callback: Callable):
        """Set callback for when audio data is captured"""
        self.on_audio_data_callback = callback
    
    def clear_playback_queue(self):
        """Clear all pending audio from playback queue"""
        while not self.output_queue.empty():
            try:
                self.output_queue.get_nowait()
            except queue.Empty:
                break
        logger.info("Cleared playback queue")
    
    def get_audio_info(self):
        """Get current audio configuration info"""
        return {
            "sample_rate": self.SAMPLE_RATE,
            "channels": self.CHANNELS,
            "dtype": str(self.DTYPE),
            "chunk_size": self.CHUNK_SIZE,
            "is_recording": self.is_recording,
            "is_playing": self.is_playing
        }
    
    def cleanup(self):
        """Stop all audio operations"""
        self.stop_recording()
        self.stop_playback()
        logger.info("Audio handler cleaned up")


class AudioVisualizer:
    """Simple audio level visualizer (optional utility)"""
    
    @staticmethod
    def get_audio_level(audio_bytes: bytes) -> float:
        """Calculate audio level (RMS) from audio bytes
        
        Returns:
            float: Audio level from 0.0 to 1.0
        """
        try:
            # Convert to numpy array
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
            
            # Calculate RMS (Root Mean Square)
            rms = np.sqrt(np.mean(audio_array.astype(np.float32) ** 2))
            
            # Normalize to 0-1 range (max possible value for int16 is 32768)
            normalized = min(rms / 32768.0, 1.0)
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error calculating audio level: {str(e)}")
            return 0.0
    
    @staticmethod
    def get_volume_bar(level: float, width: int = 20) -> str:
        """Create a text-based volume bar
        
        Args:
            level: Audio level from 0.0 to 1.0
            width: Width of the bar in characters
            
        Returns:
            str: Visual bar like "████░░░░░░░░░░░░░░░░"
        """
        filled = int(level * width)
        empty = width - filled
        return "█" * filled + "░" * empty


# Utility function for testing
def test_audio_devices():
    """Test function to check audio setup"""
    print("\n=== Audio Device Test ===\n")
    
    handler = AudioHandler()
    
    print("\n=== Recording Test (5 seconds) ===")
    print("Speak into your microphone...")
    
    audio_chunks = []
    
    def collect_audio(audio_bytes):
        audio_chunks.append(audio_bytes)
        level = AudioVisualizer.get_audio_level(audio_bytes)
        bar = AudioVisualizer.get_volume_bar(level)
        print(f"\rLevel: {bar} {level:.2f}", end="")
    
    handler.set_audio_data_callback(collect_audio)
    handler.start_recording()
    
    import time
    time.sleep(5)
    
    handler.stop_recording()
    
    print(f"\n\nRecorded {len(audio_chunks)} chunks")
    
    print("\n=== Playback Test ===")
    print("Playing back recorded audio...")
    
    handler.start_playback()
    for chunk in audio_chunks:
        handler.queue_audio_for_playback(chunk)
    
    time.sleep(5)
    handler.stop_playback()
    
    print("\nTest complete!")
    handler.cleanup()


if __name__ == "__main__":
    # Run test if executed directly
    test_audio_devices()