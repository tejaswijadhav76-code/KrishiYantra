import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Machine, Booking, Review } from '../frontend/src/types';
import { INITIAL_MACHINES, INITIAL_BOOKINGS, INITIAL_REVIEWS } from '../frontend/src/data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  machines: Machine[];
  bookings: Booking[];
  reviews: Record<string, Review[]>;
}

let dbData: Schema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function initDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    dbData = JSON.parse(content);
  } catch (e) {
    // Seed
    dbData = {
      machines: INITIAL_MACHINES,
      bookings: INITIAL_BOOKINGS,
      reviews: {
        'john-deere-rotavator': INITIAL_REVIEWS
      }
    };
    await saveDb();
  }
}

async function saveDb() {
  if (!dbData) return;
  const tempPath = `${DB_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(dbData, null, 2), 'utf-8');
  await fs.rename(tempPath, DB_FILE);
}

async function queueWrite(operation: () => Promise<void> | void) {
  writeQueue = writeQueue.then(async () => {
    try {
      await operation();
    } catch (e) {
      console.error("DB write error:", e);
    }
  });
  return writeQueue;
}

export const db = {
  async init() {
    await initDb();
  },

  async getMachines(): Promise<Machine[]> {
    if (!dbData) await initDb();
    return dbData!.machines;
  },

  async getMachine(id: string): Promise<Machine | undefined> {
    if (!dbData) await initDb();
    return dbData!.machines.find(m => m.id === id);
  },

  async createMachine(machine: Machine): Promise<Machine> {
    if (!dbData) await initDb();
    dbData!.machines.unshift(machine);
    await queueWrite(saveDb);
    return machine;
  },

  async updateMachines(machines: Machine[]): Promise<Machine[]> {
    if (!dbData) await initDb();
    dbData!.machines = machines;
    await queueWrite(saveDb);
    return dbData!.machines;
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine | null> {
    if (!dbData) await initDb();
    const idx = dbData!.machines.findIndex(m => m.id === id);
    if (idx === -1) return null;
    dbData!.machines[idx] = { ...dbData!.machines[idx], ...updates };
    await queueWrite(saveDb);
    return dbData!.machines[idx];
  },

  async deleteMachine(id: string): Promise<boolean> {
    if (!dbData) await initDb();
    const len = dbData!.machines.length;
    dbData!.machines = dbData!.machines.filter(m => m.id !== id);
    if (dbData!.machines.length === len) return false;
    await queueWrite(saveDb);
    return true;
  },

  async getBookings(): Promise<Booking[]> {
    if (!dbData) await initDb();
    return dbData!.bookings;
  },

  async createBooking(booking: Booking): Promise<Booking> {
    if (!dbData) await initDb();
    dbData!.bookings.unshift(booking);

    // Also update machine units/availability
    const machine = dbData!.machines.find(m => m.id === booking.machineId);
    if (machine) {
      const quantity = booking.quantity || 1;
      if (booking.isPurchase) {
        machine.totalUnits = Math.max(0, machine.totalUnits - quantity);
        machine.availableUnits = Math.max(0, machine.availableUnits - quantity);
      } else {
        machine.availableUnits = Math.max(0, machine.availableUnits - quantity);
      }
      if (machine.availableUnits === 0) {
        machine.status = 'Booked';
      }
    }

    await queueWrite(saveDb);
    return booking;
  },

  async updateBookingStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<Booking | null> {
    if (!dbData) await initDb();
    const booking = dbData!.bookings.find(b => b.id === id);
    if (!booking) return null;

    const oldStatus = booking.status;
    booking.status = status;

    // If a pending booking gets rejected, restore available units
    if (oldStatus === 'Pending' && status === 'Rejected') {
      const machine = dbData!.machines.find(m => m.id === booking.machineId);
      if (machine) {
        const quantity = booking.quantity || 1;
        machine.availableUnits = Math.min(machine.totalUnits, machine.availableUnits + quantity);
        if (machine.availableUnits > 0) {
          machine.status = 'Available';
        }
      }
    }

    await queueWrite(saveDb);
    return booking;
  },

  async getReviews(machineId: string): Promise<Review[]> {
    if (!dbData) await initDb();
    return dbData!.reviews[machineId] || [];
  },

  async createReview(machineId: string, review: Review): Promise<Review> {
    if (!dbData) await initDb();
    if (!dbData!.reviews[machineId]) {
      dbData!.reviews[machineId] = [];
    }
    dbData!.reviews[machineId].unshift(review);

    // Update machine rating
    const machine = dbData!.machines.find(m => m.id === machineId);
    if (machine) {
      const machineReviews = dbData!.reviews[machineId];
      const sum = machineReviews.reduce((s, r) => s + r.rating, 0);
      machine.rating = Number((sum / machineReviews.length).toFixed(1));
      machine.reviewsCount = machineReviews.length;
    }

    await queueWrite(saveDb);
    return review;
  }
};
