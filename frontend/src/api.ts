import { Machine, Booking, Review, UserRole } from './types';

// Helper for response parsing
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  async login(phone: string, role: UserRole): Promise<{ message: string; otp: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role })
    });
    return handleResponse<{ message: string; otp: string }>(res);
  },

  async verifyOtp(phone: string, otp: string, role: UserRole): Promise<{
    success: boolean;
    defaultProfile: { name: string; location: string; storeName?: string };
  }> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role })
    });
    return handleResponse<{
      success: boolean;
      defaultProfile: { name: string; location: string; storeName?: string };
    }>(res);
  },

  async saveProfile(
    phone: string,
    role: UserRole,
    name: string,
    location: string,
    storeName?: string
  ): Promise<{
    success: boolean;
    user: {
      phone: string;
      role: UserRole;
      name: string;
      avatar: string;
      location: string;
      storeName?: string;
    };
  }> {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role, name, location, storeName })
    });
    return handleResponse<{
      success: boolean;
      user: {
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        location: string;
        storeName?: string;
      };
    }>(res);
  },

  // Machines API
  async getMachines(): Promise<Machine[]> {
    const res = await fetch('/api/machines');
    return handleResponse<Machine[]>(res);
  },

  async getMachineDetails(id: string): Promise<Machine> {
    const res = await fetch(`/api/machines/${id}`);
    return handleResponse<Machine>(res);
  },

  async createMachine(machine: Machine): Promise<Machine> {
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(machine)
    });
    return handleResponse<Machine>(res);
  },

  async updateMachines(machines: Machine[]): Promise<Machine[]> {
    const res = await fetch('/api/machines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(machines)
    });
    return handleResponse<Machine[]>(res);
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine> {
    const res = await fetch(`/api/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Machine>(res);
  },

  async deleteMachine(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/machines/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Bookings API
  async getBookings(): Promise<Booking[]> {
    const res = await fetch('/api/bookings');
    return handleResponse<Booking[]>(res);
  },

  async createBooking(booking: Booking): Promise<Booking> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    return handleResponse<Booking>(res);
  },

  async updateBookingStatus(id: string, status: 'Approved' | 'Rejected'): Promise<Booking> {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse<Booking>(res);
  },

  // Reviews API
  async getReviews(machineId: string): Promise<Review[]> {
    const res = await fetch(`/api/machines/${machineId}/reviews`);
    return handleResponse<Review[]>(res);
  },

  async createReview(machineId: string, review: Review): Promise<Review> {
    const res = await fetch(`/api/machines/${machineId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    return handleResponse<Review>(res);
  },

  // GPS Telemetry API
  async getGps(machineId: string): Promise<{
    lat: number;
    lng: number;
    speed: number;
    battery: number;
    satellites: number;
    signalStrength: 'excellent' | 'good' | 'poor' | 'searching';
    engineStatus: 'running' | 'idle' | 'locked';
    geofenceActive: boolean;
    geofenceBreached: boolean;
  }> {
    const res = await fetch(`/api/gps/${machineId}`);
    return handleResponse<{
      lat: number;
      lng: number;
      speed: number;
      battery: number;
      satellites: number;
      signalStrength: 'excellent' | 'good' | 'poor' | 'searching';
      engineStatus: 'running' | 'idle' | 'locked';
      geofenceActive: boolean;
      geofenceBreached: boolean;
    }>(res);
  }
};
