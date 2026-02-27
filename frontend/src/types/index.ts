export interface CollectedInfo {
  departure_city?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  persona?: string;
}

export interface Flight {
  airline: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
}

export interface Hotel {
  name: string;
  stars: number;
  price_per_night: number;
  room_type: string;
  currency: string;
}

export interface ScheduleItem {
  time_slot: string;
  time: string;
  activity_name: string;
  location: string;
  duration: string;
  tips: string;
  rating: number;
  opening_hours: string;
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  schedule: ScheduleItem[];
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  address?: string;
  location?: string;
  rating?: number;
  opening_hours?: string;
  price: number;
  currency?: string;
}

export interface FinalDecision {
  flight: Flight;
  hotel: Hotel;
  itinerary: DayPlan[];
  activities: Activity[];
  reasoning: string;
  key_tradeoffs: string;
}

export interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'user_message' | 'bot_response' | 'plan_trip' | 'planning_result';
  message?: string;
  collected_info?: CollectedInfo;
  is_complete?: boolean;
  debate_transcript?: string;
  final_decision?: FinalDecision;
}