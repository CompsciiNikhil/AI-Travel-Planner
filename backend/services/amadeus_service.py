from amadeus import Client, ResponseError
import os
from dotenv import load_dotenv

load_dotenv()

class AmadeusService:
    def __init__(self):
        self.client = Client(
            client_id=os.getenv('AMADEUS_API_KEY'),
            client_secret=os.getenv('AMADEUS_API_SECRET')
        )

    # -----------------------------------
    # FLIGHTS
    # -----------------------------------

    def search_flights(self, departure_city, destination, departure_date, adults=1, max_results=5):
        origin = departure_city
        dest = destination

        if not origin or not dest:
            return {"error": "Invalid city codes"}

        try:
            print(f"🔍 Calling Amadeus Flights API: {origin} → {dest} on {departure_date}")

            response = self.client.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=dest,
                departureDate=departure_date,
                adults=adults,
                max=max_results
            )

            print("✅ Amadeus Flights API Success")

            flights = []
            conversion_rate = 107.22  # Fixed EUR → INR for demo

            for offer in response.data:
                itinerary = offer['itineraries'][0]
                segments = itinerary['segments']

                price_value = float(offer['price']['total'])
                currency = offer['price']['currency']

                # Convert EUR → INR
                if currency == "EUR":
                    final_price = round(price_value * conversion_rate, 2)
                    final_currency = "INR"
                else:
                    final_price = price_value
                    final_currency = currency

                formatted_duration = self._format_duration(itinerary.get('duration', ''))

                flight_info = {
                    'id': offer['id'],
                    'price': final_price,
                    'currency': final_currency,

                    'departure_time': segments[0]['departure']['at'],
                    'arrival_time': segments[-1]['arrival']['at'],
                    'duration': formatted_duration,
                    'stops': len(segments) - 1,

                    'airline': segments[0].get('carrierCode', 'Unknown'),

                    # 🔥 NEW DETAILS
                    'departure_airport': segments[0]['departure']['iataCode'],
                    'arrival_airport': segments[-1]['arrival']['iataCode'],
                    'aircraft': segments[0].get('aircraft', {}).get('code', 'N/A'),
                    'cabin': offer.get('travelerPricings', [{}])[0]
                                .get('fareDetailsBySegment', [{}])[0]
                                .get('cabin', 'ECONOMY')
                }

                flights.append(flight_info)

            return {'flights': flights}

        except ResponseError as error:
            print(f"❌ Amadeus Flight API Error: {error}")
            return {"error": str(error)}

    # -----------------------------------
    # HOTELS
    # -----------------------------------

    def search_hotels(self, city, check_in_date, check_out_date, adults=1):

        try:
            print(f"🔍 Searching hotels in {city}")

            response = self.client.reference_data.locations.hotels.by_city.get(
                cityCode=city
            )

            if not response.data:
                return {"error": "No hotels found"}

            hotels = []
            conversion_rate = 107.22

            for hotel in response.data[:5]:

                hotel_id = hotel['hotelId']

                try:
                    offer_response = self.client.shopping.hotel_offers_search.get(
                        hotelIds=hotel_id,
                        checkInDate=check_in_date,
                        checkOutDate=check_out_date,
                        adults=adults
                    )

                    if not offer_response.data:
                        continue

                    hotel_data = offer_response.data[0]
                    offer = hotel_data['offers'][0]

                    price_value = float(offer['price']['total'])
                    currency = offer['price']['currency']

                    if currency == "EUR":
                        final_price = round(price_value * conversion_rate, 2)
                        final_currency = "INR"
                    else:
                        final_price = price_value
                        final_currency = currency

                    hotel_info = {
                        'id': hotel_id,
                        'name': hotel_data['hotel']['name'],
                        'price_per_night': final_price,
                        'currency': final_currency,
                        'rating': hotel_data['hotel'].get('rating', 'N/A'),
                        'amenities': hotel_data['hotel'].get('amenities', [])[:5],
                        'room_type': offer.get('room', {})
                                    .get('typeEstimated', {})
                                    .get('category', 'Standard')
                    }

                    hotels.append(hotel_info)

                except Exception as inner_error:
                    print(f"⚠️ Skipping hotel {hotel_id} due to error:", inner_error)
                    continue

            if not hotels:
                return {"error": "No available hotel offers"}

            print(f"✅ Found {len(hotels)} hotels")

            return {'hotels': hotels}

        except Exception as error:
            print(f"❌ Amadeus Hotel API Error: {error}")
            return {"error": str(error)}

    # -----------------------------------
    # ACTIVITIES
    # -----------------------------------

    def search_activities(self, city):

        iata_to_city = {
            "BOM": "mumbai",
            "DEL": "delhi",
            "BLR": "bangalore",
            "GOI": "goa",
            "MAA": "chennai",
            "CCU": "kolkata",
            "HYD": "hyderabad",
            "PNQ": "pune",
            "JAI": "jaipur",
            "COK": "kochi"
        }

        city_name = iata_to_city.get(city, city)
        lat, lng = self._get_city_coords(city_name)

        try:
            print(f"🔍 Searching activities in {city_name}")

            response = self.client.shopping.activities.get(
                latitude=lat,
                longitude=lng
            )

            activities = []

            for activity in response.data[:10]:
                activity_info = {
                    'id': activity['id'],
                    'name': activity['name'],
                    'description': activity.get('shortDescription', ''),
                    'price': float(activity['price']['amount']) if 'price' in activity else 0,
                    'currency': activity['price']['currencyCode'] if 'price' in activity else 'INR'
                }

                activities.append(activity_info)

            print(f"✅ Found {len(activities)} activities")

            return {'activities': activities}

        except ResponseError as error:
            print(f"❌ Amadeus Activities API Error: {error}")
            return {"error": str(error)}

    # -----------------------------------
    # HELPER FUNCTIONS
    # -----------------------------------

    def _get_city_coords(self, city):
        coords = {
            'mumbai': (19.0760, 72.8777),
            'delhi': (28.6139, 77.2090),
            'bangalore': (12.9716, 77.5946),
            'goa': (15.2993, 74.1240),
            'chennai': (13.0827, 80.2707),
            'kolkata': (22.5726, 88.3639),
            'hyderabad': (17.3850, 78.4867),
            'pune': (18.5204, 73.8567),
            'jaipur': (26.9124, 75.7873),
            'kochi': (9.9312, 76.2673)
        }
        return coords.get(city.lower(), (20.5937, 78.9629))

    def _format_duration(self, duration_str):
        if not duration_str:
            return "N/A"

        hours = 0
        minutes = 0

        if "H" in duration_str:
            hours = int(duration_str.split("T")[1].split("H")[0])

        if "M" in duration_str:
            minutes_part = duration_str.split("H")[-1]
            minutes = int(minutes_part.replace("M", ""))

        return f"{hours}h {minutes}m"