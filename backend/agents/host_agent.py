from openai import AzureOpenAI
import os
import json
from agents.flight_agent import FlightAgent
from agents.hotel_agent import HotelAgent
from agents.activity_agent import ActivityAgent
from utils.helpers import calculate_trip_duration, allocate_budget

class HostAgent:
    def __init__(self, client):
        self.client = client
        self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        
        # Initialize specialist agents
        self.flight_agent = FlightAgent(client)
        self.hotel_agent = HotelAgent(client)
        self.activity_agent = ActivityAgent(client)
    
    def plan_trip(self, user_input):
        """Main coordination function"""
        
        # Extract user inputs
        destination = user_input['destination']
        start_date = user_input['start_date']
        end_date = user_input['end_date']
        total_budget = user_input['budget']
        persona = user_input['persona']
        
        # Calculate trip duration
        duration = calculate_trip_duration(start_date, end_date)
        
        # Allocate budget
        budget_allocation = allocate_budget(total_budget, duration)
        
        print(f"📊 Planning trip for {duration} days...")
        print(f"💰 Budget Allocation: {budget_allocation}")
        
        # Step 1: Get flight recommendations
        print("\n✈️ Calling Flight Agent...")
        flights = self.flight_agent.suggest_flights(
            destination=destination,
            budget=budget_allocation['flights'],
            persona=persona,
            start_date=start_date
        )
        
        # Step 2: Get hotel recommendations
        print("🏨 Calling Hotel Agent...")
        hotels = self.hotel_agent.suggest_hotels(
            destination=destination,
            budget=budget_allocation['hotels'],
            persona=persona,
            duration=duration
        )
        
        # Step 3: Get activity recommendations
        print("🎯 Calling Activity Agent...")
        activities = self.activity_agent.suggest_activities(
            destination=destination,
            budget=budget_allocation['activities'],
            persona=persona,
            duration=duration
        )
        
        # Step 4: Validate and merge results
        print("🔍 Validating and merging results...")
        
        total_spent = (
            flights.get('total_cost', 0) +
            hotels['recommended_hotel'].get('total_cost', 0) +
            activities.get('total_cost', 0)
        )
        
        # Create final itinerary
        itinerary = {
            "trip_details": {
                "destination": destination,
                "start_date": start_date,
                "end_date": end_date,
                "duration": duration,
                "persona": persona
            },
            "flights": flights,
            "hotel": hotels,
            "activities": activities,
            "budget_summary": {
                "total_budget": total_budget,
                "allocated": budget_allocation,
                "total_spent": total_spent,
                "remaining": total_budget - total_spent
            }
        }
        
        print("✅ Trip planning complete!")
        return itinerary