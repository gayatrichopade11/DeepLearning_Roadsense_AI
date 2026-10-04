import React from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { 
  GitCommit, 
  AlertTriangle, 
  CheckCircle, 
  Percent, 
  Camera, 
  Activity, 
  History, 
  LayoutDashboard, 
  Sparkles, 
  Cpu
} from 'lucide-react';

export default function Features() {
  const allFeatures = [
    {
      icon: GitCommit,
      title: 'Crack Detection',
      description: 'Pinpoints alligator, longitudinal, and transverse cracks with pixel-level bounding boxes to prevent moisture penetration.',
      badge: 'Fissure Localization',
      color: 'cyan',
    },
    {
      icon: AlertTriangle,
      title: 'Pothole Detection',
      description: 'Detects road voids and cavity depressions in the asphalt layer, estimating surface area hazard severity for rapid patching.',
      badge: 'Hazard Warning',
      color: 'amber',
    },
    {
      icon: CheckCircle,
      title: 'Asphalt Classification',
      description: 'Identifies uniform, healthy bitumen pavement to verify completed roadwork or newly laid highway stretches.',
      badge: 'Benchmark Surface',
      color: 'emerald',
    },
    {
      icon: Percent,
      title: 'Confidence Score',
      description: 'Outputs calibrated probability metrics for every detection, allowing engineers to filter out edge cases and noise.',
      badge: 'Probabilistic Metrics',
      color: 'blue',
    },
    {
      icon: Camera,
      title: 'Live Road Image Capture',
      description: 'Integrates device camera via HTML5 getUserMedia to capture instantaneous roadway images from survey vehicles.',
      badge: 'Hardware Sync',
      color: 'cyan',
    },
    {
      icon: Activity,
      title: 'Road Condition Analysis',
      description: 'Synthesizes detected defect classes into an overall road condition grade (Good / Moderate / Damaged) for decision makers.',
      badge: 'Severity Index',
      color: 'amber',
    },
    {
      icon: History,
      title: 'Analysis History',
      description: 'Maintains chronological inspection logs with timestamps, condition ratings, and defect frequencies for municipal reporting.',
      badge: 'Audit Trail',
      color: 'blue',
    },
    {
      icon: LayoutDashboard,
      title: 'AI Dashboard',
      description: 'Interactive management interface featuring damage ratios, defect distributions, and exportable civil engineering spreadsheets.',
      badge: 'Executive View',
      color: 'emerald',
    },
  ];

  return (
    <div className="py-12 lg:py-16 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Cpu className="w-3.5 h-3.5" />
            INTELLIGENT SYSTEM CAPABILITIES
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Advanced System Features
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            RoadSense AI unites deep learning computer vision, high-speed image processing, and civil engineering metrics into an integrated pavement evaluation suite.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allFeatures.map((feat, idx) => (
            <FeatureCard
              key={idx}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              badge={feat.badge}
              color={feat.color}
            />
          ))}
        </div>

        {/* Feature Highlights Banner */}
        <div className="mt-16 glass-panel rounded-3xl p-8 sm:p-12 border border-slate-700/80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-mono font-bold text-cyber-cyan uppercase tracking-wider block mb-2">
                BUILT FOR MUNICIPAL & HIGHWAY USE
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Engineered for Real-World Road Infrastructure
              </h3>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Whether assessing arterial expressways, residential colony streets, or regional transport corridors, RoadSense AI delivers reproducible, standardized defect classifications without requiring heavy, expensive specialized laser trucks.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                to="/analyze"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Try Analyzer</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-navy-850 hover:bg-navy-750 border border-slate-700 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-cyber-cyan" />
                <span>View Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
