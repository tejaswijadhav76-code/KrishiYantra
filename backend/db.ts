import mongoose, { Schema } from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Machine, Booking, Review, User } from '../frontend/src/types';
import { INITIAL_MACHINES, INITIAL_BOOKINGS, INITIAL_REVIEWS } from '../frontend/src/data';
import dotenv from 'dotenv';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from root directory .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force public DNS servers to resolve MongoDB SRV hostnames (fixes querySrv ECONNREFUSED)
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (e) {
  console.warn('Failed to set public DNS servers, MongoDB connection might fail:', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

// --- Local File Database Configuration ---
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface LocalSchema {
  machines: Machine[];
  bookings: Booking[];
  reviews: Record<string, Review[]>;
  users: User[];
}

let dbData: LocalSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function initLocalDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    dbData = JSON.parse(content);
    // Backward compatibility: ensure users array exists
    if (!dbData.users) {
      dbData.users = [];
    }
  } catch (e) {
    // Seed local database
    dbData = {
      machines: INITIAL_MACHINES,
      bookings: INITIAL_BOOKINGS,
      reviews: {
        'john-deere-rotavator': INITIAL_REVIEWS
      },
      users: []
    };
    await saveLocalDb();
  }
}

async function saveLocalDb() {
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
      console.error("Local DB write error:", e);
    }
  });
  return writeQueue;
}

// --- MongoDB Schemas & Configuration ---
const FeatureSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

const SpecSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const MachineSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  ownerAvatar: { type: String, required: true },
  ownerVerified: { type: Boolean, required: true },
  ownerSince: { type: String, required: true },
  rating: { type: Number, required: true, default: 0 },
  reviewsCount: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  buyPrice: { type: Number },
  location: { type: String, required: true },
  category: { type: String, required: true, enum: ['Tillage', 'Sowing', 'Harvesting', 'Spraying'] },
  image: { type: String, required: true },
  description: { type: String, required: true },
  specs: [SpecSchema],
  features: [FeatureSchema],
  status: { type: String, required: true, enum: ['Available', 'Booked'], default: 'Available' },
  availableUnits: { type: Number, required: true },
  totalUnits: { type: Number, required: true }
});

const BookingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  machineImage: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerAvatar: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalDays: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdDate: { type: String, required: true },
  isPreBook: { type: Boolean },
  quantity: { type: Number },
  isPurchase: { type: Boolean }
});

const ReviewSchema = new Schema({
  id: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true }
});

const UserSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  role: { type: String, required: true, enum: ['farmer', 'owner'] },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  location: { type: String, required: true },
  storeName: { type: String }
});

// Compile Models
const MachineModel = mongoose.models.Machine || mongoose.model('Machine', MachineSchema);
const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

let isMongo = false;

