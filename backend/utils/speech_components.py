import streamlit as st
import streamlit.components.v1 as components

def speech_to_text():
    """Speech recognition component using Web Speech API"""
    
    speech_html = """
    <div>
        <button id="start-btn" style="
            background-color: #FF4B4B;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        ">🎤 Start Speaking</button>
        
        <p id="status" style="margin-top: 10px; color: #666;"></p>
        <p id="transcript" style="
            margin-top: 10px;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
            min-height: 50px;
        "></p>
    </div>
    
    <script>
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            document.getElementById('status').textContent = '❌ Speech recognition not supported in this browser. Please use Chrome or Edge.';
            document.getElementById('start-btn').disabled = true;
        } else {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            const startBtn = document.getElementById('start-btn');
            const status = document.getElementById('status');
            const transcript = document.getElementById('transcript');
            
            startBtn.addEventListener('click', () => {
                recognition.start();
                status.textContent = '🎤 Listening...';
                startBtn.disabled = true;
            });
            
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                transcript.textContent = text;
                status.textContent = '✅ Recognized!';
                
                // Send to Streamlit
                window.parent.postMessage({
                    type: 'streamlit:setComponentValue',
                    value: text
                }, '*');
                
                startBtn.disabled = false;
            };
            
            recognition.onerror = (event) => {
                status.textContent = '❌ Error: ' + event.error;
                startBtn.disabled = false;
            };
            
            recognition.onend = () => {
                status.textContent = 'Click button to speak again';
                startBtn.disabled = false;
            };
        }
    </script>
    """
    
    return components.html(speech_html, height=200)


def text_to_speech(text):
    """Text-to-speech component using Web Speech API"""
    
    tts_html = f"""
    <div>
        <button id="speak-btn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        ">🔊 Play Response</button>
        
        <p id="tts-status" style="margin-top: 10px; color: #666;"></p>
    </div>
    
    <script>
        const text = `{text}`;
        const speakBtn = document.getElementById('speak-btn');
        const status = document.getElementById('tts-status');
        
        if (!window.speechSynthesis) {{
            status.textContent = '❌ Text-to-speech not supported';
            speakBtn.disabled = true;
        }} else {{
            speakBtn.addEventListener('click', () => {{
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                status.textContent = '🔊 Speaking...';
                
                utterance.onend = () => {{
                    status.textContent = '✅ Finished';
                }};
                
                window.speechSynthesis.speak(utterance);
            }});
        }}
    </script>
    """
    
    return components.html(tts_html, height=80)