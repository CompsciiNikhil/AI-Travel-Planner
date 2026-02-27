import { Plane, Hotel, MapPin } from 'lucide-react';

interface BottomSummaryProps {
  selectedFlight: any;
  selectedHotel: any;
  selectedActivities: any[];
  collectedInfo: {
    departure_city: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    persona: string | null;
  };
  total: number;
  onProceed: () => void;
}

export const BottomSummary = ({
  selectedFlight,
  selectedHotel,
  selectedActivities,
  collectedInfo,
  total,
  onProceed
}: BottomSummaryProps) => {
  const calculateNights = () => {
    if (collectedInfo.start_date && collectedInfo.end_date) {
      const start = new Date(collectedInfo.start_date);
      const end = new Date(collectedInfo.end_date);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return nights;
    }
    return 1;
  };

  const nights = calculateNights();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl z-40 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Selected Items Summary */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Flight */}
            {selectedFlight && (
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Plane className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-400">Flight</p>
                  <p className="text-sm text-white font-semibold">
                    {selectedFlight.airline || 'Selected'}
                  </p>
                </div>
              </div>
            )}

            {/* Hotel */}
            {selectedHotel && (
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Hotel className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-400">Hotel ({nights} nights)</p>
                  <p className="text-sm text-white font-semibold">
                    {selectedHotel.name || 'Selected'}
                  </p>
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedActivities.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-xs text-slate-400">Activities</p>
                  <p className="text-sm text-white font-semibold">
                    {selectedActivities.length} selected
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="flex items-center gap-6">
            {/* Total Price */}
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Price</p>
              <p className="text-3xl font-bold text-white">
                ₹{total.toLocaleString()}
              </p>
            </div>

            {/* Proceed Button */}
            <button
              onClick={onProceed}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
            >
              Review & Book
            </button>
          </div>
        </div>

        {/* Price Breakdown Details */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {selectedFlight && (
              <div>
                <p className="text-slate-400">Flight</p>
                <p className="text-white font-semibold">
                  ₹{selectedFlight.price?.toLocaleString() || 0}
                </p>
              </div>
            )}
            {selectedHotel && (
              <div>
                <p className="text-slate-400">Hotel ({nights}× nights)</p>
                <p className="text-white font-semibold">
                  ₹{((selectedHotel.price_per_night || 0) * nights).toLocaleString()}
                </p>
              </div>
            )}
            {selectedActivities.length > 0 && (
              <div>
                <p className="text-slate-400">Activities</p>
                <p className="text-white font-semibold">
                  ₹{selectedActivities.reduce((sum, a) => sum + (a.price || 0), 0).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400">Grand Total</p>
              <p className="text-white font-bold text-lg">
                ₹{total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};