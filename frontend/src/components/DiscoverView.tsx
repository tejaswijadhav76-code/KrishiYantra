/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Machine } from '../types';

interface DiscoverViewProps {
  machines: Machine[];
  onNavigate: (view: any) => void;
  onSelectMachine: (machine: Machine) => void;
}

// Helper to parse HP from machine specs or features
const getMachineHp = (machine: Machine): number => {
  const hpFeature = machine.features.find(f => 
    f.label.toLowerCase().includes('hp') || 
    f.value.toLowerCase().includes('hp')
  );
  if (hpFeature) {
    const numbers = hpFeature.value.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return Math.max(...numbers.map(Number));
    }
  }
  const hpSpec = machine.specs.find(s => 
    s.label.toLowerCase().includes('power') || 
    s.value.toLowerCase().includes('hp')
  );
  if (hpSpec) {
    const numbers = hpSpec.value.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return Math.max(...numbers.map(Number));
    }
  }
  return 45; // default fallback if unknown
};

// Helper to match crop compatibility
const matchesCrop = (machine: Machine, crop: string): boolean => {
  if (crop === 'All') return true;
  const normalizedCrop = crop.toLowerCase();
  
  if (machine.description.toLowerCase().includes(normalizedCrop)) return true;
  if (machine.name.toLowerCase().includes(normalizedCrop)) return true;
  
  if (normalizedCrop === 'rice' || normalizedCrop === 'paddy') {
    if (machine.description.toLowerCase().includes('rice') || machine.description.toLowerCase().includes('paddy')) return true;
    if (machine.category === 'Tillage') return true;
  }
  
  if (normalizedCrop === 'wheat') {
    return true; // almost all tillage, sowing and harvest works for wheat
  }
  if (normalizedCrop === 'soybean' || normalizedCrop === 'maize' || normalizedCrop === 'lentils') {
    if (machine.category === 'Sowing' || machine.category === 'Tillage' || machine.id === 'precision-seed-drill') return true;
  }
  if (normalizedCrop === 'vegetables') {
    if (machine.category === 'Spraying' || machine.id === 'pro-power-tiller') return true;
  }
  if (normalizedCrop === 'sugarcane') {
    if (machine.category === 'Tillage' || machine.category === 'Spraying') return true;
  }
  
  return false;
};

// Helper to match tractor power requirements
const matchesPower = (machine: Machine, level: string): boolean => {
  if (level === 'All') return true;
  const hp = getMachineHp(machine);
  if (level === 'low') return hp < 35;
  if (level === 'medium') return hp >= 35 && hp <= 55;
  if (level === 'high') return hp > 55;
  return true;
};

