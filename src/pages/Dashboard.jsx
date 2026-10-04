import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  PieChart, 
  ShieldAlert, 
  Layers, 
  Info,
  Ruler,
  X
} from 'lucide-react';
import ResultCard from '../components/ResultCard';
import { DEMO_MEASUREMENTS } from '../utils/measurementSchema';

export default function Dashboard() {
  const [filter, setFilter] = useState('All');
  const [inspectModalItem, setInspectModalItem] = useState(null);

  const stats = [
    { label: 'Total Images Analyzed', value: 124, icon: Layers, change: '+12 today', color: 'blue' },
    { label: 'Damage Detected', value: 78, icon: AlertTriangle, change: '62.9% defect rate', color: 'rose' },
    { label: 'Potholes', value: 42, icon: ShieldAlert, change: 'Requires fast patch', color: 'amber' },
    { label: 'Cracks', value: 36, icon: Activity, change: 'Base fatigue signs', color: 'cyan' },
  ];

  const recentAnalyses = [
    {
      id: 'AN-9842',
      imageName: 'road_01.jpg',
      imageThumb: '/images/pothole_sample.jpg',
      detection: 'Pothole',
      confidence: '94.7%',
      condition: 'Damaged',
      date: '19 Sep 2026',
      status: 'Detected',
      location: 'Sector 4 North Arterial',
      severity: 'Critical',
      measurementsText: '48 × 31 cm (0.149 m²)',
      measurementDetails: DEMO_MEASUREMENTS.Pothole
    },
    {
      id: 'AN-9841',
      imageName: 'road_02.jpg',
      imageThumb: '/images/crack_sample.jpg',
      detection: 'Crack',
      confidence: '91.2%',
      condition: 'Damaged',
      date: '19 Sep 2026',
      status: 'Detected',
      location: 'Colony Ring Road Link',
      severity: 'Moderate',
      measurementsText: '1.84 m × 3.2 cm (0.059 m²)',
      measurementDetails: DEMO_MEASUREMENTS.Crack
    },
    {
      id: 'AN-9840',
      imageName: 'road_03.jpg',
      imageThumb: '/images/asphalt_sample.jpg',
      detection: 'Asphalt',
      confidence: '96.4%',
      condition: 'Good',
      date: '18 Sep 2026',
      status: 'Analyzed',
      location: 'Expressway Flyover Lane 2',
      severity: 'Normal',
      measurementsText: 'Normal Surface (No Damage)',
      measurementDetails: DEMO_MEASUREMENTS.Asphalt
    },
    {
      id: 'AN-9839',
      imageName: 'road_04.jpg',
      imageThumb: '/images/road_hero.jpg',
      detection: 'Pothole',
      confidence: '92.8%',
      condition: 'Damaged',
      date: '18 Sep 2026',
      status: 'Detected',
      location: 'Main Bypass Mile 14',
      severity: 'Critical',
      measurementsText: '44 × 28 cm (0.123 m²)',
      measurementDetails: DEMO_MEASUREMENTS.Pothole
    },
    {
      id: 'AN-9838',
      imageName: 'road_05.jpg',
      imageThumb: '/images/asphalt_sample.jpg',
      detection: 'Asphalt',
      confidence: '97.1%',
      condition: 'Good',
      date: '17 Sep 2026',
      status: 'Analyzed',
      location: 'Central Avenue Sector 9',
      severity: 'Normal',
      measurementsText: 'Normal Surface (No Damage)',
      measurementDetails: DEMO_MEASUREMENTS.Asphalt
    }
  ];

  const filteredData = filter === 'All' 
    ? recentAnalyses 
    : recentAnalyses.filter(item => item.condition === filter || item.detection === filter);

  return (
    <div className="py-12 lg:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              CIVIL ASSET MANAGEMENT
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Road Inspection Dashboard
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              Real-time statistical breakdown of highway pavement surveys and defect classifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* DEMO DATA Badge */}
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Info className="w-3.5 h-3.5" />
              DEMO DATA
            </span>

            <Link
              to="/analyze"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-navy-900 border border-slate-700 flex items-center justify-center text-cyber-cyan">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-white">
                    {item.value}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
                    <span>{item.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Breakdown Visual Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Defect Distribution Ratio */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyber-cyan" />
              Defect Distribution
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Potholes (53.8% of defects)</span>
                  <span className="text-rose-400 font-bold">42</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '53.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Cracks (46.2% of defects)</span>
                  <span className="text-cyan-400 font-bold">36</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '46.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Healthy Asphalt Surfaces</span>
                  <span className="text-emerald-400 font-bold">46</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '37.1%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] font-mono text-slate-400">
              * Based on 124 historical roadway benchmark evaluations
            </div>
          </div>

          {/* Maintenance Priority */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Maintenance Priority
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-400">High Priority (Potholes)</div>
                  <div className="text-[11px] text-slate-400">Immediate asphalt patch required</div>
                </div>
                <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                  28 Sites
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400">Medium Priority (Cracks)</div>
                  <div className="text-[11px] text-slate-400">Crack seal before monsoon rain</div>
                </div>
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                  19 Sites
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-400">Low / Routine Survey</div>
                  <div className="text-[11px] text-slate-400">Routine quarterly monitoring</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                  77 Sites
                </span>
              </div>
            </div>
          </div>

          {/* Model Health Status */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Inference Health
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-navy-900/80 border border-slate-800">
                <span className="text-slate-400">MODEL ARCHITECTURE</span>
                <span className="text-white font-bold">YOLOv8-Pavement</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-navy-900/80 border border-slate-800">
                <span className="text-slate-400">MEAN INFERENCE TIME</span>
                <span className="text-cyber-cyan font-bold">34.2 ms</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-navy-900/80 border border-slate-800">
                <span className="text-slate-400">MEAN AVERAGE PRECISION (mAP50)</span>
                <span className="text-emerald-400 font-bold">94.8%</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-navy-900/80 border border-slate-800">
                <span className="text-slate-400">BACKEND STATUS</span>
                <span className="text-amber-400 font-bold">Frontend Mode (Ready)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Analysis Table */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Recent Road Analyses</span>
                <span className="text-xs font-mono font-normal text-slate-400">({filteredData.length} records)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Chronological list of captured pavement frames and detection outcomes.
              </p>
            </div>

            {/* Filter Pill Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Damaged', 'Good', 'Pothole', 'Crack', 'Asphalt'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                    filter === f
                      ? 'bg-cyber-blue text-white shadow-glow-blue'
                      : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container with Horizontal Scroll support */}
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-6 sm:px-0">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead>
                  <tr className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <th scope="col" className="py-3.5 pr-3 pl-4 sm:pl-0">Image</th>
                    <th scope="col" className="px-3 py-3.5">Detection</th>
                    <th scope="col" className="px-3 py-3.5">Confidence</th>
                    <th scope="col" className="px-3 py-3.5">Damage Measurements</th>
                    <th scope="col" className="px-3 py-3.5">Condition</th>
                    <th scope="col" className="px-3 py-3.5">Date</th>
                    <th scope="col" className="px-3 py-3.5">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                  {filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-navy-900/50 transition-colors">
                      
                      {/* Image Thumbnail & Filename */}
                      <td className="whitespace-nowrap py-4 pr-3 pl-4 sm:pl-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.imageThumb}
                            alt={row.imageName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-navy-950 flex-shrink-0"
                          />
                          <div>
                            <div className="font-mono font-bold text-white text-xs">
                              {row.imageName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Detection Class */}
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold ${
                          row.detection === 'Pothole'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : row.detection === 'Crack'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {row.detection}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-cyber-cyan">
                        {row.confidence}
                      </td>

                      {/* Damage Measurements */}
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="font-mono text-xs text-slate-200 flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-cyber-cyan flex-shrink-0" />
                          <span>{row.measurementsText}</span>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          row.condition === 'Damaged'
                            ? 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                            : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                        }`}>
                          {row.condition === 'Damaged' ? (
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{row.condition}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-3 py-4 font-mono text-xs text-slate-300">
                        {row.date}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 bg-navy-900 border border-slate-700">
                          {row.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 sm:pr-0 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectModalItem(row)}
                          className="inline-flex items-center gap-1 text-xs font-mono text-cyber-cyan hover:text-cyan-300 transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Inspection Modal with ResultCard */}
      {inspectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-6 sm:p-8 border border-cyber-cyan/40 shadow-glow-cyan space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={inspectModalItem.imageThumb}
                  alt={inspectModalItem.imageName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{inspectModalItem.imageName}</span>
                    <span className="text-xs font-mono text-slate-400">({inspectModalItem.id})</span>
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    Location: {inspectModalItem.location} • {inspectModalItem.date}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="w-8 h-8 rounded-lg bg-navy-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ResultCard result={inspectModalItem.measurementDetails} showApiPayload={true} />

            <div className="pt-2 flex justify-end gap-3">
              <Link
                to="/analyze"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-cyber-blue hover:bg-blue-600 transition-all"
              >
                Open in Full Inference Terminal
              </Link>
              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-slate-300 bg-navy-900 border border-slate-700 hover:bg-navy-850 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
