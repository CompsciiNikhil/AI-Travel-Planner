# 🚀 How to Run

## Prerequisites
- Node.js (v16+)
- Python (3.9+)
- Amadeus API Key ([Get here](https://developers.amadeus.com/))

---

## Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "AMADEUS_API_KEY=your_key_here" > .env
echo "AMADEUS_API_SECRET=your_secret_here" >> .env

# Run backend
python main.py
```

**Backend runs on:** `http://localhost:8000`

---

## Frontend Setup

**Open a new terminal**

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

---

## Access

Open browser: `http://localhost:5173`

---

## Quick Troubleshooting

**"Not connected to backend":**
```bash
# Make sure backend is running on port 8000
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

**Module errors:**
```bash
# Backend
pip install -r requirements.txt --force-reinstall

# Frontend
npm install
```

---

Done! ✅
