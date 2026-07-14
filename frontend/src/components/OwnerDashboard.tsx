/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, Machine } from '../types';

interface OwnerDashboardProps {
  bookings: Booking[];
  machines: Machine[];
  onApproveBooking: (id: string) => void;
  onRejectBooking: (id: string) => void;
  onUpdateMachines: (machines: Machine[]) => void;
  onNavigate?: (view: any) => void;
}

export default function OwnerDashboard({
  bookings,
  machines,
  onApproveBooking,
  onRejectBooking,
  onUpdateMachines,
  onNavigate
}: OwnerDashboardProps) {
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineCategory, setNewMachineCategory] = useState<'Tillage' | 'Sowing' | 'Harvesting' | 'Spraying'>('Tillage');
  const [newMachinePrice, setNewMachinePrice] = useState(1000);
  const [newMachineUnits, setNewMachineUnits] = useState(2);
  const [storeOnline, setStoreOnline] = useState(true);
  const [listingMode, setListingMode] = useState<'both' | 'rent' | 'sell'>('both');
  const [newMachineBuyPrice, setNewMachineBuyPrice] = useState(85000);

  // Derive stats
  const pendingRequests = bookings.filter((b) => b.status === 'Pending');
  const approvedBookings = bookings.filter((b) => b.status === 'Approved');

  const baseRevenue = 45800;
  const totalRevenueCalculated = baseRevenue + approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const activeRentalsCount = 8 + approvedBookings.length;
  const totalMachinesCount = 12 + machines.length - 8; // Normalized

  // Handle addition of a new stock item
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim()) return;

    const finalPrice = listingMode === 'sell' ? 0 : newMachinePrice;
    const finalBuyPrice = listingMode === 'rent' ? undefined : newMachineBuyPrice;

    const newMachine: Machine = {
      id: `m-${Date.now()}`,
      name: newMachineName,
      owner: 'Ramesh Farm Rentals (You)',
      ownerPhone: '+91 99999 88888',
      ownerAvatar: 'https://lh3.googleusercontent.com/aida/AP1WRLuun4_Q_lHeO0PO7jA5h9P5bLVC9t6iNCUl9srbIV_l0ODTPTv9r0kl21dVNDd-FSR3DLO5d5D1CtC-XkouEbeMKDvzpaVjB6GMEJiY9V1xUlO7pTWgg6IT48RB_OoFYx0BKykWuW5HULggz5hopp7XBulrAx9qylKX9d3HVN4h24HrnODM4bMPBozzNBQORY18Pgys34hMo_trFJBnVu4UYmlpo3EX9NxrcRPZoMled71kMFvjYmen-6A',
      ownerVerified: true,
      ownerSince: '2021',
      rating: 5.0,
      reviewsCount: 1,
      price: finalPrice,
      buyPrice: finalBuyPrice,
      location: 'Indore, Madhya Pradesh',
      category: newMachineCategory,
      image: newMachineCategory === 'Tillage'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEppjHzNdOVeXVQIFEvs1znaOd1IgZoXKGE1oTMGajzUtOowGXd55xaIs_pKzlvl92jqSkIXfWbzjMCyk-OlPBrrgwTP1Tra9RqRSxxRit2ERi4cAFI8VKOjPIIbausrUsQVHRX_m3VklzxMvy95IPIoesllnlFKiio713XcDY036csy9nwqo4nCkpfttR9smsvoyU5nWFaxzjR44oMxGr4qdISuDas9HC5tesKXOzOE3hQ5PL2_hEZO0g7UAsL7GL7m_gTkSSllbA'
        : newMachineCategory === 'Sowing'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR1_v_DPOC-ouv2pPMoUe5XSnOCu_Z6HbYoZX8TuLr-ZhkV1rVC8tO3oEAXaDrPVt_AwNmKPnUc_WZDDHgekNo1KLn-_g5npTg9Jd1BXsawKW_mrB_ajhvGIIs3rCvLmOPKYdq23OkaL5ICZFgylqsKP0pSDH1JrtGGI6nWIrnlLm07XqsNNxv2j4AJUWUZ6jBytiGWHqb6I4IMLAatnfdsK67Z1YeevZUSCWMHKGTlbSh92jPNNhER-YG0-8meUswK37G1LCISzWc'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4DXIyXayy1p7VzwX_TFRt8kBKiQFsa230XHmOsLdnL08m2aRlXtXBuVCmJ1I1yFbPZ42-cmOHnPm5qS-WI4lgUZQxIvvi_7ggJkektOZslaV1kGBSnqQsG-nVNW8ZuU3hoOun8rXT9KVk0OAVCc-KKDEoBPmUdWiumgorlmWEiZZDRHU2y39xIsUCAZ7_zl1X1V8BUbvVvB_F6WTig99l9d0J6tWb1Anx2wFvmiYD5d04jfvWK21S20ZxiIFosBbmyfqrisHEQWG0',
      description: `Premium newly listed ${newMachineName} machinery managed by Ramesh Farm Rentals. Fully serviced, inspected and ready for ${listingMode === 'sell' ? 'immediate purchase' : 'rent or purchase'}.`,
      specs: [{ label: 'Stock Units', value: `${newMachineUnits} Units` }],
      features: [
        { label: 'Tractor HP', value: '45-60 HP', icon: 'agriculture' },
        { label: 'Listing', value: listingMode === 'both' ? 'Rent & Sale' : listingMode === 'rent' ? 'Rent Only' : 'Sale Only', icon: 'info' }
      ],
      status: 'Available',
      availableUnits: newMachineUnits,
      totalUnits: newMachineUnits
    };

    onUpdateMachines([newMachine, ...machines]);
    setNewMachineName('');
    setShowAddStockModal(false);
    alert('Machinery stock updated successfully with rent/sale details!');
  };

  return (
    <div className="w-full">
      {/* Welcome Header */}
      <section className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-on-background">Good morning, Ramesh!</h2>
        <p className="text-on-surface-variant mt-1 text-base">
          Managing <span className="font-extrabold text-primary">Ramesh Farm Rentals</span>
        </p>
      </section>

      {/* Performance Overview Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary p-2.5 bg-primary/10 rounded-xl">
              payments
            </span>
            <span className="flex items-center gap-0.5 text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> 12%
            </span>
          </div>
          <div className="mt-4">
            <p className="font-semibold text-xs text-on-surface-variant">Total Revenue</p>
            <p className="text-3xl font-extrabold text-on-surface mt-1">₹{totalRevenueCalculated.toLocaleString()}</p>
          </div>
        </div>

        {/* Active Rentals Card */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-secondary p-2.5 bg-secondary/10 rounded-xl">
              agriculture
            </span>
          </div>
          <div className="mt-4">
            <p className="font-semibold text-xs text-on-surface-variant">Active Rentals</p>
            <p className="text-3xl font-extrabold text-on-surface mt-1">
              {String(activeRentalsCount).padStart(2, '0')}{' '}
              <span className="text-sm font-normal text-on-surface-variant">/ {totalMachinesCount} machines</span>
            </p>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-secondary-container p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-on-secondary-container p-2.5 bg-white/40 rounded-xl">
              pending_actions
            </span>
          </div>
          <div className="mt-4">
            <p className="font-semibold text-xs text-on-secondary-container">New Requests</p>
            <p className="text-3xl font-extrabold text-on-secondary-container mt-1">
              {String(pendingRequests.length).padStart(2, '0')}{' '}
              <span className="text-sm font-bold opacity-90">Pending</span>
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Bookings & Inventory */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Recent Booking Requests */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-on-surface">Recent Booking Requests</h3>
              <span className="text-xs font-bold text-primary hover:underline cursor-pointer">
                View All
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-outline-variant/40 p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">task_alt</span>
                <p className="font-bold text-on-surface">All requests processed!</p>
                <p className="text-xs text-on-surface-variant mt-1">New reservation requests will show up here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-5 rounded-2xl border border-outline-variant/15 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow relative overflow-hidden"
                  >
                    {req.isPurchase && (
                      <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-extrabold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                        Direct Purchase Order
                      </span>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high shadow-inner flex-shrink-0">
                        <img src={req.farmerAvatar} alt={req.farmerName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-base">{req.farmerName}</h4>
                        <p className="text-xs text-on-surface-variant font-semibold flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-xs">agriculture</span> {req.machineName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full self-start md:self-center border border-outline-variant/10 text-on-surface">
                      <span className="material-symbols-outlined text-sm">{req.isPurchase ? 'shopping_bag' : 'calendar_month'}</span>
                      <span className="text-xs font-bold">
                        {req.isPurchase ? 'Immediate Delivery & Permanent Sale' : `${req.startDate} - ${req.endDate}`}
                      </span>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => onApproveBooking(req.id)}
                        className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all cursor-pointer"
                      >
                        {req.isPurchase ? 'Approve Sale' : 'Approve'}
                      </button>
                      <button
                        onClick={() => onRejectBooking(req.id)}
                        className="flex-1 md:flex-none border border-outline text-on-surface-variant px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Weekly Revenue Chart */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">Weekly Revenue</h3>
              <select className="bg-surface-container border-none text-xs rounded-xl focus:ring-primary font-bold py-2 px-3 text-on-surface select-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div className="h-64 w-full flex items-end gap-3 md:gap-5 px-2">
              <div className="flex-1 bg-surface-container-highest rounded-t-xl relative group h-[40%] transition-all hover:bg-primary/20">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹4k
                </div>
              </div>
              <div className="flex-1 bg-surface-container-highest rounded-t-xl relative group h-[60%] transition-all hover:bg-primary/20">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹6k
                </div>
              </div>
              <div className="flex-1 bg-primary rounded-t-xl relative group h-[85%] transition-all">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹8.5k
                </div>
              </div>
              <div className="flex-1 bg-surface-container-highest rounded-t-xl relative group h-[52%] transition-all hover:bg-primary/20">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹5.2k
                </div>
              </div>
              <div className="flex-1 bg-surface-container-highest rounded-t-xl relative group h-[38%] transition-all hover:bg-primary/20">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹3.8k
                </div>
              </div>
              <div className="flex-1 bg-surface-container-highest rounded-t-xl relative group h-[64%] transition-all hover:bg-primary/20">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹6.4k
                </div>
              </div>
              <div className="flex-1 bg-primary rounded-t-xl relative group h-full transition-all">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹9.2k
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4 text-xs font-bold text-on-surface-variant/60 px-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </section>
        </div>

        {/* Right Column: Inventory & Status */}
        <div className="flex flex-col gap-8">
          
          {/* Real-time Fleet GPS Tracker Card */}
          <section className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-md text-white space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 font-bold animate-pulse">satellite_alt</span>
              <h3 className="font-extrabold text-base tracking-tight text-white">Live Satellite Fleet GPS</h3>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              KY-Telemetry linked. You have <span className="font-bold text-emerald-400">4 active GPS trackers</span> broadcasting coordinates on Indore transit grid.
            </p>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Unit JD-Rotavator:</span>
                <span className="text-emerald-400">Online (12 km/h)</span>
              </div>
              <div className="flex justify-between">
                <span>Unit MH-Gyrovator:</span>
                <span className="text-amber-400 font-bold">Safe Geofence A</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('gps-tracker');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Open Fleet Tracking Map
            </button>
          </section>

          {/* Inventory Status */}
          <section className="bg-white p-5 rounded-2xl border border-outline-variant/15 flex flex-col gap-4 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface">Inventory Status</h3>
            
            <div className="space-y-4">
              {/* Category 1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">Tractors</span>
                  <span className="text-primary font-bold">2/5 Available</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">Tillers</span>
                  <span className="text-primary font-bold">1/3 Available</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>

              {/* Category 3 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">Seeders</span>
                  <span className="text-primary font-bold">4/4 Available</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddStockModal(true)}
              className="w-full border border-primary text-primary hover:bg-primary/5 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add</span> Update Stock
            </button>
          </section>

          {/* Quick Actions / Tips */}
          <section className="bg-secondary text-white p-5 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <h4 className="font-bold flex items-center gap-2 text-sm text-white">
              <span className="material-symbols-outlined text-xl">lightbulb</span>
              Dashboard Tip
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              Demand for rotavators is expected to rise by 20% next week due to the upcoming sowing season. Ensure all units are serviced.
            </p>
          </section>

          {/* Profile Quick View */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-on-surface text-base">Store Visibility</h4>
              <div className="flex items-center gap-1 text-secondary mt-0.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-xs font-bold text-on-surface">4.8</span>
                <span className="text-[10px] text-on-surface-variant font-medium">(124 reviews)</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-on-surface-variant font-bold">
                  Status:{' '}
                  <span className={`font-bold ${storeOnline ? 'text-primary' : 'text-error'}`}>
                    {storeOnline ? 'Online' : 'Offline'}
                  </span>
                </span>
                <button
                  onClick={() => setStoreOnline(!storeOnline)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                    storeOnline
                      ? 'border-error text-error hover:bg-error/5'
                      : 'border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  Go {storeOnline ? 'Offline' : 'Online'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock / Update Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <form
            onSubmit={handleAddStock}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <h3 className="text-lg font-bold text-on-surface">Add Machinery Stock</h3>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer text-xl"
              >
                close
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Machine Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonalika Tiller 8HP"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Category</label>
                <select
                  value={newMachineCategory}
                  onChange={(e) => setNewMachineCategory(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                >
                  <option value="Tillage">Tillage</option>
                  <option value="Sowing">Sowing</option>
                  <option value="Harvesting">Harvesting</option>
                  <option value="Spraying">Spraying</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant block">Listed For</label>
                <div className="grid grid-cols-3 gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant/10 shadow-inner">
                  {(['both', 'rent', 'sell'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setListingMode(mode)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        listingMode === mode
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {mode === 'both' ? 'Rent & Sell' : mode === 'rent' ? 'Rent Only' : 'Sell Only'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {listingMode !== 'sell' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant block">Rate (₹/day)</label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      value={newMachinePrice}
                      onChange={(e) => setNewMachinePrice(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                    />
                  </div>
                )}
                {listingMode !== 'rent' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant block">Selling Price (₹)</label>
                    <input
                      type="number"
                      min="5000"
                      max="5000000"
                      value={newMachineBuyPrice}
                      onChange={(e) => setNewMachineBuyPrice(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Units Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newMachineUnits}
                  onChange={(e) => setNewMachineUnits(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="flex-1 border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all text-xs cursor-pointer"
              >
                Add Machinery
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