export default function DiscoverView({
  machines,
  onNavigate,
  onSelectMachine
}: DiscoverViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceLimit, setPriceLimit] = useState(4000);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedPower, setSelectedPower] = useState<string>('All');
  const [gpsSort, setGpsSort] = useState(false);
  const [isGpsScanning, setIsGpsScanning] = useState(false);
  const [listingType, setListingType] = useState<'All' | 'Rent' | 'Sale'>('All');

  const categories = ['All', 'Tillage', 'Sowing', 'Harvesting', 'Spraying'];

  // Pre-calculate randomized but stable distances for each machine based on ID hash
  const machineDistances = useMemo(() => {
    const distances: Record<string, number> = {};
    machines.forEach((m) => {
      let hash = 0;
      for (let i = 0; i < m.id.length; i++) {
        hash = m.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      distances[m.id] = parseFloat((1.2 + (Math.abs(hash) % 150) / 10).toFixed(1));
    });
    return distances;
  }, [machines]);

  const handleGpsToggle = () => {
    if (!gpsSort) {
      setIsGpsScanning(true);
      setTimeout(() => {
        setIsGpsScanning(false);
         setGpsSort(true);
      }, 1200);
    } else {
      setGpsSort(false);
    }
  };

  // Filter listings based on category, search query, status, price, crop, and tractor power
  const filteredMachines = useMemo(() => {
    const filtered = machines.filter((machine) => {
      const matchesCategory = selectedCategory === 'All' || machine.category === selectedCategory;
      const matchesSearch =
        machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = listingType === 'Sale' ? true : (machine.price === 0 || machine.price <= priceLimit);
      
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Available' && machine.status === 'Available') ||
        (statusFilter === 'Booked' && machine.status === 'Booked');

      const matchesCropFilter = matchesCrop(machine, selectedCrop);
      const matchesPowerFilter = matchesPower(machine, selectedPower);

      const matchesListingType =
        listingType === 'All' ||
        (listingType === 'Rent' && machine.price > 0) ||
        (listingType === 'Sale' && !!machine.buyPrice && machine.buyPrice > 0);

      return matchesCategory && matchesSearch && matchesPrice && matchesStatus && matchesCropFilter && matchesPowerFilter && matchesListingType;
    });

    if (gpsSort) {
      return [...filtered].sort((a, b) => {
        const distA = machineDistances[a.id] || 999;
        const distB = machineDistances[b.id] || 999;
        return distA - distB;
      });
    }

    return filtered;
  }, [machines, selectedCategory, searchQuery, priceLimit, statusFilter, gpsSort, machineDistances, selectedCrop, selectedPower, listingType]);

  return (
    <div className="w-full">
      {/* Search & Filter Section */}
      <section className="space-y-4">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative flex items-center bg-surface-container-low rounded-xl px-4 h-12 border border-outline-variant/20 shadow-inner">
            <span className="material-symbols-outlined text-outline text-xl">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-base ml-2 placeholder:text-outline/60 text-on-surface"
              placeholder="Search for tractors, harvesters..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer text-base"
              >
                close
              </button>
            )}
          </div>
          
          {/* GPS Proximity Sort Button */}
          <button
            onClick={handleGpsToggle}
            className={`h-12 px-3 flex items-center gap-1.5 rounded-xl active:scale-95 transition-all cursor-pointer border ${
              gpsSort 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm font-bold' 
                : 'bg-white border-outline-variant/30 text-on-surface hover:bg-surface-container-low'
            }`}
            title="Sort by GPS Proximity"
          >
            <span className={`material-symbols-outlined text-xl ${gpsSort || isGpsScanning ? 'animate-pulse text-emerald-400' : ''}`}>
              location_on
            </span>
            <span className="text-xs font-bold tracking-tight hidden sm:inline">
              {gpsSort ? 'GPS Sorted' : 'GPS Proximity'}
            </span>
          </button>

          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`h-12 w-12 flex items-center justify-center rounded-xl active:scale-95 transition-all cursor-pointer flex-shrink-0 ${
              showFilterPanel ? 'bg-primary-container text-white' : 'bg-primary text-white shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* GPS Scanning Live Feedback Banner */}
        {isGpsScanning && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
            <span className="material-symbols-outlined text-emerald-600 text-2xl animate-spin">
              satellite_alt
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-800">Acquiring live browser GPS coordinates...</p>
              <p className="text-[10px] text-emerald-600">Sorting and matching nearby agricultural hubs on Indore satellite grid</p>
            </div>
          </div>
        )}

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listing Type Filter Toggle (Rent/Sale) */}
        <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center border border-outline-variant/10 shadow-inner w-full mt-2">
          <button
            onClick={() => setListingType('All')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              listingType === 'All'
                ? 'bg-primary text-white shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            <span>Rent & Buy (किराया और खरीद)</span>
          </button>
          <button
            onClick={() => setListingType('Rent')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              listingType === 'Rent'
                ? 'bg-primary text-white shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>For Rent (किराए के लिए)</span>
          </button>
          <button
            onClick={() => setListingType('Sale')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              listingType === 'Sale'
                ? 'bg-primary text-white shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">shopping_bag</span>
            <span>For Sale (बिक्री के लिए)</span>
          </button>
        </div>

        {/* Quick Crop Filters Bar */}
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-emerald-500 font-bold">eco</span>
              Filter by Crop Compatibility
            </span>
            {selectedCrop !== 'All' && (
              <button
                onClick={() => setSelectedCrop('All')}
                className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Clear Crop Filter
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {[
              { id: 'All', name: 'All Crops (सभी फसलें)', icon: 'grid_view' },
              { id: 'Wheat', name: 'Wheat (गेहूं)', icon: 'grain' },
              { id: 'Rice', name: 'Rice / Paddy (धान)', icon: 'paddy' },
              { id: 'Sugarcane', name: 'Sugarcane (गन्ना)', icon: 'nest_eco_self' },
              { id: 'Soybean', name: 'Soybean (सोयाबीन)', icon: 'nature' },
              { id: 'Maize', name: 'Maize / Corn (मक्का)', icon: 'agriculture' },
              { id: 'Vegetables', name: 'Vegetables (सब्जियां)', icon: 'nutrition' }
            ].map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all border ${
                  selectedCrop === crop.id
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm font-bold'
                    : 'bg-white text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{crop.icon}</span>
                <span>{crop.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Options Panel */}
      {showFilterPanel && (
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 mt-4 animate-slide-down space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-on-surface">Filters</h4>
            <button
              onClick={() => {
                setPriceLimit(4000);
                setStatusFilter('All');
                setSelectedCategory('All');
                setSelectedCrop('All');
                setSelectedPower('All');
              }}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                <span>Max Price Limit</span>
                <span className="text-primary">₹{priceLimit.toLocaleString()}/day</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={priceLimit}
                onChange={(e) => setPriceLimit(Number(e.target.value))}
                className="w-full accent-primary bg-surface-container-high h-1.5 rounded-full"
              />
            </div>

            {/* Availability Status */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-on-surface-variant block">Availability</span>
              <div className="flex gap-2">
                {['All', 'Available', 'Booked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      statusFilter === status
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tractor Power Requirement Filter */}
            <div className="space-y-2 col-span-1 md:col-span-2 pt-2 border-t border-outline-variant/10">
              <span className="text-xs font-bold text-on-surface-variant block">Tractor Power Requirement</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'All', name: 'All HP Levels', desc: 'Any tractor power' },
                  { id: 'low', name: 'Under 35 HP', desc: 'Tillers & Small tractors' },
                  { id: 'medium', name: '35 - 55 HP', desc: 'Standard utility' },
                  { id: 'high', name: 'Over 55 HP', desc: 'Heavy-duty / Harvesters' }
                ].map((power) => (
                  <button
                    key={power.id}
                    onClick={() => setSelectedPower(power.id)}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      selectedPower === power.id
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-outline-variant/30 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="text-xs font-bold">{power.name}</div>
                    <div className="text-[9px] text-on-surface-variant font-medium mt-0.5">{power.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <section className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-on-surface">Available Near You</h2>
          <span className="font-bold text-primary text-sm bg-primary-container/10 px-3 py-1 rounded-full">
            {filteredMachines.length} Results
          </span>
        </div>

        {/* Machinery Vertical Cards */}
        {filteredMachines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-outline-variant/40 p-6">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
            <p className="font-bold text-on-surface">No machinery found</p>
            <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => {
              const isAvailable = machine.status === 'Available';
              const hasRent = machine.price > 0;
              const hasSale = !!machine.buyPrice && machine.buyPrice > 0;
              return (
                <div
                  key={machine.id}
                  onClick={() => {
                    onSelectMachine(machine);
                    onNavigate('detail');
                  }}
                  className="bg-white rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={machine.image}
                      alt={machine.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm shadow-sm ${
                        isAvailable
                          ? 'bg-primary/95 text-white'
                          : 'bg-error/95 text-white'
                      }`}
                    >
                      {machine.status}
                    </div>

                    {/* GPS Proximity Badge */}
                    <div className="absolute top-4 right-4 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[13px] text-emerald-400 animate-pulse">
                        near_me
                      </span>
                      <span>{machineDistances[machine.id]} km</span>
                    </div>

                    {/* Listing Type Tag */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px] text-emerald-400">
                        {hasRent && hasSale ? 'handshake' : hasSale ? 'shopping_bag' : 'calendar_today'}
                      </span>
                      <span>
                        {hasRent && hasSale ? 'Rent & Sell (किराया और बिक्री)' : hasSale ? 'For Sale Only (बिक्री के लिए)' : 'Rent Only (केवल किराया)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {machine.name}
                        </h3>
                        <p className="text-on-surface-variant text-xs font-medium mt-0.5">
                          {machine.owner}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-on-surface-variant font-bold">
                          <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                          <span>{machine.location.split(',')[0]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-bold text-sm text-on-surface">{machine.rating}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-outline-variant/10">
                      <div className="flex flex-col">
                        {hasRent && (
                          <div className="flex items-baseline gap-1 text-primary">
                            <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Rent:</span>
                            <span className="text-base font-extrabold">₹{machine.price.toLocaleString()}</span>
                            <span className="text-[10px] font-medium text-on-surface-variant">/day</span>
                          </div>
                        )}
                        {hasSale && (
                          <div className="flex items-baseline gap-1 text-emerald-600 mt-0.5">
                            <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Buy:</span>
                            <span className="text-base font-extrabold">₹{machine.buyPrice?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMachine(machine);
                          onNavigate('detail');
                        }}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer"
                      >
                        Select Options
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
