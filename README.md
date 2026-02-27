# 🌍 AI-Powered Travel Planning Platform

> An intelligent travel planning application that uses conversational AI to help users plan complete trips with flights, hotels, and activities through voice or text chat.
---

## 📋 Overview

An AI travel assistant that collects your travel preferences through natural conversation, searches real-time flight and hotel data using the Amadeus API, and presents personalized recommendations. Users can interact via voice or text, select their preferred options, and receive a complete trip itinerary with cost breakdown.

### Key Features

- 🗣️ **Voice & Text Chat** - Multi-modal interaction with AI assistant
- ✈️ **Real-time Search** - Live flight and hotel data via Amadeus API
- 🤖 **Smart Recommendations** - AI agents debate options to find best matches
- 💰 **Budget Tracking** - Real-time cost calculation and budget-aware filtering
- 🎯 **Interactive Selection** - Visual cards for easy comparison
- ✅ **Trip Verification** - Complete summary before booking

---

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, WebSocket  
**Backend:** Python, FastAPI, WebSocket  
**API:** Amadeus Travel API (flights, hotels), Google-Places-API, Open AI gpt-4.o
**AI:** Custom conversation engine with multi-agent debate system

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- Amadeus API credentials ([Get here](https://developers.amadeus.com/))

### Installation

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt

# Create .env file with:
# AMADEUS_API_KEY=your_key
# AMADEUS_API_SECRET=your_secret

python main.py
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**Access:** Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main app & WebSocket handler
│   │   └── main.tsx         # Entry point
│   └── package.json
│
├── backend/
│   ├── main.py              # FastAPI & WebSocket server
│   ├── amadeus_service.py   # API integration
│   ├── conversation_manager.py  # Dialogue flow
│   ├── ai_debate.py         # AI recommendation system
│   └── requirements.txt
│
└── README.md
```

---

## 🔄 How It Works

1. **Conversation:** User chats with AI to share travel preferences (dates, destination, budget, style)
2. **Search:** System queries Amadeus API for flights, hotels, and activities
3. **Recommendations:** AI agents debate options and present best matches
4. **Selection:** User browses visual cards and selects preferred options
5. **Verification:** Complete trip summary with total cost before booking

---

## 🔌 WebSocket Communication

**Client → Server:**
```json
{ "type": "user_message", "message": "I want to go to Paris" }
{ "type": "select_flight", "flight": {...} }
{ "type": "finalize" }
```

**Server → Client:**
```json
{ "type": "bot_response", "message": "...", "collected_info": {...} }
{ "type": "show_options", "options_type": "flights", "options": [...] }
{ "type": "planning_result", "final_decision": {...} }
```

---

## 🎯 Core Components

- **VoiceModal.tsx** - Full-screen voice interface
- **ChatSideBar.tsx** - Text chat sidebar
- **OptionCards.tsx** - Display flight/hotel/activity options
- **ResultsSection.tsx** - AI recommendations dashboard
- **VerificationModal.tsx** - Final booking confirmation

---

## 🔮 Future Enhancements

- User authentication & saved trips
- Payment processing integration
- Multi-city itineraries
- Mobile app
- Group travel planning
- Real-time price alerts