export const db = {
  async init() {
    if (MONGODB_URI) {
      console.log("Connecting to MongoDB...");
      try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB successfully.");
        isMongo = true;

        // Seeding database if empty
        const machineCount = await MachineModel.countDocuments();
        if (machineCount === 0) {
          console.log("MongoDB is empty. Seeding initial data from presets...");
          await MachineModel.insertMany(INITIAL_MACHINES);
          await BookingModel.insertMany(INITIAL_BOOKINGS);
          const seededReviews = INITIAL_REVIEWS.map(r => ({
            ...r,
            machineId: 'john-deere-rotavator'
          }));
          await ReviewModel.insertMany(seededReviews);
          console.log("MongoDB database seeded successfully.");
        }
      } catch (err) {
        console.error("Failed to connect to MongoDB. Falling back to local JSON database...", err);
        isMongo = false;
        await initLocalDb();
      }
    } else {
      console.log("MONGODB_URI is not set. Falling back to local JSON database...");
      isMongo = false;
      await initLocalDb();
    }
  },

  async getMachines(): Promise<Machine[]> {
    if (isMongo) {
      return MachineModel.find({}).lean() as unknown as Machine[];
    }
    if (!dbData) await initLocalDb();
    return dbData!.machines;
  },

  async getMachine(id: string): Promise<Machine | undefined> {
    if (isMongo) {
      const machine = await MachineModel.findOne({ id }).lean();
      return (machine || undefined) as unknown as Machine | undefined;
    }
    if (!dbData) await initLocalDb();
    return dbData!.machines.find(m => m.id === id);
  },

  async createMachine(machine: Machine): Promise<Machine> {
    if (isMongo) {
      const newMachine = new MachineModel(machine);
      await newMachine.save();
      return newMachine.toObject() as unknown as Machine;
    }
    if (!dbData) await initLocalDb();
    dbData!.machines.unshift(machine);
    await queueWrite(saveLocalDb);
    return machine;
  },

  async updateMachines(machines: Machine[]): Promise<Machine[]> {
    if (isMongo) {
      await MachineModel.deleteMany({});
      const inserted = await MachineModel.insertMany(machines);
      return inserted.map(doc => doc.toObject()) as unknown as Machine[];
    }
    if (!dbData) await initLocalDb();
    dbData!.machines = machines;
    await queueWrite(saveLocalDb);
    return dbData!.machines;
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine | null> {
    if (isMongo) {
      const updated = await MachineModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();
      return (updated || null) as unknown as Machine | null;
    }
    if (!dbData) await initLocalDb();
    const idx = dbData!.machines.findIndex(m => m.id === id);
    if (idx === -1) return null;
    dbData!.machines[idx] = { ...dbData!.machines[idx], ...updates };
    await queueWrite(saveLocalDb);
    return dbData!.machines[idx];
  },

  async deleteMachine(id: string): Promise<boolean> {
    if (isMongo) {
      const res = await MachineModel.deleteOne({ id });
      return res.deletedCount > 0;
    }
    if (!dbData) await initLocalDb();
    const len = dbData!.machines.length;
    dbData!.machines = dbData!.machines.filter(m => m.id !== id);
    if (dbData!.machines.length === len) return false;
    await queueWrite(saveLocalDb);
    return true;
  },

  async getBookings(): Promise<Booking[]> {
    if (isMongo) {
      return BookingModel.find({}).sort({ _id: -1 }).lean() as unknown as Booking[];
    }
    if (!dbData) await initLocalDb();
    return dbData!.bookings;
  },

  async createBooking(booking: Booking): Promise<Booking> {
    if (isMongo) {
      const newBooking = new BookingModel(booking);
      await newBooking.save();

      // Update machine availability
      const machine = await MachineModel.findOne({ id: booking.machineId });
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
        await machine.save();
      }

      return newBooking.toObject() as unknown as Booking;
    }

    if (!dbData) await initLocalDb();
    dbData!.bookings.unshift(booking);

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

    await queueWrite(saveLocalDb);
    return booking;
  },

  async updateBookingStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<Booking | null> {
    if (isMongo) {
      const booking = await BookingModel.findOne({ id });
      if (!booking) return null;

      const oldStatus = booking.status;
      booking.status = status;
      await booking.save();

      if (oldStatus === 'Pending' && status === 'Rejected') {
        const machine = await MachineModel.findOne({ id: booking.machineId });
        if (machine) {
          const quantity = booking.quantity || 1;
          machine.availableUnits = Math.min(machine.totalUnits, machine.availableUnits + quantity);
          if (machine.availableUnits > 0) {
            machine.status = 'Available';
          }
          await machine.save();
        }
      }

      return booking.toObject() as unknown as Booking;
    }

    if (!dbData) await initLocalDb();
    const booking = dbData!.bookings.find(b => b.id === id);
    if (!booking) return null;

    const oldStatus = booking.status;
    booking.status = status;

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

    await queueWrite(saveLocalDb);
    return booking;
  },

  async getReviews(machineId: string): Promise<Review[]> {
    if (isMongo) {
      return ReviewModel.find({ machineId }).sort({ _id: -1 }).lean() as unknown as Review[];
    }
    if (!dbData) await initLocalDb();
    return dbData!.reviews[machineId] || [];
  },

  async createReview(machineId: string, review: Review): Promise<Review> {
    if (isMongo) {
      const newReview = new ReviewModel({
        ...review,
        machineId
      });
      await newReview.save();

      const machineReviews = await ReviewModel.find({ machineId }).lean();
      const machine = await MachineModel.findOne({ id: machineId });
      if (machine && machineReviews.length > 0) {
        const sum = machineReviews.reduce((s, r) => s + r.rating, 0);
        machine.rating = Number((sum / machineReviews.length).toFixed(1));
        machine.reviewsCount = machineReviews.length;
        await machine.save();
      }

      return newReview.toObject() as unknown as Review;
    }

    if (!dbData) await initLocalDb();
    if (!dbData!.reviews[machineId]) {
      dbData!.reviews[machineId] = [];
    }
    dbData!.reviews[machineId].unshift(review);

    const machine = dbData!.machines.find(m => m.id === machineId);
    if (machine) {
      const machineReviews = dbData!.reviews[machineId];
      const sum = machineReviews.reduce((s, r) => s + r.rating, 0);
      machine.rating = Number((sum / machineReviews.length).toFixed(1));
      machine.reviewsCount = machineReviews.length;
    }

    await queueWrite(saveLocalDb);
    return review;
  },

  async getUser(phone: string): Promise<User | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return null;
    
    if (isMongo) {
      return UserModel.findOne({ phone: { $regex: cleanPhone + '$' } }).lean() as unknown as User | null;
    }
    if (!dbData) await initLocalDb();
    return dbData!.users.find(u => u.phone.replace(/\D/g, '').endsWith(cleanPhone)) || null;
  },

  async saveUser(user: User): Promise<User> {
    const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
    if (isMongo) {
      const updated = await UserModel.findOneAndUpdate(
        { phone: { $regex: cleanPhone + '$' } },
        { $set: user },
        { new: true, upsert: true, lean: true }
      );
      return updated as unknown as User;
    }

    if (!dbData) await initLocalDb();
    const idx = dbData!.users.findIndex(u => u.phone.replace(/\D/g, '').endsWith(cleanPhone));
    if (idx >= 0) {
      dbData!.users[idx] = user;
    } else {
      dbData!.users.push(user);
    }
    await queueWrite(saveLocalDb);
    return user;
  }
};
