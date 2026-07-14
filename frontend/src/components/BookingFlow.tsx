/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Machine, Booking } from '../types';

interface BookingFlowProps {
  machine: Machine;
  onAddBooking: (booking: Booking) => void;
  onNavigate: (view: any) => void;
  mode?: 'rent' | 'buy';
  userName?: string;
  userAvatar?: string;
}

export default function BookingFlow({
  machine,
  onAddBooking,
  onNavigate,
  mode = 'rent',
  userName = 'Ramrao Patil',
  userAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxeNo9aGLuYdjl3TybTeDw2_mgmxg5mxrIexSqR9ZLHFcyZL9L_Hb5CR7CtZFs35lV0zqzGKcWktX1Mo7Ff0GphZWLvbU9Ok8s-Lt9TIrpovFpqfI3bOF6AkpervaDYyz0IyP4df-7sMemBDNKJUbeVAX0e9wPD1Rzi8-eceWpQjE35bPznT3JlqJsG9iWcpBJ5rbOiXmaeTSG0GLziAeryffo9tT7VkvjJOlUZTam2qIBH9MfDolzffmunFxgBhxOkGsSUoRfG2Cy'
}: BookingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(1);
  const [enablePreBook, setEnablePreBook] = useState(false);
  const [selectedStart, setSelectedStart] = useState<number | null>(10);
  const [selectedEnd, setSelectedEnd] = useState<number | null>(13);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Home Farm Road, Indore District, MP');

  const isBuyMode = mode === 'buy';

  // Simplified calendar setup for October 2024
  // Starts on Tuesday (1st Oct) and ends on Thursday (31st Oct)
  const calendarDays = useMemo(() => {
    const days: { date: number; isCurrentMonth: boolean; isOccupied: boolean }[] = [];
    
    // Add prefix days from September (29, 30)
    days.push({ date: 29, isCurrentMonth: false, isOccupied: false });
    days.push({ date: 30, isCurrentMonth: false, isOccupied: false });

    // Add October days (1 to 31)
    for (let d = 1; d <= 31; d++) {
      // Mark 21 and 22 as Occupied matching mockup
      const isOccupied = d === 21 || d === 22;
      days.push({ date: d, isCurrentMonth: true, isOccupied });
    }
    return days;
  }, []);

  // Calculate rental duration
  const totalDays = useMemo(() => {
    if (isBuyMode) return 0;
    if (selectedStart !== null && selectedEnd !== null) {
      return Math.abs(selectedEnd - selectedStart) + 1;
    }
    return 1;
  }, [selectedStart, selectedEnd, isBuyMode]);

  const basePrice = isBuyMode ? (machine.buyPrice || machine.price * 80) : machine.price;
  const totalPriceCalculated = basePrice * (isBuyMode ? 1 : totalDays) * quantity;
  const securityDeposit = isBuyMode ? 0 : 1500;
  const totalPayable = totalPriceCalculated + securityDeposit;

  const handleDateClick = (dayNum: number, isCurrent: boolean, isOccupied: boolean) => {
    if (isBuyMode) return;
    if (!isCurrent || isOccupied) return;

    if (selectedStart === null || (selectedStart !== null && selectedEnd !== null)) {
      setSelectedStart(dayNum);
      setSelectedEnd(null);
    } else if (dayNum < selectedStart) {
      setSelectedStart(dayNum);
      setSelectedEnd(null);
    } else {
      setSelectedEnd(dayNum);
    }
  };

  const handleConfirm = () => {
    if (step < 2) {
      setStep(2);
      return;
    }
    if (step < 3) {
      setStep(3);
      return;
    }

    // Creating the final booking model
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      machineId: machine.id,
      machineName: machine.name,
      machineImage: machine.image,
      farmerName: userName,
      farmerAvatar: userAvatar,
      startDate: isBuyMode ? 'Direct Sale' : `Oct ${selectedStart || 10}`,
      endDate: isBuyMode ? 'Immediate' : `Oct ${selectedEnd || selectedStart || 10}`,
      totalDays: isBuyMode ? 0 : totalDays,
      totalPrice: totalPayable,
      status: 'Pending',
      createdDate: 'Today',
      isPreBook: isBuyMode ? false : enablePreBook,
      quantity,
      isPurchase: isBuyMode
    };

    onAddBooking(newBooking);
    setShowSuccessModal(true);
  };

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <nav className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[340px]">
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setStep(1)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= 1 ? 'bg-primary-container text-white shadow-sm' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              1
            </div>
            <span className={`font-bold text-xs ${step >= 1 ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}>
              Select Date
            </span>
          </div>
          
          <div className="flex-grow h-[2px] bg-outline-variant mx-4 mt-[-24px]"></div>
          
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setStep(2)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= 2 ? 'bg-primary-container text-white shadow-sm' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              2
            </div>
            <span className={`font-bold text-xs ${step >= 2 ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}>
              Confirm
            </span>
          </div>
          
          <div className="flex-grow h-[2px] bg-outline-variant mx-4 mt-[-24px]"></div>
          
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setStep(3)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= 3 ? 'bg-primary-container text-white shadow-sm' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              3
            </div>
            <span className={`font-bold text-xs ${step >= 3 ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}>
              Payment
            </span>
          </div>
        </div>
      </nav>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Selection Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Machine Quick Summary */}
            <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 flex gap-4 items-center shadow-sm">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-outline-variant/10 shadow-inner">
                <img src={machine.image} alt={machine.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase mb-1">
                  {isBuyMode ? 'FOR SALE' : machine.status}
                </span>
                <h2 className="font-bold text-lg text-on-surface">{machine.name}</h2>
                <p className="text-xs text-on-surface-variant font-medium">
                  {machine.features.find((f) => f.label === 'Tractor HP')?.value || '50 HP'} • Heavy Duty Soil Prep
                </p>
              </div>
            </div>

            {isBuyMode ? (
              /* Delivery Destination Setup for Purchase */
              <section className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="material-symbols-outlined font-bold">local_shipping</span>
                  <h3 className="font-bold text-lg text-on-surface">Delivery Details</h3>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Farm Delivery Address</label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                    placeholder="Enter full delivery location"
                  />
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3 text-xs leading-relaxed text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary font-bold">verified</span>
                  <div>
                    <span className="font-bold text-primary block">Free Insured Transport</span>
                    <span>All capital machinery sales include doorstep delivery within MP. Your unit is fully insured against transport damage and certified engineers will complete the field setup.</span>
                  </div>
                </div>
              </section>
            ) : (
              /* Calendar View for Rent */
              <section className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-on-surface">Select Duration</h3>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-on-surface-variant mb-4 px-2">October 2024</h4>
                  <div className="grid grid-cols-7 text-center mb-2 font-bold text-xs text-on-surface-variant/60">
                    <div>SU</div>
                    <div>MO</div>
                    <div>TU</div>
                    <div>WE</div>
                    <div>TH</div>
                    <div>FR</div>
                    <div>SA</div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-sm font-medium">
                    {calendarDays.map((day, idx) => {
                      const isSelectedStart = selectedStart === day.date && day.isCurrentMonth;
                      const isSelectedEnd = selectedEnd === day.date && day.isCurrentMonth;
                      const isBetween =
                        day.isCurrentMonth &&
                        selectedStart !== null &&
                        selectedEnd !== null &&
                        day.date > selectedStart &&
                        day.date < selectedEnd;

                      let bgClass = 'hover:bg-surface-container-low text-on-surface';
                      if (!day.isCurrentMonth) {
                        bgClass = 'text-on-surface-variant/30 cursor-default';
                      } else if (day.isOccupied) {
                        bgClass = 'text-on-surface-variant opacity-40 bg-error/5 cursor-not-allowed border-b-2 border-error/20';
                      } else if (isSelectedStart) {
                        bgClass = 'bg-primary text-white rounded-l-xl font-bold';
                      } else if (isSelectedEnd) {
                        bgClass = 'bg-primary text-white rounded-r-xl font-bold';
                      } else if (isBetween) {
                        bgClass = 'bg-primary/10 text-on-surface font-bold';
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleDateClick(day.date, day.isCurrentMonth, day.isOccupied)}
                          className={`py-3 transition-colors cursor-pointer text-sm ${bgClass}`}
                          title={day.isOccupied ? 'Existing Booking' : undefined}
                        >
                          {day.date}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs font-semibold text-on-surface-variant">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error/20 border-b border-error"></div>
                    <span className="text-xs font-semibold text-on-surface-variant">Occupied</span>
                  </div>
                </div>
              </section>
            )}

            {/* Quantity Selector */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-lg text-on-surface">{isBuyMode ? 'Purchase Units' : 'Quantity'}</h3>
                <p className="text-on-surface-variant text-xs font-medium">Select number of machinery units</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center active:scale-90 hover:bg-surface-container-low transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">remove</span>
                </button>
                <span className="font-extrabold text-xl text-on-surface w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center active:scale-90 hover:bg-surface-container-low transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              </div>
            </div>

            {/* Subsidy / Overlap Banner */}
            {isBuyMode ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">workspace_premium</span>
                <div>
                  <p className="font-bold text-sm text-emerald-800">Subsidy Eligibility Verified!</p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    This capital tractor machinery item qualifies for the central farm machinery subsidy program. A digital certificate and tax credit receipt will be issued upon delivery to help you claim up to 15% back.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-tertiary/5 border border-tertiary-container/30 rounded-2xl p-5 flex gap-4">
                <span className="material-symbols-outlined text-tertiary text-2xl">info</span>
                <div>
                  <p className="font-bold text-sm text-tertiary-container">Booking Overlap Possible?</p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    If your dates overlap with existing bookings, you can choose 'Pre-book'. We will notify you if the slot becomes available.
                  </p>
                  <div className="mt-4 flex items-center gap-2.5">
                    <input
                      id="prebook"
                      type="checkbox"
                      checked={enablePreBook}
                      onChange={(e) => setEnablePreBook(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-5 h-5 accent-primary cursor-pointer"
                    />
                    <label htmlFor="prebook" className="font-bold text-sm text-on-surface cursor-pointer select-none">
                      Enable Pre-booking for unavailable dates
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary Box */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="bg-white rounded-3xl shadow-lg border border-outline-variant/15 overflow-hidden">
                <div className="bg-primary p-5 text-white">
                  <h3 className="font-bold text-lg">{isBuyMode ? 'Purchase Summary' : 'Booking Summary'}</h3>
                  <p className="opacity-85 text-xs">{isBuyMode ? 'Ownership Transfer Details' : 'Review your selection'}</p>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm text-on-surface">
                    <span className="text-on-surface-variant font-medium">Agreement Type</span>
                    <span className="font-extrabold text-primary">{isBuyMode ? 'Permanent Purchase' : 'Rental Lease'}</span>
                  </div>

                  {!isBuyMode && (
                    <div className="flex justify-between items-center text-sm text-on-surface">
                      <span className="text-on-surface-variant font-medium">Total Days</span>
                      <span className="font-bold">{totalDays} Days</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-on-surface">
                    <span className="text-on-surface-variant font-medium">{isBuyMode ? 'Machine Purchase Price' : 'Rent (per day)'}</span>
                    <span className="font-bold">₹{basePrice.toLocaleString()}</span>
                  </div>

                  {quantity > 1 && (
                    <div className="flex justify-between items-center text-sm text-on-surface">
                      <span className="text-on-surface-variant font-medium">Quantity</span>
                      <span className="font-bold">{quantity} Units</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-on-surface">
                    <span className="text-on-surface-variant font-medium">Subtotal</span>
                    <span className="font-bold">₹{totalPriceCalculated.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-outline-variant/10 text-sm text-on-surface">
                    <span className="text-on-surface-variant font-medium flex items-center gap-1">
                      {isBuyMode ? 'Delivery & Setup Fee' : 'Security Deposit'}
                      <span className="material-symbols-outlined text-xs">help</span>
                    </span>
                    <div className="text-right">
                      <span className="font-bold block">{isBuyMode ? 'FREE' : `₹${securityDeposit.toLocaleString()}`}</span>
                      <span className="text-[9px] text-primary uppercase font-bold tracking-wider">
                        {isBuyMode ? 'Promotional Offer' : 'Refundable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-y border-outline-variant/20 mt-4">
                    <span className="font-bold text-lg text-on-surface">Total Payable</span>
                    <span className="font-extrabold text-primary text-2xl">₹{totalPayable.toLocaleString()}</span>
                  </div>
                  
                  <button
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-md cursor-pointer text-sm bg-primary text-white hover:bg-primary/95 shadow-primary/20"
                  >
                    {isBuyMode ? 'Place Purchase Order' : enablePreBook ? 'Pre-book Now' : 'Confirm Rental Booking'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  
                  <p className="text-center text-[11px] text-on-surface-variant px-2 leading-relaxed">
                    By clicking confirm, you agree to our <a href="#" className="text-primary underline">{isBuyMode ? 'Purchase Warranties' : 'Rental Terms'}</a> and <a href="#" className="text-primary underline">Safety Guidelines</a>.
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 flex justify-around items-center opacity-70">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface">Verified Machines</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface">24/7 Support</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-primary text-xl">payments</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface">Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step 2 */}
      {step === 2 && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-outline-variant/25 shadow-lg text-center animate-fade-in space-y-4">
          <span className="material-symbols-outlined text-6xl text-primary">{isBuyMode ? 'gpp_good' : 'gpp_maybe'}</span>
          <h3 className="text-2xl font-bold text-on-surface">{isBuyMode ? 'Purchase Agreement' : 'Rental Agreement'}</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {isBuyMode 
              ? 'Please confirm that you have read and accepted the KrishiYantra capital ownership specifications, doorstep technical support, and regional subsidy eligibility guidelines.'
              : 'Please confirm that you have read and accepted the KrishiYantra safety checklist, which includes inspecting fuel, gear alignment, and tilling width matching for your tractor horsepower.'
            }
          </p>

          <div className="bg-surface-container p-4 rounded-2xl text-left text-xs space-y-2">
            {isBuyMode ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                  <span className="font-semibold">I understand this is a direct permanent purchase with full manufacturer warranty.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                  <span className="font-semibold">I agree to receive the certified registration papers and tax receipt upon delivery.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                  <span className="font-semibold">I will operate the machinery within standard parameters (Max 210 RPM).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                  <span className="font-semibold">I will report any minor faults or hydraulic leakage immediately.</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => setStep(3)}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all cursor-pointer"
            >
              I Agree, Proceed to Payment
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Payment Step 3 */}
      {step === 3 && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-outline-variant/25 shadow-lg text-center animate-fade-in space-y-4">
          <span className="material-symbols-outlined text-6xl text-primary">payments</span>
          <h3 className="text-2xl font-bold text-on-surface">Select Payment Method</h3>
          <p className="text-on-surface-variant text-sm">
            Total Payable: <span className="font-extrabold text-primary">₹{totalPayable.toLocaleString()}</span>
          </p>

          <div className="space-y-3 pt-2 text-left">
            <button
              onClick={handleConfirm}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-on-surface cursor-pointer animate-fade-in"
            >
              <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
              <span>Pay via UPI (GPay, PhonePe, Paytm)</span>
            </button>
            <button
              onClick={handleConfirm}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
              <span>Credit / Debit / Net Banking</span>
            </button>
            {isBuyMode && (
              <button
                onClick={handleConfirm}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-2xl">finance_mode</span>
                <span>Agri-Financing (KCC - Kisan Credit Card)</span>
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-2xl">handshake</span>
              <span>{isBuyMode ? 'Cash on Doorstep Delivery' : 'Cash on Delivery / Field Handover'}</span>
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep(2)}
              className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Success Dialog Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl space-y-3">
            <span className="material-symbols-outlined text-6xl text-primary animate-bounce">check_circle</span>
            <h3 className="text-2xl font-bold text-on-surface">{isBuyMode ? 'Order Placed!' : 'Booking Successful!'}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {isBuyMode 
                ? <>Your purchase order for <span className="font-bold">{machine.name}</span> has been created. {machine.owner} is processing delivery to Indore district.</>
                : <>Your request for <span className="font-bold">{machine.name}</span> has been sent successfully to {machine.owner}.</>
              }
            </p>
            <p className="text-xs text-on-surface-variant">
              You can track the progress anytime under your Profile or by contacting the dealer.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('farmer-dashboard');
                }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar for Mobile */}
      {step === 1 && (
        <footer className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant/20 p-4 z-40 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant font-medium">Total Payable</span>
            <span className="font-extrabold text-primary text-lg">₹{totalPayable.toLocaleString()}</span>
          </div>
          <button
            onClick={handleConfirm}
            className="flex-grow py-3.5 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer text-sm bg-primary text-white"
          >
            {isBuyMode ? 'Place Order' : enablePreBook ? 'Pre-book Now' : 'Confirm Booking'}
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </footer>
      )}
    </div>
  );
}
