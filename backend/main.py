from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import traceback

from conversation.conversation_manager import ConversationManager
from debate.debate_coordinator import DebateCoordinator
from services.amadeus_service import AmadeusService
from services.google_places_service import GooglePlacesService  # ✅ NEW

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

azure_client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

print("🔧 Initializing Amadeus Service...")
amadeus_service = AmadeusService()
print("✅ Amadeus Service initialized\n")

print("🔧 Initializing Google Places Service...")
google_places_service = GooglePlacesService()  # ✅ NEW
print("✅ Google Places Service initialized\n")

conversations = {}


class ChatMessage(BaseModel):
    message: str
    session_id: str


def load_mock_activities(destination: str) -> list:
    """Load mock activities filtered by destination city name"""
    try:
        with open('data/mock_activities.json', 'r') as f:
            mock_data = json.load(f)
            all_activities = mock_data.get('activities', [])
            filtered = [
                a for a in all_activities
                if a.get('location', '').lower() == destination.lower()
            ]
            return filtered if filtered else all_activities
    except Exception as e:
        print(f"❌ Error loading mock activities: {e}")
        return []


@app.get("/")
def root():
    return {
        "status": "Travel Planner API is running",
        "version": "4.0",
        "endpoints": {"chat": "/api/chat", "websocket": "/ws/voice"}
    }


@app.post("/api/chat")
async def chat(data: ChatMessage):
    session_id = data.session_id
    if session_id not in conversations:
        conversations[session_id] = ConversationManager()
    conv_manager = conversations[session_id]
    try:
        response = conv_manager.process_message(data.message)
        return {
            "response": response,
            "collected_info": conv_manager.get_collected_info(),
            "is_complete": conv_manager.is_complete()
        }
    except Exception as e:
        traceback.print_exc()
        return {"response": f"Error: {str(e)}", "collected_info": {}, "is_complete": False}


