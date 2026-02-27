from amadeus import Client
import os
from dotenv import load_dotenv

load_dotenv()

print("Testing Amadeus API Connection...")
print("=" * 50)

# Check if credentials exist
api_key = os.getenv('AMADEUS_API_KEY')
api_secret = os.getenv('AMADEUS_API_SECRET')

print(f"API Key: {api_key[:10]}..." if api_key else "API Key: NOT FOUND")
print(f"API Secret: {api_secret[:10]}..." if api_secret else "API Secret: NOT FOUND")
print("=" * 50)

if not api_key or not api_secret:
    print("❌ ERROR: Amadeus credentials not found in .env file!")
    print("Please add AMADEUS_API_KEY and AMADEUS_API_SECRET to your .env file")
    exit(1)

try:
    # Initialize client
    client = Client(
        client_id=api_key,
        client_secret=api_secret
    )
    print("✅ Client initialized successfully")
    
    # Test 1: Search for flights
    print("\n🛫 Testing Flight Search: Bangalore (BLR) → Mumbai (BOM)")
    print("-" * 50)
    
    response = client.shopping.flight_offers_search.get(
        originLocationCode='BLR',
        destinationLocationCode='BOM',
        departureDate='2026-03-15',
        adults=1,
        max=3
    )
    
    if response.data:
        print(f"✅ Found {len(response.data)} flights!")
        for i, offer in enumerate(response.data[:3], 1):
            price = offer['price']['total']
            currency = offer['price']['currency']
            print(f"   Flight {i}: {currency} {price}")
    else:
        print("⚠️  No flights found (but API is working)")
    
    # Test 2: Search for hotels
    print("\n🏨 Testing Hotel Search: Mumbai (BOM)")
    print("-" * 50)
    
    hotel_response = client.reference_data.locations.hotels.by_city.get(
        cityCode='BOM'
    )
    
    if hotel_response.data:
        print(f"✅ Found {len(hotel_response.data)} hotels!")
        for i, hotel in enumerate(hotel_response.data[:3], 1):
            print(f"   Hotel {i}: {hotel.get('name', 'Unknown')}")
    else:
        print("⚠️  No hotels found (but API is working)")
    
    # Test 3: Search for activities
    print("\n🎯 Testing Activities Search: Mumbai")
    print("-" * 50)
    
    activities_response = client.shopping.activities.get(
        latitude=19.0760,
        longitude=72.8777
    )
    
    if activities_response.data:
        print(f"✅ Found {len(activities_response.data)} activities!")
        for i, activity in enumerate(activities_response.data[:3], 1):
            print(f"   Activity {i}: {activity.get('name', 'Unknown')}")
    else:
        print("⚠️  No activities found (but API is working)")
    
    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED! Amadeus API is working!")
    print("=" * 50)

except Exception as e:
    print("\n" + "=" * 50)
    print("❌ ERROR: Amadeus API test failed!")
    print("=" * 50)
    print(f"Error details: {str(e)}")
    print("\nPossible issues:")
    print("1. Invalid API credentials")
    print("2. No internet connection")
    print("3. Amadeus API is down")
    print("4. Free tier limit exceeded (2000 calls/month)")