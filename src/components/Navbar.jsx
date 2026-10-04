import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Scan, 
  Menu, 
  X, 
  LogIn, 
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analyze', path: '/analyze' },
    { name: 'Live Capture', path: '/live-capture' },
    { name: 'Contact', path: '/contact' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-navy-950/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-cyber-blue via-cyber-cyan to-cyber-glow p-0.5 shadow-glow-cyan flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Scan className="w-6 h-6 text-cyber-cyan animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  RoadSense
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 rounded-md">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 -mt-0.5 tracking-wider">
                DEEP VISION PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/25 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Right Action: Login */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-200 hover:text-white bg-navy-850 hover:bg-navy-750 border border-slate-700/70 transition-all hover:border-slate-600"
            >
              <LogIn className="w-4 h-4 text-cyber-cyan" />
              <span>Login</span>
            </Link>

            <Link
              to="/analyze"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Analyze Road</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-cyber-cyan"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 space-y-2 bg-navy-950/95 border-b border-slate-800 backdrop-blur-2xl">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'text-cyber-cyan bg-cyber-cyan/15 border border-cyber-cyan/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-center text-sm font-semibold rounded-lg text-slate-200 bg-navy-850 border border-slate-700 hover:bg-navy-750"
            >
              <LogIn className="w-4 h-4 text-cyber-cyan" />
              <span>Login</span>
            </Link>
            <Link
              to="/analyze"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-center text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-cyber-blue to-cyan-500 shadow-glow-cyan"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Analyze Road</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
