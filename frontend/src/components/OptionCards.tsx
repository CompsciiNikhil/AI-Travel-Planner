import { Plane, Hotel, MapPin, Clock, Star, Check } from 'lucide-react';

interface Flight {
  id: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;

  departure_airport?: string;
  arrival_airport?: string;
  aircraft?: string;
  cabin?: string;
}

interface Hotel {
  id: string;
  name: string;
  price_per_night: number;
  currency: string;
  rating?: number;
  room_type?: string;
  amenities?: string[];
}

interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
}

interface OptionCardsProps {
  type: 'flights' | 'hotels' | 'activities';
  options: Flight[] | Hotel[] | Activity[];
  onSelect: (option: any) => void;
  selectedIds?: string[];
}

export const OptionCards = ({ type, options, onSelect, selectedIds = [] }: OptionCardsProps) => {

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // ========================
  // FLIGHTS
  // ========================

  if (type === 'flights') {
    return (
      <div className="space-y-3">
        {(options as Flight[]).map((flight) => {
          const isSelected = selectedIds.includes(flight.id);

          return (
            <div
              key={flight.id}
              onClick={() => onSelect(flight)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-indigo-500 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">

                  {/* Airline */}
                  <div className="flex items-center gap-3 mb-3">
                    <Plane className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-white text-lg">
                      {flight.airline}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-green-500" />}
                  </div>

                  {/* Airports */}
                  <p className="text-sm text-slate-400 mb-2">
                    {flight.departure_airport} → {flight.arrival_airport}
                  </p>

                  {/* Timeline */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatTime(flight.departure_time)}
                      </p>
                      <p className="text-xs text-slate-400">Departure</p>
                    </div>

                    <div className="flex-1 relative">
                      <div className="h-1 bg-slate-600 rounded-full">
                        <div className="h-1 bg-indigo-500 rounded-full w-1/2"></div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-2 py-1 rounded-full">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {flight.duration}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatTime(flight.arrival_time)}
                      </p>
                      <p className="text-xs text-slate-400">Arrival</p>
                    </div>
                  </div>

                  {/* Extra Details */}
                  <div className="mt-2 text-sm text-slate-400">
                    {flight.stops === 0 ? '✈️ Non-stop' : `🔄 ${flight.stops} stop(s)`}
                    {flight.aircraft && ` • Aircraft: ${flight.aircraft}`}
                    {flight.cabin && ` • ${flight.cabin}`}
                  </div>
                </div>

                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-white">
                    ₹ {flight.price.toLocaleString()}
                  </p>
                  <button
                    className={`mt-2 px-4 py-2 rounded-lg font-semibold transition ${
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ========================
  // HOTELS
  // ========================

  if (type === 'hotels') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(options as Hotel[]).map((hotel) => {
          const isSelected = selectedIds.includes(hotel.id);

          return (
            <div
              key={hotel.id}
              onClick={() => onSelect(hotel)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-purple-500 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Hotel className="w-5 h-5 text-purple-400 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg mb-1">
                    {hotel.name}
                  </h4>

                  {/* Rating */}
                  {hotel.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                      <span className="text-xs text-slate-400 ml-2">
                        {hotel.rating}
                      </span>
                    </div>
                  )}

                  {/* Room */}
                  {hotel.room_type && (
                    <p className="text-sm text-slate-400 mb-1">
                      Room: {hotel.room_type}
                    </p>
                  )}

                  {/* Amenities */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <p className="text-xs text-slate-400">
                      {hotel.amenities.slice(0, 4).join(' • ')}
                    </p>
                  )}
                </div>

                {isSelected && <Check className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-2xl font-bold text-white">
                    ₹ {hotel.price_per_night.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">per night</p>
                </div>

                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ========================
  // ACTIVITIES
  // ========================

  if (type === 'activities') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(options as Activity[]).map((activity) => {
          const isSelected = selectedIds.includes(activity.id);

          return (
            <div
              key={activity.id}
              onClick={() => onSelect(activity)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-pink-500 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <MapPin className="w-5 h-5 text-pink-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {activity.name}
                    </h4>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-green-500 ml-2" />}
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="text-xl font-bold text-white">
                  ₹ {activity.price.toLocaleString()}
                </p>

                <button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {isSelected ? '✓ Added' : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};