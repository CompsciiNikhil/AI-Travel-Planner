from openai import AzureOpenAI
import os
import json

class ActivityAgent:
    def __init__(self, client):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    
    def suggest_activities(self, destination, budget, persona, duration):
        """Suggest activities based on constraints"""
        
        # Load mock activity data
        with open('data/mock_activities.json', 'r') as f:
            activity_data = json.load(f)
        
        # Create prompt for LLM
        prompt = f"""
You are a travel activity expert. Create a day-wise activity plan.

User Requirements:
- Destination: {destination}
- Budget for activities: ₹{budget}
- Travel Persona: {persona}
- Trip Duration: {duration} days

Available Activities:
{json.dumps(activity_data['activities'], indent=2)}

Instructions:
1. Filter activities in the destination
2. Create a day-wise schedule for {duration} days
3. Each day should have 2-3 activities (morning, afternoon, evening)
4. Total cost must be within budget
5. Prioritize activities matching the persona
6. Keep the plan within the budget
7. Return ONLY valid JSON with this structure:
{{
    "day_wise_activities": [
        {{
            "day": 1,
            "activities": [
                {{
                    "activity_id": "string",
                    "name": "string",
                    "time_of_day": "morning/afternoon/evening",
                    "duration": "string",
                    "price": number
                }}
            ]
        }}
    ],
    "total_cost": number,
    "reason": "explanation of the activity plan"
}}

Return ONLY the JSON, no markdown, no extra text.
"""
        
        # Call Azure OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1200
        )
        
        # Parse response
        result = response.choices[0].message.content.strip()
        
        # Clean any markdown formatting
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        return json.loads(result)