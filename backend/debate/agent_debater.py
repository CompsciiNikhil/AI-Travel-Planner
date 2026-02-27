from openai import AzureOpenAI
import os
import json

class AgentDebater:
    """Individual specialist agent that can debate"""
    
    def __init__(self, client, agent_type):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        self.agent_type = agent_type
        self.persona = self._get_persona()
    
    def _get_persona(self):
        """Define personality for each agent type"""
        personas = {
            "budget": {
                "name": "Budget Agent",
                "priority": "cost savings",
                "style": "practical and money-conscious"
            },
            "luxury": {
                "name": "Luxury Agent",
                "priority": "comfort and quality",
                "style": "sophisticated and quality-focused"
            },
            "experience": {
                "name": "Experience Agent",
                "priority": "memorable activities",
                "style": "enthusiastic and adventure-focused"
            }
        }
        return personas.get(self.agent_type, personas["budget"])
    
    def make_argument(self, context, options, debate_history=None):
        """Make an argument for specific choices"""
        
        prompt = f"""You are the {self.persona['name']}, a specialist travel agent.
Your priority: {self.persona['priority']}
Your style: {self.persona['style']}

Trip Context:
{json.dumps(context, indent=2)}

Available Options:
{json.dumps(options, indent=2)}

Previous debate (if any):
{json.dumps(debate_history, indent=2) if debate_history else "No previous arguments"}

Your task:
1. Analyze the options from YOUR perspective ({self.persona['priority']})
2. Make a STRONG argument for your preferred choices
3. Respond to other agents' arguments if any exist
4. Be opinionated but respectful

Return ONLY valid JSON with this structure:
{{
    "agent": "{self.persona['name']}",
    "preferred_flight": "flight_id or null",
    "preferred_hotel": "hotel_id or null", 
    "preferred_activities": ["activity_ids"],
    "argument": "Your argument in 2-3 sentences explaining WHY these choices align with {self.persona['priority']}",
    "counterarguments": "If other agents argued, respond to them briefly"
}}

Return ONLY the JSON, no markdown, no extra text.
"""
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=600
        )
        
        result = response.choices[0].message.content.strip()
        
        # Clean markdown if present
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        return json.loads(result)