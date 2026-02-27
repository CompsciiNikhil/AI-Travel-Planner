from google import genai
import os
import time

class GeminiClient:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = 'gemini-3-flash-preview'
    
    def chat(self, message, conversation_history=None, max_retries=3):
        """
        Send a message and get response with retry logic
        """
        for attempt in range(max_retries):
            try:
                if conversation_history:
                    contents = conversation_history + [{"role": "user", "parts": message}]
                else:
                    contents = message
                
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents
                )
                
                return response.text
            
            except Exception as e:
                if "503" in str(e) or "overloaded" in str(e).lower():
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2  # 2, 4, 6 seconds
                        time.sleep(wait_time)
                        continue
                return f"Error: {str(e)}"
        
        return "Error: Service temporarily unavailable. Please try again."
    
    def chat_with_system_prompt(self, system_prompt, user_message, conversation_history=None):
        """
        Chat with a system prompt with retry logic
        """
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        
        if conversation_history:
            contents = conversation_history + [{"role": "user", "parts": full_prompt}]
        else:
            contents = full_prompt
        
        for attempt in range(3):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents
                )
                return response.text
            except Exception as e:
                if "503" in str(e) or "overloaded" in str(e).lower():
                    if attempt < 2:
                        time.sleep((attempt + 1) * 2)
                        continue
                return f"Error: {str(e)}"
        
        return "I'm experiencing high load. Please try again in a moment."