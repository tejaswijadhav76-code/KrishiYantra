/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewType, UserRole, Machine, Booking } from './types';
import { INITIAL_MACHINES, INITIAL_BOOKINGS } from './data';
import { api } from './api';
import Header from './components/Header';
import FarmerDashboard from './components/FarmerDashboard';
import DiscoverView from './components/DiscoverView';
import DetailView from './components/DetailView';
import BookingFlow from './components/BookingFlow';
import OwnerDashboard from './components/OwnerDashboard';
import LoginView from './components/LoginView';
import GpsTracker from './components/GpsTracker';

export default function App() {
  const [user, setUser] = useState<{
    phone: string;
    role: UserRole;
    name: string;
    avatar: string;
    location: string;
    storeName?: string;
  } | null>(() => {
    const saved = localStorage.getItem('krishi_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('krishi_role');
    return (saved as UserRole) || 'farmer';
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const saved = localStorage.getItem('krishi_role');
    return saved === 'owner' ? 'owner-dashboard' : 'farmer-dashboard';
  });

  const [bookingMode, setBookingMode] = useState<'rent' | 'buy'>('rent');

  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);

  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  useEffect(() => {
    api.getMachines().then(setMachines).catch(console.error);
    api.getBookings().then(setBookings).catch(console.error);
  }, []);

  const [selectedMachine, setSelectedMachine] = useState<Machine>(() => {
    return INITIAL_MACHINES.find((m) => m.id === 'john-deere-rotavator') || INITIAL_MACHINES[0];
  });

  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [seenStatuses, setSeenStatuses] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('krishi_seen_statuses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing seen statuses', e);
      }
    }
    // Seed existing bookings as seen so we don't flash alerts on first load
    return {
      'booking-1': 'Pending',
      'booking-2': 'Pending'
    };
  });

  useEffect(() => {
    localStorage.setItem('krishi_seen_statuses', JSON.stringify(seenStatuses));
  }, [seenStatuses]);

  const hasUnreadStatusChange = bookings.some((b) => {
    const isFarmerBooking = b.farmerName === 'Ramrao Patil' || (user && b.farmerName === user.name);
    if (!isFarmerBooking) return false;
    
    const isChangedStatus = b.status === 'Approved' || b.status === 'Rejected';
    if (!isChangedStatus) return false;

    return seenStatuses[b.id] !== b.status;
  });

  const handleCloseBookingsModal = () => {
    setShowBookingsModal(false);
    const updatedSeen = { ...seenStatuses };
    bookings.forEach((b) => {
      updatedSeen[b.id] = b.status;
    });
    setSeenStatuses(updatedSeen);
  };

  // New Owner Navigation Modals State (to fix unclickable/iframe blocked alert buttons)
  const [showAddStockModalApp, setShowAddStockModalApp] = useState(false);
  const [showRentalsModalApp, setShowRentalsModalApp] = useState(false);
  const [showMyStoreModalApp, setShowMyStoreModalApp] = useState(false);

  // Form states for Add Machinery stock directly from sticky navigation
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineCategory, setNewMachineCategory] = useState<'Tillage' | 'Sowing' | 'Harvesting' | 'Spraying'>('Tillage');
  const [newMachinePrice, setNewMachinePrice] = useState(1000);
  const [newMachineUnits, setNewMachineUnits] = useState(2);
  const [listingMode, setListingMode] = useState<'both' | 'rent' | 'sell'>('both');
  const [newMachineBuyPrice, setNewMachineBuyPrice] = useState(85000);

  const handleAddStockApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim()) return;

    const finalPrice = listingMode === 'sell' ? 0 : newMachinePrice;
    const finalBuyPrice = listingMode === 'rent' ? undefined : newMachineBuyPrice;

    const newMachine: Machine = {
      id: `m-${Date.now()}`,
      name: newMachineName,
      owner: user?.storeName || 'Ramesh Farm Rentals (You)',
      ownerPhone: user?.phone || '+91 99999 88888',
      ownerAvatar: user?.avatar || 'https://lh3.googleusercontent.com/aida/AP1WRLuun4_Q_lHeO0PO7jA5h9P5bLVC9t6iNCUl9srbIV_l0ODTPTv9r0kl21dVNDd-FSR3DLO5d5D1CtC-XkouEbeMKDvzpaVjB6GMEJiY9V1xUlO7pTWgg6IT48RB_OoFYx0BKykWuW5HULggz5hopp7XBulrAx9qylKX9d3HVN4h24HrnODM4bMPBozzNBQORY18Pgys34hMo_trFJBnVu4UYmlpo3EX9NxrcRPZoMled71kMFvjYmen-6A',
      ownerVerified: true,
      ownerSince: '2021',
      rating: 5.0,
      reviewsCount: 1,
      price: finalPrice,
      buyPrice: finalBuyPrice,
      location: user?.location || 'Indore, Madhya Pradesh',
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

    api.createMachine(newMachine).then((saved) => {
      setMachines((prev) => [saved, ...prev]);
    }).catch(console.error);
    setNewMachineName('');
    setShowAddStockModalApp(false);
  };

  // Sync state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('krishi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('krishi_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('krishi_role', role);
  }, [role]);

  // Handle Role Switching
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updatedUser = {
        ...user,
        role: newRole,
        name: newRole === 'farmer' ? 'Ramrao Patil' : 'Ramesh Deshmukh',
        avatar: newRole === 'farmer' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxeNo9aGLuYdjl3TybTeDw2_mgmxg5mxrIexSqR9ZLHFcyZL9L_Hb5CR7CtZFs35lV0zqzGKcWktX1Mo7Ff0GphZWLvbU9Ok8s-Lt9TIrpovFpqfI3bOF6AkpervaDYyz0IyP4df-7sMemBDNKJUbeVAX0e9wPD1Rzi8-eceWpQjE35bPznT3JlqJsG9iWcpBJ5rbOiXmaeTSG0GLziAeryffo9tT7VkvjJOlUZTam2qIBH9MfDolzffmunFxgBhxOkGsSUoRfG2Cy'
          : 'https://lh3.googleusercontent.com/aida/AP1WRLuun4_Q_lHeO0PO7jA5h9P5bLVC9t6iNCUl9srbIV_l0ODTPTv9r0kl21dVNDd-FSR3DLO5d5D1CtC-XkouEbeMKDvzpaVjB6GMEJiY9V1xUlO7pTWgg6IT48RB_OoFYx0BKykWuW5HULggz5hopp7XBulrAx9qylKX9d3HVN4h24HrnODM4bMPBozzNBQORY18Pgys34hMo_trFJBnVu4UYmlpo3EX9NxrcRPZoMled71kMFvjYmen-6A'
      };
      setUser(updatedUser);
    }
    if (newRole === 'owner') {
      setCurrentView('owner-dashboard');
    } else {
      setCurrentView('farmer-dashboard');
    }
  };

  // Add Booking
  const handleAddBooking = (newBooking: Booking) => {
    api.createBooking(newBooking).then((saved) => {
      setBookings((prev) => [saved, ...prev]);
      api.getMachines().then(setMachines).catch(console.error);
    }).catch(console.error);
  };

  // Approve Booking (Owner side)
  const handleApproveBooking = (bookingId: string) => {
    api.updateBookingStatus(bookingId, 'Approved').then((updated) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b))
      );
      alert('Booking approved successfully!');
    }).catch(console.error);
  };

  // Reject Booking (Owner side)
  const handleRejectBooking = (bookingId: string) => {
    api.updateBookingStatus(bookingId, 'Rejected').then((updated) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b))
      );
      api.getMachines().then(setMachines).catch(console.error);
      alert('Booking rejected.');
    }).catch(console.error);
  };

  const handleUpdateMachines = (updatedMachines: Machine[]) => {
    api.updateMachines(updatedMachines).then(setMachines).catch(console.error);
  };

  // Handle Back Actions
  const handleBack = () => {
    if (currentView === 'booking') {
      setCurrentView('detail');
    } else if (currentView === 'detail') {
      setCurrentView('search');
    } else {
      setCurrentView(role === 'owner' ? 'owner-dashboard' : 'farmer-dashboard');
    }
  };

  // Filter similar machines
  const similarMachines = machines.filter((m) => m.id !== selectedMachine.id);

  if (!user) {
    return (
      <LoginView
        onLoginSuccess={(u) => {
          setUser(u);
          setRole(u.role);
          setCurrentView(u.role === 'owner' ? 'owner-dashboard' : 'farmer-dashboard');
        }}
      />
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Premium Top Navigation Session Status */}
      <div className="bg-primary text-white text-xs font-semibold py-2 px-4 flex justify-between items-center gap-4 sticky top-0 z-[60] shadow-md">
        <div className="flex items-center gap-2">
          <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-white/30" />
          <span>Signed in as <span className="font-extrabold">{user.name}</span> ({user.role === 'owner' ? 'Shop Owner' : 'Farmer'})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextRole = role === 'farmer' ? 'owner' : 'farmer';
              handleRoleChange(nextRole);
            }}
            className="bg-white/15 text-white hover:bg-white/25 px-2.5 py-1 rounded-md font-extrabold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
            Switch Perspective
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('krishi_user');
              setUser(null);
            }}
            className="bg-white/10 text-white hover:bg-white/20 px-2.5 py-1 rounded-md font-extrabold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <span className="material-symbols-outlined text-[13px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Core Header */}
      <Header
        currentView={currentView}
        role={role}
        onNavigate={setCurrentView}
        onBack={handleBack}
        notificationCount={bookings.filter((b) => b.status === 'Pending').length}
      />

      {/* Primary Responsive Container Layout */}
      <main className="flex-grow pt-24 pb-28 max-w-5xl mx-auto w-full px-4">
        {currentView === 'farmer-dashboard' && (
          <FarmerDashboard
            machines={machines}
            bookings={bookings}
            onNavigate={setCurrentView}
            onSelectMachine={(m) => {
              setSelectedMachine(m);
              setCurrentView('detail');
            }}
          />
        )}

        {currentView === 'search' && (
          <DiscoverView
            machines={machines}
            onNavigate={setCurrentView}
            onSelectMachine={(m) => {
              setSelectedMachine(m);
              setCurrentView('detail');
            }}
          />
        )}

        {currentView === 'detail' && (
          <DetailView
            machine={selectedMachine}
            similarMachines={similarMachines}
            onNavigate={setCurrentView}
            onSelectMachine={(m) => {
              setSelectedMachine(m);
              setCurrentView('detail');
            }}
            onAddBooking={handleAddBooking}
            onInitiateBooking={(selectedMode) => {
              setBookingMode(selectedMode);
              setCurrentView('booking');
            }}
          />
        )}

        {currentView === 'booking' && (
          <BookingFlow
            machine={selectedMachine}
            onAddBooking={handleAddBooking}
            onNavigate={setCurrentView}
            mode={bookingMode}
            userName={user.name}
            userAvatar={user.avatar}
          />
        )}

        {currentView === 'owner-dashboard' && (
          <OwnerDashboard
            bookings={bookings}
            machines={machines}
            onApproveBooking={handleApproveBooking}
            onRejectBooking={handleRejectBooking}
            onUpdateMachines={handleUpdateMachines}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'gps-tracker' && (
          <GpsTracker
            userRole={role}
            activeMachine={selectedMachine}
            allMachines={machines}
            allBookings={bookings}
            onBack={() => setCurrentView(role === 'owner' ? 'owner-dashboard' : 'farmer-dashboard')}
          />
        )}
      </main>

      {/* Bottom Sticky Tab Bar for Mobile & Quick Desktop Toggles */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant/20 py-2.5 z-40 shadow-lg flex justify-around items-center">
        {role === 'farmer' ? (
          <>
            {/* Home */}
            <button
              onClick={() => setCurrentView('farmer-dashboard')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                currentView === 'farmer-dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentView === 'farmer-dashboard' ? "'FILL' 1" : "'FILL' 0" }}>
                home
              </span>
              <span className="text-[10px] font-bold">Home</span>
            </button>

            {/* Search */}
            <button
              onClick={() => setCurrentView('search')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                currentView === 'search' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentView === 'search' ? "'FILL' 1" : "'FILL' 0" }}>
                search
              </span>
              <span className="text-[10px] font-bold">Search</span>
            </button>

            {/* GPS Live tracking */}
            <button
              onClick={() => setCurrentView('gps-tracker')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
                currentView === 'gps-tracker' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentView === 'gps-tracker' ? "'FILL' 1" : "'FILL' 0" }}>
                satellite_alt
              </span>
              <span className="text-[10px] font-bold">GPS Live</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </button>

            {/* Bookings */}
            <button
              onClick={() => setShowBookingsModal(true)}
              className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-on-surface cursor-pointer relative"
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">assignment</span>
                {hasUnreadStatusChange && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 items-center justify-center rounded-full bg-error ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-bold">Bookings</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">person</span>
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </>
        ) : (
          <>
            {/* Owner Dashboard */}
            <button
              onClick={() => setCurrentView('owner-dashboard')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                currentView === 'owner-dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentView === 'owner-dashboard' ? "'FILL' 1" : "'FILL' 0" }}>
                dashboard
              </span>
              <span className="text-[10px] font-bold">Dashboard</span>
            </button>

            {/* GPS Live Tracking */}
            <button
              onClick={() => setCurrentView('gps-tracker')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
                currentView === 'gps-tracker' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentView === 'gps-tracker' ? "'FILL' 1" : "'FILL' 0" }}>
                satellite_alt
              </span>
              <span className="text-[10px] font-bold">GPS Fleet</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </button>

            {/* Quick add */}
            <button
              onClick={() => setShowAddStockModalApp(true)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                showAddStockModalApp ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: showAddStockModalApp ? "'FILL' 1" : "'FILL' 0" }}>
                add_circle
              </span>
              <span className="text-[10px] font-bold">Add Stock</span>
            </button>

            {/* Quick approved view */}
            <button
              onClick={() => setShowRentalsModalApp(true)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                showRentalsModalApp ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: showRentalsModalApp ? "'FILL' 1" : "'FILL' 0" }}>
                calendar_today
              </span>
              <span className="text-[10px] font-bold">Rentals</span>
            </button>

            {/* Owner Account */}
            <button
              onClick={() => setShowMyStoreModalApp(true)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                showMyStoreModalApp ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: showMyStoreModalApp ? "'FILL' 1" : "'FILL' 0" }}>
                storefront
              </span>
              <span className="text-[10px] font-bold">My Store</span>
            </button>
          </>
        )}
      </nav>

      {/* Bookings Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col max-h-[80dvh]">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assignment</span>
                Your Reservation Requests
              </h3>
              <button
                onClick={handleCloseBookingsModal}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer"
              >
                close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-thin">
              {bookings.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-6">You have no booking requests yet.</p>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 flex gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                      <img src={b.machineImage} alt={b.machineName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-on-surface text-sm">{b.machineName}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Duration: {b.startDate} - {b.endDate} ({b.totalDays} days)
                      </p>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-xs font-extrabold text-primary">₹{b.totalPrice.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                          {seenStatuses[b.id] !== b.status && (b.status === 'Approved' || b.status === 'Rejected') && (
                            <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold bg-primary text-white rounded-md uppercase tracking-wider animate-pulse">
                              New
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'Approved'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : b.status === 'Rejected'
                              ? 'bg-error/10 text-error border border-error/20'
                              : 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-outline-variant/10 text-center">
              <span className="text-[10px] text-on-surface-variant font-medium block mb-2">
                Tip: Bookings placed can be approved inside "Shop Owner Mode"!
              </span>
              <button
                onClick={handleCloseBookingsModal}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all text-xs"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-xl space-y-4">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-primary/20 shadow-md">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxeNo9aGLuYdjl3TybTeDw2_mgmxg5mxrIexSqR9ZLHFcyZL9L_Hb5CR7CtZFs35lV0zqzGKcWktX1Mo7Ff0GphZWLvbU9Ok8s-Lt9TIrpovFpqfI3bOF6AkpervaDYyz0IyP4df-7sMemBDNKJUbeVAX0e9wPD1Rzi8-eceWpQjE35bPznT3JlqJsG9iWcpBJ5rbOiXmaeTSG0GLziAeryffo9tT7VkvjJOlUZTam2qIBH9MfDolzffmunFxgBhxOkGsSUoRfG2Cy"
                alt="Farmer Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Ramrao Patil</h3>
              <p className="text-xs text-on-surface-variant font-bold">Cotton & Wheat Farmer</p>
              <p className="text-xs text-outline mt-1">Indore, Madhya Pradesh</p>
            </div>

            <div className="bg-surface-container p-4 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-on-surface-variant">Membership Type</span>
                <span className="text-primary">Verified Premium</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-on-surface-variant">Primary Crop</span>
                <span className="text-on-surface">Cotton</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-on-surface-variant">Associated Tractor</span>
                <span className="text-on-surface">John Deere 5050 D</span>
              </div>
            </div>

            {/* Booking History Section */}
            <div className="text-left pt-2 border-t border-outline-variant/15">
              <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">history</span>
                Booking History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {/* Dynamically render current session bookings made by Ramrao Patil or current user */}
                {bookings
                  .filter((b) => b.farmerName === 'Ramrao Patil' || b.farmerName === user?.name)
                  .map((b) => {
                    let displayStatus: 'Completed' | 'Active' | 'Cancelled' | 'Pending' = 'Pending';
                    if (b.status === 'Approved') displayStatus = 'Active';
                    if (b.status === 'Rejected') displayStatus = 'Cancelled';
                    return (
                      <div key={b.id} className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img src={b.machineImage} alt={b.machineName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          <div>
                            <p className="font-bold text-[11px] text-on-surface line-clamp-1">{b.machineName}</p>
                            <p className="text-[9px] text-outline">{b.startDate} to {b.endDate}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                          displayStatus === 'Active'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : displayStatus === 'Cancelled'
                            ? 'bg-error/10 text-error border border-error/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {displayStatus}
                        </span>
                      </div>
                    );
                  })}

                {/* Pre-seeded historical mock bookings with requested statuses */}
                {[
                  {
                    id: 'hist-1',
                    machineName: 'John Deere Rotavator',
                    machineImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEppjHzNdOVeXVQIFEvs1znaOd1IgZoXKGE1oTMGajzUtOowGXd55xaIs_pKzlvl92jqSkIXfWbzjMCyk-OlPBrrgwTP1Tra9RqRSxxRit2ERi4cAFI8VKOjPIIbausrUsQVHRX_m3VklzxMvy95IPIoesllnlFKiio713XcDY036csy9nwqo4nCkpfttR9smsvoyU5nWFaxzjR44oMxGr4qdISuDas9HC5tesKXOzOE3hQ5PL2_hEZO0g7UAsL7GL7m_gTkSSllbA',
                    startDate: '2026-06-10',
                    endDate: '2026-06-14',
                    status: 'Completed' as const
                  },
                  {
                    id: 'hist-2',
                    machineName: 'Mahindra Novo 655 DI',
                    machineImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBwTAeAfh0vHw5EjMZXFSlG7TQncZ5ohT93Ih4xHLSjZ0hi7BNCGIGPbK5Yvb8bSe7VR0tRC0OiKxb_JXQmQ7intq7xA00fNPNdxYAGvQoIADyU3qZ5_3dNOhY_eoalhI0hMQFYtYr0n7fjb3MXK69xTUK0jqi--NB2Tcs50f3NMQbEBTkq4E8If7VMOm3Yt9YgIF4pFni5lW0rlUAkeKRtlutcK_fP_15rcroBNu90MKM95Id11RZNT5MquuqqoXZXxStC3KRbhoT',
                    startDate: '2026-07-01',
                    endDate: '2026-07-03',
                    status: 'Active' as const
                  },
                  {
                    id: 'hist-3',
                    machineName: 'Pro Power Tiller 7HP',
                    machineImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrS84LqeS0h9ab2dvPy_2_OO-vNOhOm_IVai0EuSOKm-KEpsr6cBUs2OdbDVf80S62UrB7j-x2n9_4kTS3xH2chRjczjQchkmVKiRdbm5KyQZmr2__4tzjrJ2x9KXVmt8tAU_rG6AbY_TIQ7CRNz_BnwmiegvWuqR4mrAEAw7u80d53Ibxnc5k2ucSmib0QNQe8v3ScFTwhcTApqIOjANf70Nt03do3VKMMwl_r6bBd-1bjFyXiOYtEfaEmG8CuJ8EGaJzPa_cG1y9',
                    startDate: '2026-05-12',
                    endDate: '2026-05-13',
                    status: 'Cancelled' as const
                  }
                ].map((hist) => (
                  <div key={hist.id} className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={hist.machineImage} alt={hist.machineName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <div>
                        <p className="font-bold text-[11px] text-on-surface line-clamp-1">{hist.machineName}</p>
                        <p className="text-[9px] text-outline">{hist.startDate} to {hist.endDate}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                      hist.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : hist.status === 'Active'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-error/10 text-error border border-error/20'
                    }`}>
                      {hist.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleRoleChange('owner');
                }}
                className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/95 transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                Switch to Owner Profile (Ramesh)
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal from Footer */}
      {showAddStockModalApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <form
            onSubmit={handleAddStockApp}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Add Machinery Stock
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStockModalApp(false)}
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
                onClick={() => setShowAddStockModalApp(false)}
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

      {/* Rentals Modal */}
      {showRentalsModalApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl flex flex-col max-h-[85dvh]">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Ramesh's Store Rentals
              </h3>
              <button
                onClick={() => setShowRentalsModalApp(false)}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold text-primary">
                  {bookings.filter(b => b.status === 'Approved').length}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Approved</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold text-amber-600">
                  {bookings.filter(b => b.status === 'Pending').length}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold text-slate-600">
                  {bookings.length}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Orders</div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3.5 scrollbar-thin">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">calendar_today</span>
                  <p className="text-sm font-bold">No rentals listed yet.</p>
                  <p className="text-xs">Switch to Farmer view to book machines, then approve them here.</p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                        <img src={b.machineImage} alt={b.machineName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">{b.machineName}</h4>
                        <p className="text-xs text-on-surface-variant font-medium">Customer: {b.farmerName}</p>
                        <p className="text-[10px] text-outline mt-0.5">
                          {b.startDate} to {b.endDate} ({b.totalDays} days)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-1 border-t md:border-t-0 pt-2 md:pt-0 border-outline-variant/10">
                      <span className="text-xs font-extrabold text-primary">₹{b.totalPrice.toLocaleString()}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        b.status === 'Approved'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : b.status === 'Rejected'
                          ? 'bg-error/10 text-error border border-error/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-outline-variant/10">
              <button
                onClick={() => setShowRentalsModalApp(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all text-xs cursor-pointer"
              >
                Close Rentals List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Store Modal */}
      {showMyStoreModalApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl space-y-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-primary/20 shadow-md flex items-center justify-center bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-on-surface">
                {user?.storeName || 'Ramesh Farm Rentals'}
              </h3>
              <p className="text-xs text-primary font-bold flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                Verified KrishiYantra Partner
              </p>
              <p className="text-[11px] text-outline">Since 2021 • Indore, MP</p>
            </div>

            {/* Store Information Form / Details */}
            <div className="bg-surface-container p-4.5 rounded-2xl text-left space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">Store Name</span>
                <input 
                  type="text" 
                  value={user?.storeName || 'Ramesh Farm Rentals'} 
                  onChange={(e) => {
                    setUser(prev => prev ? { ...prev, storeName: e.target.value } : null);
                  }}
                  className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">Regional Hub</span>
                <input 
                  type="text" 
                  value={user?.location || 'Indore, Madhya Pradesh'} 
                  onChange={(e) => {
                    setUser(prev => prev ? { ...prev, location: e.target.value } : null);
                  }}
                  className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/40 p-2.5 rounded-xl border border-outline-variant/10">
                  <span className="text-[9px] font-extrabold text-outline uppercase block">Rating</span>
                  <span className="text-sm font-extrabold text-on-surface flex items-center gap-0.5">
                    4.9 <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </span>
                </div>
                <div className="bg-white/40 p-2.5 rounded-xl border border-outline-variant/10">
                  <span className="text-[9px] font-extrabold text-outline uppercase block">Machinery</span>
                  <span className="text-sm font-extrabold text-on-surface">
                    {machines.filter(m => m.owner.includes('Ramesh') || m.owner.includes('You')).length} Units
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowMyStoreModalApp(false);
                }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all text-xs cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
