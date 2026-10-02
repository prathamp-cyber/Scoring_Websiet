import React, { useState } from 'react';
import { CricketLogo } from './CricketLogo';
import { ChevronDown, Search, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Left: Brand Logo */}
        <div className="navbar-left">
          <CricketLogo />
        </div>

        {/* Center-Right: Desktop Navigation Links */}
        <nav className="desktop-nav">
          <div className="nav-item has-dropdown">
            <span>Live scores</span>
            <ChevronDown className="dropdown-caret" size={14} />
          </div>
          <div className="nav-item has-dropdown">
            <span>Network</span>
            <ChevronDown className="dropdown-caret" size={14} />
          </div>
          <div className="nav-item has-dropdown">
            <span>Add ons</span>
            <ChevronDown className="dropdown-caret" size={14} />
          </div>
          <div className="nav-item has-dropdown">
            <span>More</span>
            <ChevronDown className="dropdown-caret" size={14} />
          </div>
          <a href="#store" className="nav-link">Store</a>
          <a href="#jobs" className="nav-link">Jobs</a>
          <a href="#contact" className="nav-link">Contact us</a>
        </nav>

        {/* Far Right: Actions (Sign In + Search + Mobile Toggle) */}
        <div className="navbar-actions">
          <button className="sign-in-btn">
            Sign in
          </button>
          
          <button className="icon-btn search-btn" aria-label="Search">
            <Search size={18} />
          </button>

          {/* Mobile Hamburger Toggle (Visible < 900px) */}
          <button 
            className="icon-btn mobile-toggle-btn" 
            onClick={toggleMobileMenu} 
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (< 900px) */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-nav-item">
            <span>Live scores</span>
            <ChevronDown size={16} />
          </div>
          <div className="mobile-nav-item">
            <span>Network</span>
            <ChevronDown size={16} />
          </div>
          <div className="mobile-nav-item">
            <span>Add ons</span>
            <ChevronDown size={16} />
          </div>
          <div className="mobile-nav-item">
            <span>More</span>
            <ChevronDown size={16} />
          </div>
          <a href="#store" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Store</a>
          <a href="#jobs" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Jobs</a>
          <a href="#contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact us</a>
        </div>
      )}
    </header>
  );
};
