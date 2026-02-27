from openai import AzureOpenAI
import os
import json

class FlightAgent:
    def __init__(self, client):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    
    def suggest_flights(self, destination, budget, persona, start_date):
        """Suggest flights based on constraints"""
        
        # Load mock flight data
        with open('data/mock_flights.json', 'r') as f:
            flight_data = json.load(f)
        
        # Create prompt for LLM
        prompt = f"""
You are a flight booking expert. Analyze the following flight options and recommend the BEST 2 flights.

User Requirements:
- Destination: {destination}
- Budget for flights: ₹{budget}
- Travel Persona: {persona}
- Travel Date: {start_date}

Available Flights:
{json.dumps(flight_data['flights'], indent=2)}

Instructions:
1. Filter flights that match the destination
2. Filter flights within budget
3. Prioritize flights matching the persona
4. Keep the total cost of plan within the budget
5. Return ONLY valid JSON with this structure:
{{
    "recommended_flights": [
        {{
            "flight_id": "string",
            "airline": "string",
            "price": number,
            "departure": "string",
            "arrival": "string",
            "reason": "why this flight was chosen"
        }}
    ],
    "total_cost": number
}}

Return ONLY the JSON, no markdown, no extra text.
"""
        
        # Call Azure OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800
        )
        
        # Parse response
        result = response.choices[0].message.content.strip()
        
        # Clean any markdown formatting
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        return json.loads(result)