@app.websocket("/ws/voice")
async def voice_chat(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket connection accepted")

    conv_manager = ConversationManager()

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            print(f"\n📩 Received: {message_data}")

            # ── USER CHAT MESSAGE ────────────────────────────────────────────
            if message_data['type'] == 'user_message':
                user_message = message_data['message']
                print(f"💬 User: {user_message}")

                result = conv_manager.process_message(user_message)

                print(f"🤖 Bot: {result['message']}")
                print(f"📊 Stage: {result['current_stage']}")

                await websocket.send_text(json.dumps({
                    'type': 'bot_response',
                    'message': result['message'],
                    'collected_info': result['collected_info'],
                    'current_stage': result['current_stage'],
                    'is_complete': conv_manager.is_complete()
                }))

                if result.get('should_show_options'):
                    options_type = result['should_show_options']
                    print(f"🎯 Fetching {options_type}...")
                    collected = conv_manager.get_collected_info()

                    try:
                        if options_type == 'flights':
                            flights_data = amadeus_service.search_flights(
                                departure_city=collected['departure_city'],
                                destination=collected['destination'],
                                departure_date=collected['start_date'],
                                max_results=3
                            )
                            if 'error' not in flights_data:
                                options = flights_data.get('flights', [])[:3]
                                print(f"✈️ Found {len(options)} flights")
                            else:
                                print("⚠️ Amadeus failed, using mock flights")
                                with open('data/mock_flights.json', 'r') as f:
                                    options = json.load(f).get('flights', [])[:3]

                            await websocket.send_text(json.dumps({
                                'type': 'show_options',
                                'options_type': 'flights',
                                'options': options,
                                'message': f'Here are the best 3 flights from {collected["departure_city"]} to {collected["destination"]}:'
                            }))

                        elif options_type == 'hotels':
                            hotels_data = amadeus_service.search_hotels(
                                city=collected['destination'],
                                check_in_date=collected['start_date'],
                                check_out_date=collected['end_date']
                            )
                            if 'error' not in hotels_data:
                                options = hotels_data.get('hotels', [])[:5]
                                print(f"🏨 Found {len(options)} hotels")
                            else:
                                print("⚠️ Amadeus failed, using mock hotels")
                                with open('data/mock_hotels.json', 'r') as f:
                                    mock_data = json.load(f)
                                options = mock_data.get(collected['destination'], [])[:5]

                            await websocket.send_text(json.dumps({
                                'type': 'show_options',
                                'options_type': 'hotels',
                                'options': options,
                                'message': f'Here are 5 great hotels in {collected["destination"]}:'
                            }))

                        elif options_type == 'activities':
                            # ✅ Google Places first, mock fallback
                            print(f"🌍 Searching Google Places for {collected['destination']}...")
                            activities_data = google_places_service.search_activities(
                                city=collected['destination'], max_results=10
                            )
                            if 'error' not in activities_data:
                                options = activities_data.get('activities', [])[:8]
                                print(f"✅ Google Places: {len(options)} activities")
                            else:
                                print(f"❌ Google Places error: {activities_data.get('error')}")
                                print("⚠️ Using mock activities")
                                options = load_mock_activities(collected['destination'])[:8]

                            await websocket.send_text(json.dumps({
                                'type': 'show_options',
                                'options_type': 'activities',
                                'options': options,
                                'message': f'Here are 8 amazing things to do in {collected["destination"]}:'
                            }))

                    except Exception as e:
                        print(f"❌ Error fetching options: {e}")
                        traceback.print_exc()

            # ── FLIGHT SELECTED ──────────────────────────────────────────────
            elif message_data['type'] == 'select_flight':
                flight_data = message_data['flight']
                result = conv_manager.select_flight(flight_data)
                print(f"✈️ Flight selected: {flight_data.get('airline', 'Unknown')}")

                await websocket.send_text(json.dumps({
                    'type': 'bot_response',
                    'message': result['message'],
                    'collected_info': result['collected_info'],
                    'current_stage': result['current_stage'],
                    'is_complete': conv_manager.is_complete()
                }))

                if result.get('should_show_options') == 'hotels':
                    collected = conv_manager.get_collected_info()
                    try:
                        hotels_data = amadeus_service.search_hotels(
                            city=collected['destination'],
                            check_in_date=collected['start_date'],
                            check_out_date=collected['end_date']
                        )
                        if 'error' not in hotels_data:
                            options = hotels_data.get('hotels', [])[:5]
                        else:
                            with open('data/mock_hotels.json', 'r') as f:
                                mock_data = json.load(f)
                            options = mock_data.get(collected['destination'], [])[:5]

                        await websocket.send_text(json.dumps({
                            'type': 'show_options',
                            'options_type': 'hotels',
                            'options': options,
                            'message': 'Here are 5 great hotels:'
                        }))
                    except Exception as e:
                        print(f"❌ Error fetching hotels: {e}")

            # ── HOTEL SELECTED ───────────────────────────────────────────────
            elif message_data['type'] == 'select_hotel':
                hotel_data = message_data['hotel']
                result = conv_manager.select_hotel(hotel_data)
                print(f"🏨 Hotel selected: {hotel_data.get('name', 'Unknown')}")

                await websocket.send_text(json.dumps({
                    'type': 'bot_response',
                    'message': result['message'],
                    'collected_info': result['collected_info'],
                    'current_stage': result['current_stage'],
                    'is_complete': conv_manager.is_complete()
                }))

                if result.get('should_show_options') == 'activities':
                    collected = conv_manager.get_collected_info()
                    try:
                        # ✅ Google Places first, mock fallback
                        print(f"🌍 Searching Google Places for {collected['destination']}...")
                        activities_data = google_places_service.search_activities(
                            city=collected['destination'], max_results=10
                        )
                        if 'error' not in activities_data:
                            options = activities_data.get('activities', [])[:8]
                            print(f"✅ Google Places: {len(options)} activities")
                        else:
                            print(f"❌ Google Places error: {activities_data.get('error')}")
                            print("⚠️ Using mock activities")
                            options = load_mock_activities(collected['destination'])[:8]

                        await websocket.send_text(json.dumps({
                            'type': 'show_options',
                            'options_type': 'activities',
                            'options': options,
                            'message': 'Here are 8 amazing things to do:'
                        }))
                    except Exception as e:
                        print(f"❌ Error fetching activities: {e}")

            # ── ACTIVITY SELECTED ────────────────────────────────────────────
            elif message_data['type'] == 'select_activity':
                activity_data = message_data['activity']
                result = conv_manager.select_activity(activity_data)
                print(f"🎯 Activity selected: {activity_data.get('name', 'Unknown')}")

                await websocket.send_text(json.dumps({
                    'type': 'bot_response',
                    'message': result['message'],
                    'collected_info': result['collected_info'],
                    'current_stage': result['current_stage'],
                    'is_complete': conv_manager.is_complete()
                }))

            # ── FINALIZE — run debate + itinerary ───────────────────────────
            elif message_data['type'] == 'finalize':
                result = conv_manager.finalize_selections()

                await websocket.send_text(json.dumps({
                    'type': 'bot_response',
                    'message': result['message'],
                    'collected_info': result['collected_info'],
                    'current_stage': 'complete',
                    'is_complete': True
                }))

                print("\n" + "=" * 70)
                print("🎯 Running AI Agent Debate + Day-wise Itinerary...")
                print("=" * 70)

                collected = conv_manager.get_collected_info()

                # ✅ FIXED: correct method name and correct argument structure
                available_options = {
                    'flights': [collected['selected_flight']] if collected.get('selected_flight') else [],
                    'hotels': [collected['selected_hotel']] if collected.get('selected_hotel') else [],
                    'activities': collected.get('selected_activities', [])
                }
                trip_context = {
                    'departure_city': collected.get('departure_city'),
                    'destination': collected.get('destination'),
                    'start_date': collected.get('start_date'),
                    'end_date': collected.get('end_date'),
                    'budget': collected.get('budget', 50000),
                    'persona': collected.get('persona', 'balanced')
                }

                try:
                    # ✅ FIXED: DebateCoordinator(azure_client) + .conduct_debate()
                    debate_coordinator = DebateCoordinator(azure_client)
                    debate_result = debate_coordinator.conduct_debate(trip_context, available_options)
                    print("✅ Debate complete! Sending results...")

                    await websocket.send_text(json.dumps({
                        'type': 'planning_result',
                        'debate_transcript': debate_result['debate_transcript'],
                        'final_decision': debate_result['final_decision']
                    }))

                except Exception as e:
                    print(f"❌ Debate error: {e}")
                    traceback.print_exc()
                    await websocket.send_text(json.dumps({
                        'type': 'planning_result',
                        'debate_transcript': [],
                        'final_decision': {
                            'flight': collected.get('selected_flight'),
                            'hotel': collected.get('selected_hotel'),
                            'activities': collected.get('selected_activities', []),
                            'itinerary': [],
                            'reasoning': 'Selected based on your preferences.',
                            'key_tradeoffs': 'Balanced approach.'
                        }
                    }))

    except WebSocketDisconnect:
        print("⚠️ WebSocket client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 70)
    print("🚀 Starting AI Travel Planner API (v4.0 — Google Places + Itinerary)")
    print("=" * 70)
    print("📍 Server: http://0.0.0.0:8000")
    print("🌐 Frontend: http://localhost:3000 or http://localhost:5173")
    print("📡 WebSocket: ws://localhost:8000/ws/voice")
    print("=" * 70 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)