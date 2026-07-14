/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Feature {
  label: string;
  value: string;
  icon: string;
}

export interface Machine {
  id: string;
  name: string;
  owner: string;
  ownerPhone: string;
  ownerAvatar: string;
  ownerVerified: boolean;
  ownerSince: string;
  rating: number;
  reviewsCount: number;
  price: number; // per day
  buyPrice?: number; // purchase price if they want to buy
  location: string;
  category: 'Tillage' | 'Sowing' | 'Harvesting' | 'Spraying';
  image: string;
  description: string;
  specs: { label: string; value: string }[];
  features: Feature[];
  status: 'Available' | 'Booked';
  availableUnits: number;
  totalUnits: number;
}

export interface Booking {
  id: string;
  machineId: string;
  machineName: string;
  machineImage: string;
  farmerName: string;
  farmerAvatar: string;
  startDate: string; // "YYYY-MM-DD" or similar readable
  endDate: string;
  totalDays: number;
  totalPrice: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdDate: string;
  isPreBook?: boolean;
  quantity?: number;
  isPurchase?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export type ViewType = 'farmer-dashboard' | 'search' | 'detail' | 'booking' | 'owner-dashboard' | 'gps-tracker';
export type UserRole = 'farmer' | 'owner';
