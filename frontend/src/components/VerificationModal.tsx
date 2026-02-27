import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectedInfo: {
    departure_city: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    persona: string | null;
  };
  selectedFlight: any;
  selectedHotel: any;
  selectedActivities: any[];
  total: number;
  onConfirm: () => void;
}

export const VerificationModal = ({
  isOpen,
  onClose,
  collectedInfo,
  selectedFlight,
  selectedHotel,
  selectedActivities,
  total,
  onConfirm
}: VerificationModalProps) => {
  const [checkedItems, setCheckedItems] = useState({
    departure: false,
    hotel: false,
    activities: false,
    budget: false
  });

  const allChecked = Object.values(checkedItems).every(Boolean);

  const toggleCheck = (key: keyof typeof checkedItems) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-dark-card rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">
              ✓ Verify Your Booking
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-6 h-6 text-slate-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Warning */}
            <div className="bg-amber-900/20 border border-amber-600 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 font-semibold mb-1">
                  Please verify all details before booking
                </p>
                <p className="text-amber-300 text-sm">
                  Make sure all information is correct. Changes after booking may incur additional charges.
                </p>
              </div>
            </div>

            {/* Trip Summary */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Trip Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">From</p>
                  <p className="text-white font-semibold">{collectedInfo.departure_city}</p>
                </div>
                <div>
                  <p className="text-slate-400">To</p>
                  <p className="text-white font-semibold">{collectedInfo.destination}</p>
                </div>
                <div>
                  <p className="text-slate-400">Departure</p>
                  <p className="text-white font-semibold">{collectedInfo.start_date}</p>
                </div>
                <div>
                  <p className="text-slate-400">Return</p>
                  <p className="text-white font-semibold">{collectedInfo.end_date}</p>
                </div>
                <div>
                  <p className="text-slate-400">Budget</p>
                  <p className="text-white font-semibold">₹{collectedInfo.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Travel Style</p>
                  <p className="text-white font-semibold capitalize">{collectedInfo.persona}</p>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Verification Checklist</h3>
              <div className="space-y-4">
                {/* Check 1 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checkedItems.departure}
                    onChange={() => toggleCheck('departure')}
                    className="w-5 h-5 mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition">
                      ☑ Verified departure city and date
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      From {collectedInfo.departure_city} on {collectedInfo.start_date}
                    </p>
                  </div>
                </label>

                {/* Check 2 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checkedItems.hotel}
                    onChange={() => toggleCheck('hotel')}
                    className="w-5 h-5 mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition">
                      ☑ Reviewed hotel details
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {selectedHotel ? selectedHotel.name : 'No hotel selected'}
                    </p>
                  </div>
                </label>

                {/* Check 3 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checkedItems.activities}
                    onChange={() => toggleCheck('activities')}
                    className="w-5 h-5 mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition">
                      ☑ Confirmed activities and timings
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {selectedActivities.length} activities selected
                    </p>
                  </div>
                </label>

                {/* Check 4 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checkedItems.budget}
                    onChange={() => toggleCheck('budget')}
                    className="w-5 h-5 mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition">
                      ☑ Checked total budget
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Total: ₹{total.toLocaleString()} (Budget: ₹{collectedInfo.budget?.toLocaleString()})
                      {total > (collectedInfo.budget || 0) && (
                        <span className="text-amber-500 ml-2">⚠ Over budget</span>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-6 border border-indigo-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Total Amount</h3>
              <div className="space-y-2 text-sm mb-4">
                {selectedFlight && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Flight</span>
                    <span className="text-white font-semibold">₹{selectedFlight.price?.toLocaleString()}</span>
                  </div>
                )}
                {selectedHotel && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Hotel</span>
                    <span className="text-white font-semibold">₹{selectedHotel.price_per_night?.toLocaleString()}</span>
                  </div>
                )}
                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Activities ({selectedActivities.length})</span>
                    <span className="text-white font-semibold">
                      ₹{selectedActivities.reduce((sum, a) => sum + (a.price || 0), 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-600 pt-2 mt-2"></div>
                <div className="flex justify-between text-xl">
                  <span className="text-white font-bold">Grand Total</span>
                  <span className="text-white font-bold">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-dark-card border-t border-dark-border p-6 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!allChecked}
              className={`flex-1 px-6 py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                allChecked
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirm & Book Ticket
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};