/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Machine, Review } from '../types';
import { INITIAL_REVIEWS } from '../data';
import { api } from '../api';

interface DetailViewProps {
  machine: Machine;
  similarMachines: Machine[];
  onNavigate: (view: any) => void;
  onSelectMachine: (machine: Machine) => void;
  onAddBooking: (booking: any) => void;
  onInitiateBooking?: (mode: 'rent' | 'buy') => void;
}

export default function DetailView({
  machine,
  similarMachines,
  onNavigate,
  onSelectMachine,
  onAddBooking,
  onInitiateBooking
}: DetailViewProps) {
  const hasRent = machine.price > 0;
  const hasSale = !!machine.buyPrice && machine.buyPrice > 0;
  const [mode, setMode] = useState<'rent' | 'buy'>(hasRent ? 'rent' : 'buy');
  const activeMode = !hasRent ? 'buy' : (!hasSale ? 'rent' : mode);

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'owner'; text: string; time: string }[]>([
    { sender: 'owner', text: 'Namaste! How can I help you with the machine today?', time: '10:30 AM' }
  ]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  useEffect(() => {
    api.getReviews(machine.id).then(setReviews).catch(console.error);
  }, [machine.id]);

  // Rental calculator state
  const [calcDays, setCalcDays] = useState(5);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatLog((prev) => [...prev, { sender: 'user', text: userMsg, time: 'Now' }]);
    setChatMessage('');

    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'owner',
          text: `Thank you for reaching out! Shri Ram Krishi Kendra is verified and delivery is available within 50km. Would you like to proceed with booking for ₹${machine.price}/day?`,
          time: 'Now'
        }
      ]);
    }, 1000);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    const rev: Review = {
      id: `rev-${Date.now()}`,
      userName: 'Ramrao Patil (You)',
      rating: newReviewRating,
      comment: newReviewComment,
      date: 'Today'
    };
    api.createReview(machine.id, rev).then((saved) => {
      setReviews((prev) => [saved, ...prev]);
    }).catch(console.error);
    setNewReviewComment('');
  };

  return (
    <div className="w-full pb-12">
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden rounded-2xl shadow-sm border border-outline-variant/10">
        <img
          src={machine.image}
          alt={machine.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-outline-variant/10">
          <span className="material-symbols-outlined text-secondary text-base font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="text-sm font-bold text-on-surface">
            {machine.rating} ({machine.reviewsCount} Reviews)
          </span>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
                {machine.name}
              </h1>
              <div className="flex items-center gap-1 text-on-surface-variant mt-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span className="text-sm font-bold">{machine.location}</span>
              </div>
            </div>
            
            <div className="text-left lg:text-right">
              {activeMode === 'rent' ? (
                <>
                  <div className="flex items-center lg:justify-end gap-1 text-primary">
                    <span className="text-2xl font-extrabold">₹{machine.price.toLocaleString()}</span>
                    <span className="text-sm font-bold text-on-surface-variant">/day</span>
                  </div>
                  <button
                    onClick={() => setShowCalculator(true)}
                    className="text-primary text-xs font-bold flex items-center lg:justify-end hover:underline gap-1 mt-1 cursor-pointer"
                  >
                    Rental Calculator
                    <span className="material-symbols-outlined text-sm">calculate</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col lg:items-end">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Purchase Price</span>
                  <span className="text-2xl font-extrabold text-primary">
                    ₹{(machine.buyPrice || machine.price * 90).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rent vs Buy Toggle */}
          {hasRent && hasSale && (
            <div className="mt-8 bg-surface-container-low p-1.5 rounded-xl flex items-center max-w-xs border border-outline-variant/10 shadow-inner">
              <button
                onClick={() => setMode('rent')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                  activeMode === 'rent'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Rent Machine
              </button>
              <button
                onClick={() => setMode('buy')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                  activeMode === 'buy'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Buy Machine
              </button>
            </div>
          )}

          {/* Tabs Section */}
          <div className="mt-10">
            <div className="flex border-b border-outline-variant/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-bold text-sm transition-all cursor-pointer relative ${
                  activeTab === 'overview'
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-6 py-3 font-bold text-sm transition-all cursor-pointer relative ${
                  activeTab === 'specs'
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Specifications
                {activeTab === 'specs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-bold text-sm transition-all cursor-pointer relative ${
                  activeTab === 'reviews'
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Reviews
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="py-6 space-y-6 animate-fade-in">
                <p className="text-on-surface-variant text-base leading-relaxed">
                  {machine.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {machine.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container rounded-2xl p-4 flex flex-col gap-1 border border-outline-variant/10 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-primary text-2xl">
                        {feat.icon}
                      </span>
                      <span className="text-xs text-on-surface-variant font-semibold mt-1">{feat.label}</span>
                      <span className="font-extrabold text-on-surface text-sm">{feat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specs Tab Content */}
            {activeTab === 'specs' && (
              <div className="py-6 space-y-2 animate-fade-in">
                {machine.specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-outline-variant/20 py-3 text-sm text-on-surface"
                  >
                    <span className="text-on-surface-variant font-medium">{spec.label}</span>
                    <span className="font-bold">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab Content */}
            {activeTab === 'reviews' && (
              <div className="py-6 space-y-6 animate-fade-in">
                {/* Add Review Form */}
                <form onSubmit={handleAddReview} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-3">
                  <span className="text-sm font-bold text-on-surface block">Write a Review</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="material-symbols-outlined text-xl text-secondary hover:scale-110 transition-transform cursor-pointer"
                        style={{ fontVariationSettings: star <= newReviewRating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Share your experience with this machine..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary/95 cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container font-extrabold flex items-center justify-center text-sm shadow-inner flex-shrink-0">
                        {rev.userName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                          <h4 className="font-bold text-on-surface text-sm">{rev.userName}</h4>
                          <span className="text-xs text-on-surface-variant font-medium">{rev.date}</span>
                        </div>
                        <div className="flex text-secondary gap-0.5 my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-xs"
                              style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Owner & Quick Actions */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-outline-variant/10 rounded-3xl p-6 sticky top-24 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-on-surface mb-4">Owner Details</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm flex-shrink-0">
                <img
                  src={machine.ownerAvatar}
                  alt={machine.owner}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-base">{machine.owner}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Verified Partner since {machine.ownerSince}</p>
              </div>
              <a
                href={`tel:${machine.ownerPhone}`}
                className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold">call</span>
              </a>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                <span>Machine Insured & Verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                <span>Delivery Available (within 50km)</span>
              </div>
            </div>

            <button
              onClick={() => setShowChat(true)}
              className="w-full mt-6 bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/95 active:scale-[0.98] transition-all text-sm cursor-pointer shadow-sm"
            >
              Chat with Owner
            </button>
          </div>
        </div>
      </div>

      {/* Similar Machinery */}
      <section className="mt-16 border-t border-outline-variant/20 pt-10">
        <h2 className="text-xl font-bold mb-6 text-on-surface">Similar Machines Nearby</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarMachines.slice(0, 3).map((sim) => (
            <div
              key={sim.id}
              onClick={() => {
                onSelectMachine(sim);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="h-40 relative overflow-hidden">
                <img
                  src={sim.image}
                  alt={sim.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1">
                <p className="font-bold text-on-surface text-base group-hover:text-primary transition-colors line-clamp-1">
                  {sim.name}
                </p>
                <p className="text-primary font-extrabold">₹{sim.price.toLocaleString()}/day</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rental Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
            <span className="material-symbols-outlined text-5xl text-primary mb-3">calculate</span>
            <h3 className="text-xl font-bold text-on-surface">Rental Estimate</h3>
            <p className="text-on-surface-variant text-sm mt-1">Estimating cost for {machine.name}</p>
            
            <div className="my-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Duration (Days)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={calcDays}
                    onChange={(e) => setCalcDays(Math.max(1, Number(e.target.value)))}
                    className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 font-bold text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-surface-container p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Base Rent</span>
                  <span className="font-bold">₹{(machine.price * calcDays).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Security Deposit (Refundable)</span>
                  <span className="font-bold">₹1,500</span>
                </div>
                <div className="border-t border-outline-variant/10 pt-2 flex justify-between font-bold text-primary">
                  <span>Total Payable</span>
                  <span>₹{(machine.price * calcDays + 1500).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowCalculator(false);
                  onNavigate('booking');
                }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all"
              >
                Proceed with Booking
              </button>
              <button
                onClick={() => setShowCalculator(false)}
                className="w-full border border-outline py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer / Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Chat Header */}
            <div className="bg-primary p-4 text-white flex items-center gap-3">
              <button
                onClick={() => setShowChat(false)}
                className="material-symbols-outlined hover:bg-white/10 p-1 rounded-full text-xl cursor-pointer"
              >
                arrow_back
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <img src={machine.ownerAvatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm leading-none">{machine.owner}</p>
                <p className="text-[10px] opacity-80 mt-1">Verified partner • Online</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {chatLog.map((chat, idx) => {
                const isUser = chat.sender === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[80%] ${
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        isUser
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white text-on-surface rounded-tl-none border border-outline-variant/15 shadow-sm'
                      }`}
                    >
                      {chat.text}
                    </div>
                    <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                      {chat.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-outline-variant/10 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant/20 px-4 py-4 z-40 flex items-center justify-between gap-4 shadow-lg md:justify-center">
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className={`flex-shrink-0 w-14 h-14 rounded-xl border border-outline-variant/30 flex items-center justify-center transition-all cursor-pointer hover:bg-surface-container-low ${
            isFavorited ? 'text-red-500' : 'text-on-surface-variant'
          }`}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
        <button
          onClick={() => {
            if (onInitiateBooking) {
              onInitiateBooking(activeMode);
            } else {
              onNavigate('booking');
            }
          }}
          className="flex-grow max-w-lg h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-transform shadow-md shadow-primary/20 cursor-pointer"
        >
          <span className="material-symbols-outlined">
            {activeMode === 'buy' ? 'shopping_bag' : 'calendar_month'}
          </span>
          {activeMode === 'buy' ? 'Buy Now' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}
