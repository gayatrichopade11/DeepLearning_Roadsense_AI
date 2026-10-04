import React from 'react';
import { Link } from 'react-router-dom';
import { Scan, Globe, Code2, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-slate-800/80 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-blue to-cyber-cyan p-0.5 flex items-center justify-center shadow-glow-cyan">
                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                  <Scan className="w-5 h-5 text-cyber-cyan" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  RoadSense <span className="text-cyber-cyan">AI</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">CIVIL INFRASTRUCTURE VISION</span>
              </div>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              AI-powered road condition analysis for smarter infrastructure. Empowering municipal engineers and transport authorities with deep learning automated defect detection.
            </p>

            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 rounded-lg bg-navy-900 border border-slate-800 hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors" title="Repository">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="p-2 rounded-lg bg-navy-900 border border-slate-800 hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors" title="Global Network">
                <Globe className="w-4 h-4" />
              </div>
              <div className="p-2 rounded-lg bg-navy-900 border border-slate-800 hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors" title="Share System">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  About Project
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Tools */}
          <div>
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">
              AI Tools
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/analyze" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Analyze Road
                </Link>
              </li>
              <li>
                <Link to="/live-capture" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Live Camera Capture
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Analytics Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Civil Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Target Classes & Architecture */}
          <div>
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">
              Contact & Info
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-cyber-cyan transition-colors">
                  Contact Support
                </Link>
              </li>
              <li className="pt-2 text-xs font-mono text-slate-400">
                Department of Civil Engineering & Computer Science
              </li>
              <li className="text-xs font-mono text-slate-400">
                MDM Project Initiative
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © 2026 RoadSense AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Frontend Pipeline Online
            </span>
            <span className="hover:text-slate-300">Privacy Policy</span>
            <span className="hover:text-slate-300">System Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
