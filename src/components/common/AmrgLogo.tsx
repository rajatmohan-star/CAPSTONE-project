/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AmrgLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AmrgLogo: React.FC<AmrgLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official AMRG Emblem Lockup */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#0A7C3B] via-[#08632f] to-[#05466C] text-white flex items-center justify-center shadow-sm shrink-0 border border-white/20 p-1`}
      >
        <svg
          viewBox="0 0 44 44"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield Outline */}
          <path
            d="M22 3L6 8.5V20.5C6 30.5 12.8 39.5 22 41.5C31.2 39.5 38 30.5 38 20.5V8.5L22 3Z"
            fill="url(#amrgGrad)"
            stroke="#56AD36"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Stylized Faceted Globe Latitude & Longitude / A Device */}
          <path
            d="M22 10L13 31H17.5L19.5 26H24.5L26.5 31H31L22 10ZM20.8 22.2L22 18.5L23.2 22.2H20.8Z"
            fill="white"
          />
          <path
            d="M10 20.5C10 26 15 31.5 22 33.5C29 31.5 34 26 34 20.5"
            stroke="#56AD36"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <defs>
            <linearGradient id="amrgGrad" x1="6" y1="3" x2="38" y2="41.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0A7C3B" />
              <stop offset="0.6" stopColor="#08632f" />
              <stop offset="1" stopColor="#05466C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className={`font-black text-slate-900 tracking-tight font-serif ${titleSizes[size]}`}>
            AMRG
          </span>
          <span className={`font-bold text-[#05466C] tracking-widest uppercase ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
            GLOBAL
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold mt-1">
            Corporate, Tax & Advisory · UAE
          </p>
        )}
      </div>
    </div>
  );
};
