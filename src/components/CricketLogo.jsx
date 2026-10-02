import React from 'react';
import { SITE_CONFIG } from '../config/siteConfig';

export const CricketLogo = () => {
  return (
    <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      {/* Cricket Ball Icon */}
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#ef4444" />
        {/* Seam Stitching */}
        <path d="M7 9C12 13 12 19 7 23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
        <path d="M25 9C20 13 20 19 25 23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
        <path d="M16 4V28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
      <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
        {SITE_CONFIG.appName}
      </span>
    </div>
  );
};
