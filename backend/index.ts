import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';
import { db } from './db';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Main DB initialisation
db.init().then(() => {
  console.log('Database loaded and seeded successfully.');
}).catch((err) => {
  console.error('Failed to initialize database:', err);
});

// Mount Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong inside the server!' });
});

app.listen(PORT, () => {
  console.log(`[Server] Yantra backend running on port http://localhost:${PORT}`);
});
