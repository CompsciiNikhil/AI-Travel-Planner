from openai import AzureOpenAI
import json
import os
from datetime import datetime


class DebateCoordinator:
    """
    Single-call debate coordinator.
    Runs 3-agent debate + day-wise itinerary in ONE LLM call (fast).
    """

    def __init__(self, client: AzureOpenAI):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")

    def conduct_debate(self, trip_context: dict, available_options: dict) -> dict:
        print("\n🎭 Starting Single-Call Agent Debate + Itinerary Generation...")

        num_days = self._calculate_days(
            trip_context.get("start_date", ""),
            trip_context.get("end_date", "")
        )
        print(f"📅 Trip duration: {num_days} days")

        prompt = self._build_prompt(trip_context, available_options, num_days)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=4000,
            )

            raw = response.choices[0].message.content.strip()
            cleaned = self._clean_json(raw)

            try:
                result = json.loads(cleaned)
            except json.JSONDecodeError:
                last_brace = cleaned.rfind("}")
                if last_brace != -1:
                    try:
                        result = json.loads(cleaned[: last_brace + 1])
                    except json.JSONDecodeError:
                        print("⚠️ JSON repair failed, using safe fallback")
                        return self._safe_fallback(available_options)
                else:
                    return self._safe_fallback(available_options)

            print("✅ Debate + itinerary complete!")
            return result

        except Exception as e:
            print(f"❌ Debate error: {e}")
            return self._safe_fallback(available_options)

    def _calculate_days(self, start_date: str, end_date: str) -> int:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            return max(1, (end - start).days)
        except Exception:
            return 3

    def _build_prompt(self, trip_context: dict, available_options: dict, num_days: int) -> str:
        return f"""You are the coordinator of a travel planning debate between three AI agents.

Trip Context:
{json.dumps(trip_context, indent=2)}

Available Options:
{json.dumps(available_options, indent=2)}

Number of days: {num_days}

STEP 1 — Simulate a 2-round debate between:
  - 💰 Budget Agent (cost savings focus)
  - 💎 Luxury Agent (comfort & quality focus)
  - 🎭 Experience Agent (memorable activities focus)
Each agent speaks ONE sentence per round (6 total entries in debate_transcript).

STEP 2 — Create a {num_days}-day itinerary using the activities from available_options.activities.
Each day must have exactly 3 schedule slots: morning (9:00 AM), afternoon (1:00 PM), evening (6:00 PM).
Each slot needs: time_slot, time, activity_name, location, duration, tips, rating, opening_hours.

STEP 3 — Copy ALL activity objects from available_options.activities into final_decision.activities.

STEP 4 — Copy the FULL flight object and FULL hotel object into final_decision (not just IDs).

Return ONLY valid JSON, no markdown fences, no extra text:

{{
  "debate_transcript": [
    {{
      "agent": "Budget Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 1 argument.",
      "counterarguments": ""
    }},
    {{
      "agent": "Luxury Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 1 argument.",
      "counterarguments": ""
    }},
    {{
      "agent": "Experience Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 1 argument.",
      "counterarguments": ""
    }},
    {{
      "agent": "Budget Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 2 argument.",
      "counterarguments": "Brief counter."
    }},
    {{
      "agent": "Luxury Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 2 argument.",
      "counterarguments": "Brief counter."
    }},
    {{
      "agent": "Experience Agent",
      "preferred_flight": "flight id or name",
      "preferred_hotel": "hotel id or name",
      "preferred_activities": ["activity names"],
      "argument": "One sentence Round 2 argument.",
      "counterarguments": "Brief counter."
    }}
  ],
  "final_decision": {{
    "flight": {{}},
    "hotel": {{}},
    "itinerary": [
      {{
        "day": 1,
        "date": "{trip_context.get('start_date', '')}",
        "theme": "Arrival & Exploration",
        "schedule": [
          {{
            "time_slot": "morning",
            "time": "9:00 AM",
            "activity_name": "Name from available activities",
            "location": "Full address or area",
            "duration": "2 hours",
            "tips": "Practical visitor tip",
            "rating": 4.5,
            "opening_hours": "9 AM - 6 PM"
          }},
          {{
            "time_slot": "afternoon",
            "time": "1:00 PM",
            "activity_name": "Name from available activities",
            "location": "Location",
            "duration": "2 hours",
            "tips": "Tip",
            "rating": 4.3,
            "opening_hours": "10 AM - 8 PM"
          }},
          {{
            "time_slot": "evening",
            "time": "6:00 PM",
            "activity_name": "Name from available activities",
            "location": "Location",
            "duration": "2 hours",
            "tips": "Tip",
            "rating": 4.6,
            "opening_hours": "5 PM - 10 PM"
          }}
        ]
      }}
    ],
    "activities": [],
    "reasoning": "2-3 sentence explanation of choices.",
    "key_tradeoffs": "What was balanced between agents."
  }}
}}

IMPORTANT: Fill final_decision.flight with the full flight object from available_options.flights[0].
Fill final_decision.hotel with the full hotel object from available_options.hotels[0].
Fill final_decision.activities with ALL objects from available_options.activities.
Create {num_days} day entries in itinerary (not just 1).
"""

    def _safe_fallback(self, available_options: dict) -> dict:
        flights = available_options.get("flights", [])
        hotels = available_options.get("hotels", [])
        activities = available_options.get("activities", [])
        return {
            "debate_transcript": [
                {
                    "agent": "Budget Agent",
                    "preferred_flight": "",
                    "preferred_hotel": "",
                    "preferred_activities": [],
                    "argument": "Selected the most cost-effective options for your trip.",
                    "counterarguments": "",
                }
            ],
            "final_decision": {
                "flight": flights[0] if flights else None,
                "hotel": hotels[0] if hotels else None,
                "itinerary": [],
                "activities": activities,
                "reasoning": "Best options selected based on your preferences.",
                "key_tradeoffs": "Balanced cost and experience.",
            },
        }

    def _clean_json(self, raw: str) -> str:
        if raw.startswith("```"):
            parts = raw.split("```")
            content = parts[1] if len(parts) > 1 else raw
            if content.startswith("json"):
                content = content[4:]
            return content.strip()
        return raw