import React from 'react';

export default function FeatureCard({ icon: Icon, title, description, badge, color = 'cyan' }) {
  const colorMap = {
    cyan: {
      border: 'hover:border-cyber-cyan/50',
      glow: 'hover:shadow-glow-cyan',
      iconBg: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30',
      badge: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/30',
    },
    blue: {
      border: 'hover:border-cyber-blue/50',
      glow: 'hover:shadow-glow-blue',
      iconBg: 'bg-cyber-blue/10 text-blue-400 border-blue-500/30',
      badge: 'bg-cyber-blue/15 text-blue-400 border-blue-500/30',
    },
    emerald: {
      border: 'hover:border-emerald-500/50',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    amber: {
      border: 'hover:border-amber-500/50',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.35)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`group relative p-7 rounded-2xl glass-panel ${scheme.border} ${scheme.glow} transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden`}>
      {/* Subtle corner highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-30" />
      
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${scheme.iconBg} transition-transform group-hover:scale-110 shadow-sm`}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>
          {badge && (
            <span className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full border ${scheme.badge}`}>
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-slate-100 tracking-tight">
          {title}
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed font-normal">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"></span>
        <span>Deep Learning Architecture</span>
      </div>
    </div>
  );
}
