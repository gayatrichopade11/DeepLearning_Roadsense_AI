import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Scan, 
  Info,
  Ruler,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { CALIBRATION_DISCLAIMER } from '../utils/measurementSchema';

export default function SampleAnalysis() {
  const [activeSample, setActiveSample] = useState('pothole');

  const samples = {
    pothole: {
      image: '/images/pothole_sample.jpg',
      title: 'Pothole & Surface Rupture',
      detectedClass: 'POTHOLE',
      confidence: '94.7%',
      secondaryClass: 'CRACK',
      secondaryConfidence: '91.2%',
      condition: 'Damaged',
      severity: 'Critical Hazard',
      conditionColor: 'rose',
      safetyStatus: 'UNSAFE',
      safetyReason: 'A significant pothole was detected.',
      safetyRecommendation: 'Drive with caution and prioritize the damaged section for inspection and maintenance.',
      description: 'Visible road damage detected in this sample image. Deep asphalt depression with aggregate loss and peripheral structural fatigue cracking.',
      measurements: [
        { label: 'LENGTH', value: '48 cm' },
        { label: 'WIDTH', value: '31 cm' },
        { label: 'ESTIMATED AREA', value: '0.149 m²' }
      ],
      boxes: [
        {
          id: 1,
          label: 'POTHOLE 94.7%',
          top: '38%',
          left: '21%',
          width: '54%',
          height: '42%',
          color: 'border-rose-500 bg-rose-500/15',
          labelBg: 'bg-rose-600',
        },
        {
          id: 2,
          label: 'CRACK 91.2%',
          top: '32%',
          left: '42%',
          width: '28%',
          height: '18%',
          color: 'border-cyber-cyan bg-cyber-cyan/15',
          labelBg: 'bg-cyber-cyan text-navy-950',
        }
      ]
    },
    crack: {
      image: '/images/crack_sample.jpg',
      title: 'Severe Alligator Cracking',
      detectedClass: 'CRACK',
      confidence: '95.4%',
      secondaryClass: 'SURFACE WEAR',
      secondaryConfidence: '88.1%',
      condition: 'Damaged',
      severity: 'Moderate Hazard',
      conditionColor: 'amber',
      safetyStatus: 'CAUTION',
      safetyReason: 'A road crack was detected.',
      safetyRecommendation: 'Inspect the affected road section and consider maintenance.',
      description: 'Extensive interconnecting polygonal cracking pattern indicative of base layer fatigue failure and water infiltration risk.',
      measurements: [
        { label: 'CRACK LENGTH', value: '1.84 m' },
        { label: 'AVERAGE CRACK WIDTH', value: '3.2 cm' },
        { label: 'AFFECTED AREA', value: '0.059 m²' }
      ],
      boxes: [
        {
          id: 1,
          label: 'CRACK 95.4%',
          top: '12%',
          left: '18%',
          width: '64%',
          height: '75%',
          color: 'border-amber-500 bg-amber-500/15',
          labelBg: 'bg-amber-600',
        }
      ]
    },
    asphalt: {
      image: '/images/asphalt_sample.jpg',
      title: 'Optimal Bituminous Asphalt',
      detectedClass: 'ASPHALT',
      confidence: '98.2%',
      secondaryClass: 'MARKING',
      secondaryConfidence: '96.5%',
      condition: 'Good',
      severity: 'Normal / Healthy',
      conditionColor: 'emerald',
      safetyStatus: 'SAFE',
      safetyReason: 'No significant visible damage detected in the analyzed sample.',
      safetyRecommendation: 'Maintain routine highway monitoring schedule.',
      surfaceCondition: 'Normal Road Surface',
      description: 'Smooth, uniformly compacted asphalt roadway. No hazardous potholes, longitudinal ruts, or structural fissures detected.',
      measurements: null, // No damage measurement for normal asphalt
      boxes: [
        {
          id: 1,
          label: 'ASPHALT 98.2%',
          top: '55%',
          left: '15%',
          width: '70%',
          height: '38%',
          color: 'border-emerald-500 bg-emerald-500/15',
          labelBg: 'bg-emerald-600',
        }
      ]
    }
  };

  const current = samples[activeSample];

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Scan className="w-3.5 h-3.5" />
              DEMO ANALYSIS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Sample Road Analysis
            </h2>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl">
              Inspect model prediction visual bounding boxes and condition ratings on pre-analyzed benchmark road samples.
            </p>
          </div>

          {/* Interactive Benchmark Tabs */}
          <div className="flex items-center gap-2 bg-navy-900/90 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveSample('pothole')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSample === 'pothole'
                  ? 'bg-cyber-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pothole Sample
            </button>
            <button
              onClick={() => setActiveSample('crack')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSample === 'crack'
                  ? 'bg-cyber-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crack Sample
            </button>
            <button
              onClick={() => setActiveSample('asphalt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSample === 'asphalt'
                  ? 'bg-cyber-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Healthy Asphalt
            </button>
          </div>
        </div>

        {/* Dashboard Analysis Card */}
        <div className="rounded-2xl glass-panel p-4 sm:p-6 lg:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          
          {/* Top Notice Banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-navy-900/80 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Info className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
              <span>
                <strong className="text-white">NOTICE:</strong> This is a frontend demo analysis. Model predictions shown below are illustrative representations.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              SAMPLE: {activeSample.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Annotated Road Image with Bounding Boxes */}
            <div className="lg:col-span-7">
              <div className="relative rounded-xl overflow-hidden bg-navy-950 border border-slate-700 aspect-[16/10] sm:aspect-[16/9] shadow-inner group">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Laser scanline overlay */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-80 animate-scan pointer-events-none" />

                {/* Render bounding boxes */}
                {current.boxes.map((box) => (
                  <div
                    key={box.id}
                    className={`absolute border-2 ${box.color} rounded-sm pointer-events-none transition-all duration-300`}
                    style={{
                      top: box.top,
                      left: box.left,
                      width: box.width,
                      height: box.height,
                    }}
                  >
                    <div className="bbox-corner-tl" />
                    <div className="bbox-corner-tr" />
                    <div className="bbox-corner-bl" />
                    <div className="bbox-corner-br" />

                    <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded font-mono font-bold text-[11px] shadow-lg ${box.labelBg}`}>
                      {box.label}
                    </div>
                  </div>
                ))}

                {/* Top Corner Badge */}
                <div className="absolute top-3 right-3 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-cyber-cyan border border-cyber-cyan/30">
                  CV-INFERENCE OK
                </div>
              </div>
            </div>

            {/* Right: Inspection Diagnostics Panel */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Overall Condition Warning Card */}
              <div className={`p-5 rounded-xl border ${
                current.condition === 'Damaged'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-emerald-950/20 border-emerald-500/40'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Overall Road Condition
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      {current.condition === 'Damaged' ? (
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      )}
                      <h3 className={`text-2xl font-black ${
                        current.condition === 'Damaged' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {current.condition}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                    current.condition === 'Damaged'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {current.severity}
                  </span>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {current.description}
                </p>
              </div>

              {/* Detections Breakdown */}
              <div className="space-y-3 bg-navy-900/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Detection Confidence Scores
                </span>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-white font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        {current.detectedClass}
                      </span>
                      <span className="text-cyber-cyan font-bold">{current.confidence}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-blue to-cyber-cyan rounded-full transition-all duration-500"
                        style={{ width: current.confidence }}
                      />
                    </div>
                  </div>

                  {current.secondaryClass && (
                    <div className="pt-2">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyber-cyan" />
                          {current.secondaryClass}
                        </span>
                        <span className="text-slate-300 font-bold">{current.secondaryConfidence}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-600 rounded-full transition-all duration-500"
                          style={{ width: current.secondaryConfidence }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Damage Measurements Section */}
              <div className="space-y-3 bg-navy-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-cyber-cyan" />
                    Damage Measurements
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DEMO DATA
                  </span>
                </div>

                {current.measurements ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      {current.measurements.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-navy-950/80 border border-slate-800 text-center">
                          <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">{m.label}</div>
                          <div className="text-sm font-mono font-black text-white mt-1">{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 bg-navy-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-1.5">
                      <Info className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{CALIBRATION_DISCLAIMER}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Surface Condition:</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">Normal Road Surface</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      No damage measurements shown for normal asphalt.
                    </p>
                  </div>
                )}
              </div>

              {/* Road Safety Assessment Badge */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                current.safetyStatus === 'UNSAFE'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : current.safetyStatus === 'CAUTION'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-emerald-950/20 border-emerald-500/40'
              }`}>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Road Safety Assessment</div>
                  <div className={`text-lg font-mono font-black mt-0.5 ${
                    current.safetyStatus === 'UNSAFE'
                      ? 'text-rose-400'
                      : current.safetyStatus === 'CAUTION'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {current.safetyStatus}
                  </div>
                  <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                    {current.safetyReason}
                  </div>
                </div>

                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  current.safetyStatus === 'UNSAFE'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : current.safetyStatus === 'CAUTION'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  {current.safetyStatus === 'SAFE' ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Telemetry info */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
                <div className="p-3 bg-navy-950/60 rounded-lg border border-slate-800/80">
                  <div className="text-slate-400 text-[10px]">INFERENCE TIME</div>
                  <div className="text-white font-bold text-sm mt-0.5">38.4 ms</div>
                </div>
                <div className="p-3 bg-navy-950/60 rounded-lg border border-slate-800/80">
                  <div className="text-slate-400 text-[10px]">RESOLUTIONS</div>
                  <div className="text-white font-bold text-sm mt-0.5">1920 x 1080</div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
