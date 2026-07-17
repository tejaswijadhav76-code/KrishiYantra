# KrishiYantra 🚜🌾

KrishiYantra is a premium farm machinery marketplace and rental platform featuring dedicated, secure portals for Indian farmers and rental shop owners.

It is built as a TypeScript monorepo combining a modern React frontend with a secure Node.js/Express backend, linked to a MongoDB Cloud Database, and powered by Gemini AI.

---

## Project Structure

The codebase is organized into separate folders for frontend and backend modules to ensure a clean, scalable architectural pattern:

```text
KrishiYantra/
├── README.md             <- This guide & project documentation
├── package.json          <- Monorepo workspace configuration
├── .env.example          <- Template of required environment variables
├── frontend/             <- React + TypeScript client (Vite, Tailwind CSS)
│   ├── src/              <- Frontend source code
│   │   ├── components/   <- UI components (FarmerDashboard, AiChatbot, GpsTracker, etc.)
│   │   ├── api.ts        <- API client methods matching backend routes
│   │   ├── types.ts      <- Common TypeScript types
│   │   └── data.ts       <- Fallback preset mock data
│   ├── package.json      <- Frontend scripts and dependencies
│   └── vite.config.ts    <- Vite compiler & proxy configuration
│
└── backend/              <- Node.js + Express + Mongoose Server
    ├── data/             <- Local fallback JSON database storage
    ├── db.ts             <- MongoDB Atlas connectivity & seeding logic
    ├── ai.ts             <- Gemini 2.0 AI chat & auto-listing helpers
    ├── routes.ts         <- REST API endpoint mappings (/api/...)
    ├── index.ts          <- Server entry point & dynamic CORS delegate
    └── package.json      <- Backend scripts and dependencies
```

---

## Key Features

1. **Farmer Portal**:
   * Browse and filter machinery by category (Tillage, Sowing, Harvesting, Spraying).
   * Book machinery for rent or buy directly.
   * Live GPS delivery tracking.
   * **AI Krishi Mitra Chatbot**: Interactive agronomy specialist helping farmers choose matching tools.
2. **Owner Portal**:
   * Add and manage machinery stock.
   * Approve or reject rental/purchase bookings in real time.
   * **AI Listing Generator**: Automatically writes premium product descriptions, features, and specifications.

---

## Run Locally

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set your variables:
   ```env
   GEMINI_API_KEY="your-gemini-key"
   MONGODB_URI="your-mongodb-connection-string"
   ```
4. Boot up the development servers (runs frontend on port 3000 and backend on port 5000):
   ```bash
   npm run dev
   ```
