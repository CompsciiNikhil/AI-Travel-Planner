from openai import AzureOpenAI
import os
import json

class HotelAgent:
    def __init__(self, client):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")

    def suggest_hotels(self, destination, budget, persona, duration):

        with open('data/mock_hotels.json', 'r') as f:
            hotel_data = json.load(f)

        # ✅ Filter BEFORE LLM
        city_hotels = hotel_data.get(destination, [])

        if not city_hotels:
            return {"recommended_hotel": None}

        prompt = f"""
You are a hotel booking expert.

User Requirements:
- Budget: ₹{budget}
- Travel Persona: {persona}
- Stay Duration: {duration} nights

Available Hotels:
{json.dumps(city_hotels, indent=2)}

Instructions:
1. Calculate total cost (price_per_night × {duration})
2. Stay within budget
3. Prioritize persona match
4. Return ONLY JSON:
{{
    "recommended_hotel": {{
        "hotel_id": "string",
        "name": "string",
        "price_per_night": number,
        "total_cost": number,
        "rating": number,
        "amenities": ["list"],
        "reason": "why selected"
    }}
}}
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=600
        )

        result = response.choices[0].message.content.strip()

        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]

        return json.loads(result)