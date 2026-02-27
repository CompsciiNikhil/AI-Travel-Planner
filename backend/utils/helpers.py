import json
from datetime import datetime, timedelta

def load_json_data(filepath):
    """Load JSON data from file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def calculate_trip_duration(start_date, end_date):
    """Calculate number of days between dates"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    return (end - start).days + 1

def allocate_budget(total_budget, duration):
    """Allocate budget across categories"""
    return {
        "flights": total_budget * 0.40,
        "hotels": total_budget * 0.35,
        "activities": total_budget * 0.25,
        "per_day_activities": (total_budget * 0.25) / duration
    }

def format_itinerary(flights, hotels, activities, budget_summary):
    """Format final itinerary as structured output"""
    return {
        "flights": flights,
        "hotels": hotels,
        "activities": activities,
        "budget_summary": budget_summary,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }