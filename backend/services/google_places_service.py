import os
import requests

class GooglePlacesService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.base_url = "https://places.googleapis.com/v1/places:searchText"
        self.city_map = {
            "mumbai": "Mumbai, India", "bombay": "Mumbai, India", "bom": "Mumbai, India",
            "delhi": "New Delhi, India", "new delhi": "New Delhi, India", "del": "New Delhi, India",
            "bangalore": "Bangalore, India", "bengaluru": "Bangalore, India", "blr": "Bangalore, India",
            "goa": "Goa, India", "goi": "Goa, India",
            "chennai": "Chennai, India", "madras": "Chennai, India", "maa": "Chennai, India",
            "kolkata": "Kolkata, India", "calcutta": "Kolkata, India", "ccu": "Kolkata, India",
            "hyderabad": "Hyderabad, India", "hyd": "Hyderabad, India",
            "pune": "Pune, India", "pnq": "Pune, India",
            "jaipur": "Jaipur, India", "jai": "Jaipur, India",
            "kochi": "Kochi, India", "cochin": "Kochi, India", "cok": "Kochi, India",
        }

    def search_activities(self, city: str, max_results: int = 10) -> dict:
        if not self.api_key:
            return {"error": "GOOGLE_PLACES_API_KEY not set in .env"}

        full_city = self.city_map.get(city.lower().strip(), f"{city}, India")
        query = f"Tourist attractions in {full_city}"
        print(f"🌍 Google Places query: {query}")

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": (
                "places.displayName,places.rating,places.formattedAddress,"
                "places.regularOpeningHours,places.primaryTypeDisplayName,places.userRatingCount"
            ),
        }
        payload = {"textQuery": query, "maxResultCount": max_results, "languageCode": "en"}

        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=10)
            if response.status_code == 400:
                return {"error": f"Bad request: {response.text}"}
            if response.status_code == 403:
                return {"error": "Invalid API key or Places API (New) not enabled in Google Cloud"}
            if response.status_code == 429:
                return {"error": "Google Places quota exceeded"}
            response.raise_for_status()

            places = response.json().get("places", [])
            if not places:
                return {"error": f"No places found for {full_city}"}

            activities = self._parse_activities(places, city)
            print(f"✅ Google Places returned {len(activities)} activities")
            return {"activities": activities}

        except requests.exceptions.Timeout:
            return {"error": "Google Places request timed out"}
        except Exception as e:
            return {"error": f"Google Places error: {str(e)}"}

    def _parse_activities(self, places: list, city: str) -> list:
        activities = []
        for i, place in enumerate(places):
            activities.append({
                "id": f"GPLACE_{i+1:03d}",
                "name": place.get("displayName", {}).get("text", "Unknown Place"),
                "location": city,
                "address": place.get("formattedAddress", ""),
                "duration": "2 hours",
                "price": 0,
                "time_of_day": "morning",
                "category": place.get("primaryTypeDisplayName", {}).get("text", "Attraction"),
                "rating": place.get("rating", 0.0),
                "rating_count": place.get("userRatingCount", 0),
                "opening_hours": self._extract_opening_hours(place.get("regularOpeningHours", {})),
                "persona_match": ["budget", "luxury", "experience", "cultural", "balanced"],
            })
        return activities

    def _extract_opening_hours(self, hours_data: dict) -> str:
        if not hours_data:
            return "Hours not available"
        descriptions = hours_data.get("weekdayDescriptions", [])
        if descriptions:
            return " | ".join(descriptions[:3])
        is_open = hours_data.get("openNow")
        if is_open is True:
            return "Currently open"
        elif is_open is False:
            return "Currently closed"
        return "Hours not available"