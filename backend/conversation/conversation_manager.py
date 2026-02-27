import os
import json
from datetime import datetime, timedelta
from openai import AzureOpenAI

class ConversationManager:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        
        self.conversation_history = []
        self.collected_info = {
            "departure_city": None,
            "destination": None,
            "start_date": None,
            "end_date": None,
            "budget": None,
            "selected_flight": None,
            "selected_hotel": None,
            "selected_activities": []
        }
        
        self.current_stage = "greeting"  # greeting, departure, destination, dates, budget, flights, hotels, activities, complete
        
    def get_system_prompt(self):
        return """You are a helpful AI travel assistant. Your job is to collect travel information step by step.

Current stage: {stage}
Collected so far: {collected}

RULES:
1. Ask ONE question at a time
2. Be conversational and friendly
3. Extract information from user's natural language
4. When you have departure_city and destination, ALWAYS use IATA codes (Bangalore=BLR, Mumbai=BOM, Delhi=DEL, Goa=GOI, etc)
5. For dates, convert to YYYY-MM-DD format
6. Keep responses SHORT (2-3 sentences max)

STAGES:
- greeting: Say hi, ask where they're traveling FROM
- departure: Got departure, ask where they're going TO
- destination: Got destination, ask WHEN they're leaving (start date)
- start_date: Got start date, ask when they're RETURNING (end date)
- end_date: Got end date, ask their BUDGET
- budget: Got budget, say "Let me find flights..." (don't ask anything)
- flights: User will select a flight
- hotels: User will select a hotel
- activities: User will select activities
- complete: All done!

Current stage: {stage}
""".format(stage=self.current_stage, collected=json.dumps(self.collected_info, indent=2))
    
    def process_message(self, user_message):
        """Process user message and return bot response"""
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Check if user is asking for specific things
        if self._is_flight_query(user_message):
            return self._handle_flight_query(user_message)
        
        if self._is_hotel_query(user_message):
            return self._handle_hotel_query(user_message)
        
        if self._is_activity_query(user_message):
            return self._handle_activity_query(user_message)
        
        # Extract information from message
        self._extract_info(user_message)
        
        # Get AI response
        response = self._get_ai_response()
        
        # Add bot response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response
        })
        
        # Update stage
        self._update_stage()
        
        return {
            "message": response,
            "collected_info": self.collected_info,
            "current_stage": self.current_stage,
            "should_show_options": self._should_show_options()
        }
    
    def _is_flight_query(self, message):
        keywords = ["flight", "flights", "fly", "cheapest flight", "show me flights"]
        return any(keyword in message.lower() for keyword in keywords)
    
    def _is_hotel_query(self, message):
        keywords = ["hotel", "hotels", "stay", "accommodation", "show me hotels"]
        return any(keyword in message.lower() for keyword in keywords)
    
    def _is_activity_query(self, message):
        keywords = ["activity", "activities", "things to do", "visit", "attractions"]
        return any(keyword in message.lower() for keyword in keywords)
    
    def _handle_flight_query(self, message):
        """User explicitly asked for flights"""
        if not self.collected_info["departure_city"] or not self.collected_info["destination"]:
            return {
                "message": "I'll need to know where you're traveling from and to first! Where are you departing from?",
                "collected_info": self.collected_info,
                "current_stage": self.current_stage,
                "should_show_options": None
            }
        
        return {
            "message": "Perfect! Let me search for the best flights from {} to {}...".format(
                self.collected_info["departure_city"],
                self.collected_info["destination"]
            ),
            "collected_info": self.collected_info,
            "current_stage": "flights",
            "should_show_options": "flights"
        }
    
    def _handle_hotel_query(self, message):
        """User explicitly asked for hotels"""
        if not self.collected_info["destination"]:
            return {
                "message": "Where would you like to stay? I need to know your destination first!",
                "collected_info": self.collected_info,
                "current_stage": self.current_stage,
                "should_show_options": None
            }
        
        return {
            "message": "Great! Let me find the best hotels in {}...".format(self.collected_info["destination"]),
            "collected_info": self.collected_info,
            "current_stage": "hotels",
            "should_show_options": "hotels"
        }
    
    def _handle_activity_query(self, message):
        """User explicitly asked for activities"""
        if not self.collected_info["destination"]:
            return {
                "message": "I'd love to show you activities! But where are you planning to visit?",
                "collected_info": self.collected_info,
                "current_stage": self.current_stage,
                "should_show_options": None
            }
        
        return {
            "message": "Awesome! Here are some amazing things to do in {}...".format(self.collected_info["destination"]),
            "collected_info": self.collected_info,
            "current_stage": "activities",
            "should_show_options": "activities"
        }
    
    def _extract_info(self, message):
        """Extract travel info from user message"""
        msg_lower = message.lower()
        
        # Extract cities (departure and destination)
        city_map = {
            "bangalore": "BLR", "bengaluru": "BLR", "blr": "BLR",
            "mumbai": "BOM", "bombay": "BOM", "bom": "BOM",
            "delhi": "DEL", "new delhi": "DEL", "del": "DEL",
            "goa": "GOI", "goi": "GOI",
            "chennai": "MAA", "madras": "MAA", "maa": "MAA",
            "kolkata": "CCU", "calcutta": "CCU", "ccu": "CCU",
            "hyderabad": "HYD", "hyd": "HYD",
            "pune": "PNQ", "pnq": "PNQ",
            "jaipur": "JAI", "jai": "JAI",
            "kochi": "COK", "cochin": "COK", "cok": "COK"
        }
        
        # Check for "from X to Y" pattern
        import re
        from_to_pattern = r'from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s|$|,|\.|!|\?)'
        match = re.search(from_to_pattern, msg_lower)
        
        if match:
            departure = match.group(1).strip()
            destination = match.group(2).strip()
            
            for city, code in city_map.items():
                if city in departure:
                    self.collected_info["departure_city"] = code
                if city in destination:
                    self.collected_info["destination"] = code
        else:
            # Try to find individual cities
            for city, code in city_map.items():
                if city in msg_lower:
                    if not self.collected_info["departure_city"] and self.current_stage == "greeting":
                        self.collected_info["departure_city"] = code
                    elif not self.collected_info["destination"] and self.current_stage == "departure":
                        self.collected_info["destination"] = code
        
        # Extract dates
        if not self.collected_info["start_date"]:
            start_date = self._extract_date(message)
            if start_date:
                self.collected_info["start_date"] = start_date
        
        if not self.collected_info["end_date"] and self.collected_info["start_date"]:
            end_date = self._extract_date(message)
            if end_date and end_date != self.collected_info["start_date"]:
                self.collected_info["end_date"] = end_date
            
            # Check for "X days" pattern
            days_match = re.search(r'(\d+)\s*days?', msg_lower)
            if days_match:
                days = int(days_match.group(1))
                start = datetime.strptime(self.collected_info["start_date"], "%Y-%m-%d")
                end = start + timedelta(days=days)
                self.collected_info["end_date"] = end.strftime("%Y-%m-%d")
        
        # Extract budget
        if not self.collected_info["budget"]:
            budget_match = re.search(r'(\d{4,6})', message)
            if budget_match:
                self.collected_info["budget"] = int(budget_match.group(1))
    
    def _extract_date(self, message):
        """Extract date from message"""
        # Simple date extraction (can be enhanced)
        import re
        from datetime import datetime
        
        # Try YYYY-MM-DD format
        date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', message)
        if date_match:
            return f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
        
        # Try "17th February" or "February 17"
        month_map = {
            "january": "01", "jan": "01", "february": "02", "feb": "02",
            "march": "03", "mar": "03", "april": "04", "apr": "04",
            "may": "05", "june": "06", "jun": "06", "july": "07", "jul": "07",
            "august": "08", "aug": "08", "september": "09", "sep": "09",
            "october": "10", "oct": "10", "november": "11", "nov": "11",
            "december": "12", "dec": "12"
        }
        
        msg_lower = message.lower()
        for month_name, month_num in month_map.items():
            if month_name in msg_lower:
                day_match = re.search(r'(\d{1,2})', message)
                if day_match:
                    day = day_match.group(1).zfill(2)
                    return f"2026-{month_num}-{day}"
        
        return None
    
    def _get_ai_response(self):
        """Get AI response using Azure OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    *self.conversation_history
                ],
                temperature=0.7,
                max_tokens=150
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"❌ Error getting AI response: {e}")
            return self._get_fallback_response()
    
    def _get_fallback_response(self):
        """Fallback responses if AI fails"""
        if self.current_stage == "greeting":
            return "Hi! Where are you traveling from?"
        elif self.current_stage == "departure":
            return "Great! And where would you like to go?"
        elif self.current_stage == "destination":
            return "Perfect! When are you planning to leave?"
        elif self.current_stage == "start_date":
            return "Got it! When will you be returning?"
        elif self.current_stage == "end_date":
            return "Awesome! What's your budget for this trip?"
        else:
            return "Let me help you plan this trip!"
    
    def _update_stage(self):
        """Update conversation stage based on collected info"""
        if self.current_stage == "greeting" and self.collected_info["departure_city"]:
            self.current_stage = "departure"
        elif self.current_stage == "departure" and self.collected_info["destination"]:
            self.current_stage = "destination"
        elif self.current_stage == "destination" and self.collected_info["start_date"]:
            self.current_stage = "start_date"
        elif self.current_stage == "start_date" and self.collected_info["end_date"]:
            self.current_stage = "end_date"
        elif self.current_stage == "end_date" and self.collected_info["budget"]:
            self.current_stage = "budget"
    
    def _should_show_options(self):
        """Determine if we should show flight/hotel/activity options"""
        # Auto-show flights after budget is collected
        if self.current_stage == "budget" and self.collected_info["budget"]:
            self.current_stage = "flights"
            return "flights"
        
        return None
    
    def select_flight(self, flight_data):
        """User selected a flight"""
        self.collected_info["selected_flight"] = flight_data
        self.current_stage = "hotels"
        return {
            "message": f"Perfect choice! The {flight_data.get('airline', 'flight')} at ₹{flight_data.get('price', 0):,} is selected. Now let me show you some great hotels...",
            "collected_info": self.collected_info,
            "current_stage": "hotels",
            "should_show_options": "hotels"
        }
    
    def select_hotel(self, hotel_data):
        """User selected a hotel"""
        self.collected_info["selected_hotel"] = hotel_data
        self.current_stage = "activities"
        return {
            "message": f"Excellent! {hotel_data.get('name', 'This hotel')} is a great choice. Now, here are some amazing activities you can do...",
            "collected_info": self.collected_info,
            "current_stage": "activities",
            "should_show_options": "activities"
        }
    
    def select_activity(self, activity_data):
        """User selected an activity"""
        if activity_data not in self.collected_info["selected_activities"]:
            self.collected_info["selected_activities"].append(activity_data)
        
        return {
            "message": f"Added {activity_data.get('name', 'activity')} to your itinerary! Feel free to select more activities or say 'done' when ready.",
            "collected_info": self.collected_info,
            "current_stage": "activities",
            "should_show_options": None
        }
    
    def finalize_selections(self):
        """User is done selecting"""
        self.current_stage = "complete"
        return {
            "message": "Perfect! Let me have my AI agents review your selections and create the perfect itinerary for you...",
            "collected_info": self.collected_info,
            "current_stage": "complete",
            "should_show_options": None
        }
    
    def is_complete(self):
        """Check if all selections are made"""
        return (
            self.collected_info["selected_flight"] is not None and
            self.collected_info["selected_hotel"] is not None and
            len(self.collected_info["selected_activities"]) > 0
        )
    
    def get_collected_info(self):
        return self.collected_info