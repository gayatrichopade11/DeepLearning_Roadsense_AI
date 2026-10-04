import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Eye, 
  Radio, 
  AlertTriangle, 
  Crosshair
} from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyber-blue/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyber-cyan/15 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-850/90 border border-cyber-cyan/30 text-cyber-cyan text-xs font-semibold tracking-wider uppercase shadow-inner-glow backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
              </span>
              AI + COMPUTER VISION + SAFER ROADS
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              AI-Based Road Condition Analysis and Damage Prediction Using{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyber-cyan to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
                Deep Learning
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Detect road damage, analyze road conditions and support smarter road maintenance using deep learning and computer vision.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/analyze"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-cyber-blue via-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-blue transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 text-white" />
                <span>Analyze Road</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                to="/how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-base text-slate-200 hover:text-white bg-navy-850/80 hover:bg-navy-750 border border-slate-700/80 transition-all hover:border-cyber-cyan/40"
              >
                <Cpu className="w-4 h-4 text-cyber-cyan" />
                <span>Explore System</span>
              </Link>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-2xl font-bold text-white font-mono">3 Classes</div>
                <div className="text-xs text-slate-400">Asphalt, Pothole, Crack</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyber-cyan font-mono">&gt;94%</div>
                <div className="text-xs text-slate-400">Sample Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">&lt;50ms</div>
                <div className="text-xs text-slate-400">Target Latency</div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Vision Hero Viewport */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl p-2 bg-gradient-to-b from-cyber-cyan/30 via-slate-800/40 to-slate-900/60 border border-slate-700/60 shadow-2xl backdrop-blur-sm">
              
              {/* Image Container with Vision Overlays */}
              <div className="relative overflow-hidden rounded-xl bg-navy-950 aspect-[16/10] sm:aspect-[16/9]">
                <img
                  src="/images/road_hero.jpg"
                  alt="AI Computer Vision Road Inspection Sample"
                  className="w-full h-full object-cover select-none"
                  loading="eager"
                />

                {/* Dark scan tint overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/40 pointer-events-none" />

                {/* Futuristic Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent shadow-[0_0_15px_#00f0ff] animate-scan pointer-events-none" />

                {/* Top HUD Telemetry Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono font-medium pointer-events-none">
                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyber-cyan/40 text-cyber-cyan shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
                    </span>
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>AI VISION DEMO OVERLAY</span>
                  </div>

                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700 text-slate-300">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>30 FPS | RGB</span>
                  </div>
                </div>

                {/* DEMO Bounding Box 1: POTHOLE */}
                <div 
                  className="absolute border-2 border-rose-500 bg-rose-500/15 rounded-sm pointer-events-none transition-all duration-300"
                  style={{ top: '42%', left: '23%', width: '19%', height: '17%' }}
                >
                  <div className="bbox-corner-tl" style={{ borderColor: '#f43f5e' }} />
                  <div className="bbox-corner-tr" style={{ borderColor: '#f43f5e' }} />
                  <div className="bbox-corner-bl" style={{ borderColor: '#f43f5e' }} />
                  <div className="bbox-corner-br" style={{ borderColor: '#f43f5e' }} />
                  
                  {/* Bounding Box Label */}
                  <div className="absolute -top-6 left-0 flex items-center gap-1 bg-rose-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>POTHOLE 94.7%</span>
                  </div>
                </div>

                {/* DEMO Bounding Box 2: CRACK */}
                <div 
                  className="absolute border-2 border-cyber-cyan bg-cyber-cyan/15 rounded-sm pointer-events-none transition-all duration-300"
                  style={{ top: '35%', left: '38%', width: '27%', height: '32%' }}
                >
                  <div className="bbox-corner-tl" />
                  <div className="bbox-corner-tr" />
                  <div className="bbox-corner-bl" />
                  <div className="bbox-corner-br" />
                  
                  {/* Bounding Box Label */}
                  <div className="absolute -top-6 left-0 flex items-center gap-1 bg-cyber-cyan text-navy-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                    <Crosshair className="w-2.5 h-2.5" />
                    <span>CRACK 91.2%</span>
                  </div>
                </div>

                {/* Bottom HUD Legend & Status */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="bg-navy-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-slate-700/80 text-[10px] font-mono text-slate-300">
                    <span className="text-slate-400">ROAD CONDITION: </span>
                    <span className="text-cyber-amber font-bold">DAMAGED (HIGH HAZARD)</span>
                  </div>

                  <div className="bg-navy-950/85 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/80 text-[10px] font-mono text-slate-400 hidden sm:block">
                    FRONTEND PREVIEW ONLY
                  </div>
                </div>

              </div>

              {/* Card Footer Micro-Note */}
              <div className="mt-2.5 px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"></span>
                  Computer Vision HUD Simulation
                </span>
                <span className="text-slate-400">Deep Learning Model v1.0</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
