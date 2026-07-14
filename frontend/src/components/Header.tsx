/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewType, UserRole } from '../types';

interface HeaderProps {
  currentView: ViewType;
  role: UserRole;
  onNavigate: (view: ViewType) => void;
  onBack?: () => void;
  notificationCount: number;
}

export default function Header({
  currentView,
  role,
  onNavigate,
  onBack,
  notificationCount
}: HeaderProps) {
  const showBackButton = currentView === 'detail' || currentView === 'booking' || currentView === 'gps-tracker';

  return (
    <header className="bg-background fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 border-b border-outline-variant/10 shadow-sm">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low active:scale-95 transition-all text-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <div
          onClick={() => onNavigate(role === 'owner' ? 'owner-dashboard' : 'farmer-dashboard')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            agriculture
          </span>
          <span className="font-bold text-xl text-primary tracking-tight">KrishiYantra</span>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {currentView === 'detail' && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
            className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all text-xl cursor-pointer"
          >
            share
          </button>
        )}
        
        <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all text-xl relative cursor-pointer">
          notifications
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
