import { Router, Request, Response } from 'express';
import { db } from './db';
import { Booking, Machine, Review } from '../frontend/src/types';

export const router = Router();

// In-memory store for pending OTPs (phone -> otp)
const otpStore = new Map<string, string>();

// Auth Routes
router.post('/auth/login', async (req: Request, res: Response) => {
  const { phone, role } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  // Generate a mock 6-digit OTP
  const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, generatedCode);
  console.log(`[SMS Gateway Simulate] OTP for ${phone} (${role}): ${generatedCode}`);

  return res.json({
    message: 'OTP sent successfully',
    otp: generatedCode // sent back for convenience in UI toast
  });
});

router.post('/auth/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, role } = req.body;
  const storedOtp = otpStore.get(phone);

  // Bypass fallback check for convenience: '123456'
  if (otp === storedOtp || otp === '123456') {
    otpStore.delete(phone); // clean up

    // Provide default profile info based on role if they are logging in first time
    const defaultProfile = {
      name: role === 'farmer' ? 'Ramrao Patil' : 'Ramesh Deshmukh',
      location: 'Indore, Madhya Pradesh',
      storeName: role === 'owner' ? 'Ramesh Farm Rentals' : undefined
    };

    return res.json({
      success: true,
      defaultProfile
    });
  } else {
    return res.status(400).json({ error: 'Invalid OTP. Please check the SMS log or enter 123456.' });
  }
});

router.post('/auth/profile', async (req: Request, res: Response) => {
  const { phone, role, name, location, storeName } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const avatar = role === 'farmer'
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxeNo9aGLuYdjl3TybTeDw2_mgmxg5mxrIexSqR9ZLHFcyZL9L_Hb5CR7CtZFs35lV0zqzGKcWktX1Mo7Ff0GphZWLvbU9Ok8s-Lt9TIrpovFpqfI3bOF6AkpervaDYyz0IyP4df-7sMemBDNKJUbeVAX0e9wPD1Rzi8-eceWpQjE35bPznT3JlqJsG9iWcpBJ5rbOiXmaeTSG0GLziAeryffo9tT7VkvjJOlUZTam2qIBH9MfDolzffmunFxgBhxOkGsSUoRfG2Cy'
    : 'https://lh3.googleusercontent.com/aida/AP1WRLuun4_Q_lHeO0PO7jA5h9P5bLVC9t6iNCUl9srbIV_l0ODTPTv9r0kl21dVNDd-FSR3DLO5d5D1CtC-XkouEbeMKDvzpaVjB6GMEJiY9V1xUlO7pTWgg6IT48RB_OoFYx0BKykWuW5HULggz5hopp7XBulrAx9qylKX9d3HVN4h24HrnODM4bMPBozzNBQORY18Pgys34hMo_trFJBnVu4UYmlpo3EX9NxrcRPZoMled71kMFvjYmen-6A';

  const user = {
    phone,
    role,
    name,
    avatar,
    location,
    storeName: role === 'owner' ? storeName || 'Ramesh Farm Rentals' : undefined
  };

  return res.json({
    success: true,
    user
  });
});

// Machine Routes
router.get('/machines', async (req: Request, res: Response) => {
  try {
    const machines = await db.getMachines();
    return res.json(machines);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to retrieve machines' });
  }
});

router.get('/machines/:id', async (req: Request, res: Response) => {
  try {
    const machine = await db.getMachine(req.params.id);
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    return res.json(machine);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to retrieve machine details' });
  }
});

router.post('/machines', async (req: Request, res: Response) => {
  try {
    const machineData = req.body as Machine;
    const newMachine = await db.createMachine(machineData);
    return res.status(201).json(newMachine);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list machinery stock' });
  }
});

router.put('/machines', async (req: Request, res: Response) => {
  // Supports updating the entire machines array if requested by OwnerDashboard
  try {
    const machines = req.body as Machine[];
    const updated = await db.updateMachines(machines);
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update machinery' });
  }
});

router.put('/machines/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateMachine(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Machine not found' });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update machinery' });
  }
});

router.delete('/machines/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteMachine(req.params.id);
    if (!success) return res.status(404).json({ error: 'Machine not found' });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete machinery' });
  }
});

// Bookings Routes
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await db.getBookings();
    return res.json(bookings);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const bookingData = req.body as Booking;
    const newBooking = await db.createBooking(bookingData);
    return res.status(201).json(newBooking);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.patch('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }
    const updated = await db.updateBookingStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Reviews Routes
router.get('/machines/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await db.getReviews(req.params.id);
    return res.json(reviews);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/machines/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviewData = req.body as Review;
    const newReview = await db.createReview(req.params.id, reviewData);
    return res.status(201).json(newReview);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GPS Telemetry Route
router.get('/gps/:machineId', async (req: Request, res: Response) => {
  // Simulate telemetry data for a premium backend feel
  const { machineId } = req.params;
  const machine = await db.getMachine(machineId);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  // Generate randomized GPS/telemetry logs
  const signalStrengths = ['excellent', 'good', 'poor'] as const;
  const engineStatuses = ['running', 'idle', 'locked'] as const;

  const latOffset = (Math.random() - 0.5) * 0.05;
  const lngOffset = (Math.random() - 0.5) * 0.05;

  return res.json({
    lat: 22.7591 + latOffset,
    lng: 75.8912 + lngOffset,
    speed: Math.floor(Math.random() * 45),
    battery: Math.floor(Math.random() * 30) + 70, // 70-100%
    satellites: Math.floor(Math.random() * 6) + 6, // 6-12
    signalStrength: signalStrengths[Math.floor(Math.random() * signalStrengths.length)],
    engineStatus: engineStatuses[Math.floor(Math.random() * engineStatuses.length)],
    geofenceActive: true,
    geofenceBreached: Math.random() > 0.9
  });
});
