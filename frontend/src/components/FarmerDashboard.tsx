/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Machine, Booking } from '../types';

interface FarmerDashboardProps {
  machines: Machine[];
  bookings: Booking[];
  onNavigate: (view: any) => void;
  onSelectMachine: (machine: Machine) => void;
}

export default function FarmerDashboard({
  machines,
  bookings,
  onNavigate,
  onSelectMachine
}: FarmerDashboardProps) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);

  // Derive counts
  const activeRentalsCount = bookings.filter((b) => b.status === 'Approved').length;
  const upcomingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;

  // Filter recommended tillage/sowing machines for cotton crop
  const recommendedMachines = machines.filter(
    (m) => m.id === 'john-deere-rotavator' || m.id === 'precision-seed-drill' || m.id === 'pro-power-tiller'
  );

  return (
    <div className="w-full">
      {/* Personalized Greeting */}
      <section className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">Namaste, Ramrao!</h2>
        <p className="text-on-surface-variant mt-1 text-base">Here is what's happening in your farm today.</p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <span className="material-symbols-outlined text-primary text-3xl mb-3">
            agriculture
          </span>
          <div>
            <p className="font-semibold text-sm text-on-surface-variant">Active Rentals</p>
            <p className="text-3xl font-extrabold text-primary mt-1">{activeRentalsCount || 2}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <span className="material-symbols-outlined text-secondary text-3xl mb-3">
            event_available
          </span>
          <div>
            <p className="font-semibold text-sm text-on-surface-variant">Upcoming Bookings</p>
            <p className="text-3xl font-extrabold text-secondary mt-1">{upcomingBookingsCount || 1}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          <div
            onClick={() => onNavigate('search')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl md:text-2xl">search</span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-on-surface text-center">Search</span>
          </div>

          <div
            onClick={() => onNavigate('gps-tracker')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm relative group-hover:scale-105 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl md:text-2xl animate-pulse">satellite_alt</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-ping" />
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-on-surface text-center">GPS Track</span>
          </div>

          <div
            onClick={() => onNavigate('search')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/20 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl md:text-2xl">calendar_month</span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-on-surface text-center">Pre-Book</span>
          </div>

          <div
            onClick={() => setShowRepairModal(true)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/20 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl md:text-2xl">build</span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-on-surface text-center">Repair</span>
          </div>

          <div
            onClick={() => setShowSupportModal(true)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/20 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl md:text-2xl">help</span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-on-surface text-center">Help</span>
          </div>
        </div>
      </section>

      {/* Recommended for Your Crop */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-on-surface">For Your Cotton Crop</h3>
          <button
            onClick={() => onNavigate('search')}
            className="text-primary font-bold hover:underline text-sm cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent">
          {recommendedMachines.map((machine) => (
            <div
              key={machine.id}
              className="min-w-[280px] bg-white rounded-2xl border border-outline-variant/10 shadow-sm flex-shrink-0 group hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => {
                onSelectMachine(machine);
                onNavigate('detail');
              }}
            >
              <div className="h-40 bg-surface-container-highest overflow-hidden relative">
                <img
                  src={machine.image}
                  alt={machine.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute top-3 left-3 bg-primary/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20">
                  <span className="text-primary font-bold text-xs">
                    {machine.status === 'Available' ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                  {machine.name}
                </h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  {machine.features.find((f) => f.label === 'Tractor HP')?.value || '50 HP'} Tractor compatible
                </p>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/10">
                  <div className="flex flex-col text-left">
                    {machine.price > 0 && (
                      <span className="font-extrabold text-primary text-sm">Rent: ₹{machine.price.toLocaleString()}/day</span>
                    )}
                    {machine.buyPrice && machine.buyPrice > 0 && (
                      <span className="font-extrabold text-emerald-600 text-xs mt-0.5">Buy: ₹{machine.buyPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMachine(machine);
                      onNavigate('detail');
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary/95 active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ongoing Activity Bento (Responsive Activity Logs) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 bg-surface-container-low p-5 md:p-6 rounded-2xl border border-outline-variant/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <span className="material-symbols-outlined font-bold">history</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">Recent Activity & Orders</h3>
              <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Real-time tracking of your machinery bookings & purchases</p>
            </div>
          </div>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-outline text-3xl">info</span>
                <p className="text-xs text-on-surface-variant font-bold mt-1">No bookings or purchase orders yet.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="flex justify-between items-center border-b border-outline-variant/10 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                      {b.machineName}
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        b.isPurchase ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'
                      }`}>
                        {b.isPurchase ? 'BUY' : 'RENT'}
                      </span>
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                      {b.isPurchase ? 'Direct Purchase Sale' : `Duration: ${b.startDate} to ${b.endDate}`}
                    </span>
                    {b.status === 'Approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('gps-tracker');
                        }}
                        className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 hover:bg-emerald-100 transition-colors mt-1.5 self-start bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px] animate-pulse">satellite_alt</span>
                        <span>Track Live Delivery (GPS)</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-extrabold text-sm block">₹{b.totalPrice.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold inline-block px-2 py-0.5 rounded-full mt-0.5 ${
                      b.status === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : b.status === 'Rejected' 
                        ? 'bg-error/10 text-error border border-error/20' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-secondary-container p-6 rounded-2xl flex flex-col justify-center items-center text-on-secondary-container relative overflow-hidden shadow-sm border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl mb-2 text-on-secondary-container">
            support_agent
          </span>
          <p className="font-bold text-lg text-center">Need Assistance?</p>
          <p className="text-xs text-center mb-4 opacity-90 leading-relaxed max-w-[200px]">Talk immediately to our farm specialists in Indore area</p>
          <button
            onClick={() => setShowSupportModal(true)}
            className="bg-on-secondary-container text-secondary-container px-6 py-2.5 rounded-full font-bold shadow-sm hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
          >
            Call Experts Now
          </button>
        </div>
      </section>

      {/* Support Dialog */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
            <span className="material-symbols-outlined text-5xl text-primary mb-3">support_agent</span>
            <h3 className="text-xl font-bold text-on-surface">KrishiYantra Support</h3>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              Connect immediately with our local agronomy and farm equipment experts. We help you choose the best machine for your soil!
            </p>
            <div className="space-y-2 mt-4">
              <a
                href="tel:+911800000000"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">call</span>
                Call Toll-Free Expert
              </a>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repair Dialog */}
      {showRepairModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
            <span className="material-symbols-outlined text-5xl text-secondary mb-3">build</span>
            <h3 className="text-xl font-bold text-on-surface">Doorstep Machinery Repair</h3>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              We offer highly affordable certified repair and servicing for tractors, tillers, and sowing units right at your farm!
            </p>
            <div className="bg-surface-container p-3 rounded-xl text-left text-xs space-y-1 mt-4">
              <div className="flex justify-between font-bold">
                <span>Diagnostic Visit Fee</span>
                <span className="text-primary">₹250</span>
              </div>
              <p className="text-on-surface-variant">Includes complete testing and detailed estimate before work begins.</p>
            </div>
            <div className="space-y-2 mt-4">
              <button
                onClick={() => {
                  alert('Thank you! Repair technician has been requested for Indore area.');
                  setShowRepairModal(false);
                }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all"
              >
                Request Technician Visit
              </button>
              <button
                onClick={() => setShowRepairModal(false)}
                className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
