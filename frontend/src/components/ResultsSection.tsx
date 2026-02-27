import { Plane, Star, MapPin, Clock, Sun, Sunset, Moon, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';

interface ScheduleItem {
  time_slot: string;
  time: string;
  activity_name: string;
  location: string;
  duration: string;
  tips: string;
  rating: number;
  opening_hours: string;
}

interface DayPlan {
  day: number;
  date: string;
  theme: string;
  schedule: ScheduleItem[];
}

interface ResultsSectionProps {
  planningResult: {
    debate_transcript: any;
    final_decision: {
      flight: any;
      hotel: any;
      itinerary: DayPlan[];
      activities: any[];
      reasoning: string;
      key_tradeoffs: string;
    };
  };
  onSelectFlight: (flight: any) => void;
  onSelectHotel: (hotel: any) => void;
  onSelectActivity: (activity: any) => void;
  selectedFlight: any;
  selectedHotel: any;
  selectedActivities: any[];
}

export const ResultsSection = ({
  planningResult,
  onSelectFlight,
  onSelectHotel,
  selectedFlight,
  selectedHotel,
}: ResultsSectionProps) => {
  const { final_decision } = planningResult;
  const [expandedDay, setExpandedDay] = useState<number>(1);

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return 'N/A';
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (match) {
      const hours = match[1] ? match[1].replace('H', 'h ') : '';
      const minutes = match[2] ? match[2].replace('M', 'm') : '';
      return hours + minutes;
    }
    return duration;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getTimeSlotIcon = (slot: string) => {
    if (slot === 'morning')   return <Sun className="w-4 h-4 text-yellow-400" />;
    if (slot === 'afternoon') return <Sunset className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const getTimeSlotColor = (slot: string) => {
    if (slot === 'morning')   return 'border-yellow-500/30 bg-yellow-500/5';
    if (slot === 'afternoon') return 'border-orange-500/30 bg-orange-500/5';
    return 'border-indigo-500/30 bg-indigo-500/5';
  };

  const itinerary: DayPlan[] = final_decision?.itinerary || [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">✨ Your Perfect Trip Plan</h2>
        <p className="text-slate-400 text-lg">Our AI agents debated and crafted this itinerary for you</p>
        {final_decision?.reasoning && (
          <p className="text-slate-300 text-sm mt-3 max-w-2xl mx-auto bg-slate-800/50 rounded-xl p-4">
            💡 {final_decision.reasoning}
          </p>
        )}
      </div>

      {/* ── FLIGHT ── */}
      {final_decision?.flight && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Plane className="w-6 h-6 text-indigo-400" />
            Recommended Flight
          </h3>
          <div
            className="bg-slate-800/50 rounded-xl p-6 cursor-pointer border-2 border-transparent hover:border-indigo-500 transition"
            onClick={() => onSelectFlight(final_decision.flight)}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatTime(final_decision.flight.departure_time)}</p>
                    <p className="text-sm text-slate-400">Departure</p>
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-1 bg-slate-700 rounded-full">
                      <div className="h-1 bg-indigo-500 rounded-full w-1/2"></div>
                    </div>
                    <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
                      {formatDuration(final_decision.flight.duration)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatTime(final_decision.flight.arrival_time)}</p>
                    <p className="text-sm text-slate-400">Arrival</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Plane className="w-4 h-4" />{final_decision.flight.airline || 'Airline'}</span>
                  <span>•</span>
                  <span>{final_decision.flight.stops === 0 ? 'Non-stop' : `${final_decision.flight.stops} stop(s)`}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{final_decision.flight.currency} {final_decision.flight.price}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectFlight(final_decision.flight); }}
                  className={`mt-2 px-6 py-2 rounded-lg font-semibold transition ${
                    selectedFlight?.id === final_decision.flight.id
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {selectedFlight?.id === final_decision.flight.id ? '✓ Selected' : 'Select Flight'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HOTEL ── */}
      {final_decision?.hotel && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-400" />
            Recommended Hotel
          </h3>
          <div
            className="bg-slate-800/50 rounded-xl p-6 cursor-pointer border-2 border-transparent hover:border-purple-500 transition"
            onClick={() => onSelectHotel(final_decision.hotel)}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                <Star className="w-10 h-10 text-slate-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-white mb-2">{final_decision.hotel.name}</h4>
                <p className="text-slate-400 text-sm mb-3">Room: {final_decision.hotel.room_type || 'Standard'}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{final_decision.hotel.currency} {final_decision.hotel.price_per_night}</p>
                    <p className="text-sm text-slate-400">per night</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectHotel(final_decision.hotel); }}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      selectedHotel?.id === final_decision.hotel.id
                        ? 'bg-green-600 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {selectedHotel?.id === final_decision.hotel.id ? '✓ Selected' : 'Select Hotel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DAY-WISE ITINERARY ── */}
      {itinerary.length > 0 && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-pink-400" />
            Day-wise Itinerary
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {itinerary.length} days • Click a day to expand
          </p>

          <div className="space-y-4">
            {itinerary.map((day) => (
              <div key={day.day} className="border border-slate-700 rounded-xl overflow-hidden">

                {/* Day Header — clickable */}
                <button
                  className="w-full flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 transition text-left"
                  onClick={() => setExpandedDay(expandedDay === day.day ? 0 : day.day)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      D{day.day}
                    </span>
                    <div>
                      <p className="text-white font-semibold">{day.theme || `Day ${day.day}`}</p>
                      <p className="text-slate-400 text-xs">{formatDate(day.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>{day.schedule?.length || 0} activities</span>
                    {expandedDay === day.day
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </button>

                {/* Day Schedule — expanded */}
                {expandedDay === day.day && (
                  <div className="p-4 space-y-3 bg-slate-900/30">
                    {(day.schedule || []).map((item, idx) => (
                      <div key={idx} className={`rounded-xl p-4 border ${getTimeSlotColor(item.time_slot)}`}>
                        <div className="flex items-start justify-between gap-3">

                          {/* Left: icon + time */}
                          <div className="flex items-center gap-2 flex-shrink-0 w-28">
                            {getTimeSlotIcon(item.time_slot)}
                            <div>
                              <p className="text-white font-semibold text-sm">{item.time}</p>
                              <p className="text-slate-400 text-xs capitalize">{item.time_slot}</p>
                            </div>
                          </div>

                          {/* Middle: activity details */}
                          <div className="flex-1">
                            <h5 className="text-white font-semibold mb-1">{item.activity_name}</h5>
                            <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{item.location}</span>
                            </div>
                            {item.opening_hours && item.opening_hours !== 'Hours not available' && (
                              <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                                <Clock className="w-3 h-3" />
                                <span className="line-clamp-1">{item.opening_hours}</span>
                              </div>
                            )}
                            {item.tips && (
                              <div className="flex items-start gap-1 text-yellow-400/80 text-xs bg-yellow-500/10 rounded-lg p-2">
                                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{item.tips}</span>
                              </div>
                            )}
                          </div>

                          {/* Right: rating + duration */}
                          <div className="text-right flex-shrink-0">
                            {item.rating > 0 && (
                              <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold justify-end">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                {item.rating}
                              </div>
                            )}
                            <p className="text-slate-400 text-xs mt-1">{item.duration}</p>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL ACTIVITIES LIST ── */}
      {final_decision?.activities && final_decision.activities.length > 0 && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-400" />
            All Available Attractions
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {final_decision.activities.length} attractions found in your destination
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {final_decision.activities.map((activity: any, idx: number) => (
              <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-green-500/50 transition">
                <h4 className="text-white font-semibold mb-1">{activity.name}</h4>
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{activity.address || activity.location}</span>
                </div>
                {activity.opening_hours && activity.opening_hours !== 'Hours not available' && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                    <Clock className="w-3 h-3" />
                    <span className="line-clamp-1">{activity.opening_hours}</span>
                  </div>
                )}
                {activity.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    {activity.rating}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
