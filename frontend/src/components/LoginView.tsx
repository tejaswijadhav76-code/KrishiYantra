/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { api } from '../api';

interface LoginViewProps {
  onLoginSuccess: (user: {
    phone: string;
    role: UserRole;
    name: string;
    avatar: string;
    location: string;
    storeName?: string;
  }) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [otpSent, setOtpSent] = useState<string>('');
  const [otpInput, setOtpInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  
  // Profile settings
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('Indore, Madhya Pradesh');
  const [storeName, setStoreName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-generate verification code
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('You must accept the terms & conditions.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    api.login(phoneNumber, selectedRole)
      .then((res) => {
        setOtpSent(res.otp);
        setStep('otp');
        setLoading(false);
        setShowSmsToast(true);

        // Dismiss SMS banner after 12 seconds
        setTimeout(() => {
          setShowSmsToast(false);
        }, 12000);
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
      });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length < 6) {
      setErrorMsg('OTP must be 6 digits long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setShowSmsToast(false);

    api.verifyOtp(phoneNumber, otpInput, selectedRole)
      .then((res) => {
        setLoading(false);
        setUserName(res.defaultProfile.name);
        if (res.defaultProfile.storeName) {
          setStoreName(res.defaultProfile.storeName);
        }
        setStep('profile');
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.message || 'Invalid OTP. Please check the simulated SMS toast above or enter 123456.');
      });
  };

  const handleCompleteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    api.saveProfile(`+91 ${phoneNumber}`, selectedRole, userName, userLocation, selectedRole === 'owner' ? storeName || 'My Rental Shop' : undefined)
      .then((res) => {
        setLoading(false);
        onLoginSuccess(res.user);
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.message || 'Failed to complete profile.');
      });
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center items-center px-4 py-8 relative selection:bg-primary/20">
      
      {/* Dynamic Simulated SMS Broadcast Toast */}
      {showSmsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-[150] border border-slate-700/50 flex gap-3 animate-fade-in items-start">
          <span className="material-symbols-outlined text-amber-400 text-2xl mt-0.5">sms</span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">SIMULATED SMS BROADCAST</span>
              <button onClick={() => setShowSmsToast(false)} className="material-symbols-outlined text-slate-400 hover:text-white text-xs">close</button>
            </div>
            <p className="text-sm font-semibold mt-1 text-slate-100">
              [KrishiYantra OTP] Your secure login verification code is <span className="text-primary-container bg-primary/20 px-1.5 py-0.5 rounded font-extrabold text-amber-300">{otpSent}</span>. Valid for 5 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Main Login Card Wrapper */}
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-outline-variant/15 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300">
        
        {/* Banner Section */}
        <div className="relative h-44 bg-primary flex flex-col justify-end p-6 overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/80 to-primary/45 z-10" />
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrS84LqeS0h9ab2dvPy_2_OO-vNOhOm_IVai0EuSOKm-KEpsr6cBUs2OdbDVf80S62UrB7j-x2n9_4kTS3xH2chRjczjQchkmVKiRdbm5KyQZmr2__4tzjrJ2x9KXVmt8tAU_rG6AbY_TIQ7CRNz_BnwmiegvWuqR4mrAEAw7u80d53Ibxnc5k2ucSmib0QNQe8v3ScFTwhcTApqIOjANf70Nt03do3VKMMwl_r6bBd-1bjFyXiOYtEfaEmG8CuJ8EGaJzPa_cG1y9" 
            alt="Field Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-65"
          />
          <div className="relative z-20 flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-3xl font-extrabold" style={{ fontVariationSettings: "'FILL' 1" }}>
              agriculture
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight">KrishiYantra</span>
          </div>
          <p className="relative z-20 text-xs text-white/85 font-medium mt-1">Digital Hub for Renting & Selling Farm Machinery</p>
        </div>

        {/* Dynamic Form States */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-extrabold text-on-surface">Welcome to KrishiYantra</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">Enter your mobile number to sign in or create an account</p>
                </div>

                {errorMsg && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Role Switch Pre-select */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">Login Perspective</label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('farmer')}
                      className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                        selectedRole === 'farmer'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant hover:border-outline text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">agriculture</span>
                      <span>Farmer Portal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('owner')}
                      className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                        selectedRole === 'owner'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant hover:border-outline text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">storefront</span>
                      <span>Shop Owner</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">Mobile Number</label>
                  <div className="flex items-center bg-surface-container rounded-2xl border border-outline-variant/35 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="text-sm font-bold text-on-surface-variant mr-2">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-grow bg-transparent text-sm focus:outline-none text-on-surface font-bold tracking-wide"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary accent-primary mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-on-surface-variant font-medium leading-relaxed select-none cursor-pointer">
                    I agree to KrishiYantra's <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a>, <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>, and consent to receive digital receipts.
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Secure OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Verification Code</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-1.5 text-primary mb-1">
                    <button 
                      type="button" 
                      onClick={() => setStep('phone')} 
                      className="material-symbols-outlined hover:bg-surface-container-low p-1.5 rounded-full text-base cursor-pointer"
                    >
                      arrow_back
                    </button>
                    <span className="text-xs font-bold text-on-surface-variant">Change mobile number</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-on-surface mt-2">Enter Verification Code</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    We sent a secure 6-digit verification code to <span className="font-extrabold text-on-surface">+91 {phoneNumber}</span>
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block text-center">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center bg-surface-container border border-outline-variant/30 rounded-2xl py-3 text-lg font-extrabold tracking-[0.5em] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="block text-center text-[10px] text-on-surface-variant font-medium mt-1">
                    Tip: Enter the code displayed in the Simulated SMS notification banner above.
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span className="text-on-surface-variant">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
                      setOtpSent(generatedCode);
                      setShowSmsToast(true);
                      alert(`A new code (${generatedCode}) has been simulated! Check the SMS banner.`);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Resend SMS Code
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleCompleteProfile} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-extrabold text-on-surface">Setup Your Profile</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    Complete your digital KrishiYantra profile as a <span className="text-primary font-extrabold capitalize">{selectedRole}</span>
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your real name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">District / Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indore, Madhya Pradesh"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                  />
                </div>

                {selectedRole === 'owner' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">Store Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Farm Rentals"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer text-sm"
                >
                  <span>Go to Dashboard</span>
                  <span className="material-symbols-outlined text-sm">dashboard</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
