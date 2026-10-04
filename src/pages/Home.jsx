import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import SampleAnalysis from '../components/SampleAnalysis';
import { 
  BrainCircuit, 
  AlertOctagon, 
  Video, 
  Building2, 
  ArrowRight, 
  Camera, 
  Layers, 
  Sliders, 
  Cpu, 
  Search, 
  CheckCircle,
  FileCheck2
} from 'lucide-react';

export default function Home() {
  const homeFeatures = [
    {
      icon: BrainCircuit,
      title: 'Deep Learning Detection',
      description: 'Convolutional neural networks trained to localize surface anomalies, identifying subtle fissures before major road failure.',
      badge: 'YOLO / CNN',
      color: 'cyan',
    },
    {
      icon: AlertOctagon,
      title: 'Road Damage Analysis',
      description: 'Accurate classification of road damage into pothole, crack, and healthy asphalt categories with high confidence ratings.',
      badge: 'Multi-Class',
      color: 'blue',
    },
    {
      icon: Video,
      title: 'Live Road Analysis',
      description: 'Supports real-time dashcam and camera feeds from inspection vehicles for continuous road health monitoring.',
      badge: 'Real-Time',
      color: 'emerald',
    },
    {
      icon: Building2,
      title: 'Smart Infrastructure',
      description: 'Data-driven insights for civil engineering departments to prioritize highway repairs and optimize maintenance budgets.',
      badge: 'Civil Asset',
      color: 'amber',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Road Image',
      desc: 'High-res input capture from dashcams, smartphones, or survey drones.',
      icon: Camera,
    },
    {
      step: '02',
      title: 'Image Preprocessing',
      desc: 'Noise removal, normalization, resizing to 640x640, and contrast enhancement.',
      icon: Sliders,
    },
    {
      step: '03',
      title: 'Deep Learning Model',
      desc: 'Feature extraction through deep neural layers with bounding box anchors.',
      icon: Cpu,
    },
    {
      step: '04',
      title: 'Damage Detection',
      desc: 'Classification into Pothole, Crack, or Asphalt with confidence scoring.',
      icon: Search,
    },
    {
      step: '05',
      title: 'Road Condition Result',
      desc: 'Actionable severity rating (Good / Moderate / Damaged) and maintenance report.',
      icon: FileCheck2,
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Core Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyber-blue/10 border border-cyber-blue/30 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Layers className="w-3.5 h-3.5" />
            CORE CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Smarter Analysis for Better Infrastructure
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            RoadSense AI combines road imagery and deep learning concepts to support automated road-condition analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {homeFeatures.map((feat, idx) => (
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
      </section>

      {/* 3. Sample Road Analysis Component */}
      <SampleAnalysis />

      {/* 4. Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Cpu className="w-3.5 h-3.5" />
            INSPECTION PIPELINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            End-to-End AI Workflow
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            How RoadSense AI processes visual data from raw highway frame to civil repair assessment.
          </p>
        </div>

        {/* Workflow Steps with connecting lines */}
        <div className="relative">
          {/* Horizontal connection line on desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-cyber-blue via-cyber-cyan to-emerald-400 -translate-y-6 opacity-30 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            {workflowSteps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={idx}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyber-cyan/40 transition-all duration-300 transform hover:-translate-y-1 relative flex flex-col justify-between group"
                >
                  <div>
                    {/* Step Number Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-2xl font-black bg-gradient-to-br from-cyber-cyan to-cyber-blue bg-clip-text text-transparent">
                        {step.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-navy-850 border border-slate-700/80 flex items-center justify-center text-cyber-cyan group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>

                  {/* Flow Arrow indicator */}
                  {idx < workflowSteps.length - 1 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end text-slate-500 group-hover:text-cyber-cyan transition-colors text-xs font-mono">
                      <span>NEXT STEP</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  )}
                  {idx === workflowSteps.length - 1 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end text-emerald-400 text-xs font-mono">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      <span>COMPLETE</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Pre-Footer Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-cyber-cyan/30 shadow-glow-cyan">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyber-cyan/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyber-blue/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold tracking-widest text-cyber-cyan uppercase block mb-2">
                READY TO TEST ROAD CONDITIONS?
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Try Automated Road Damage Detection Now
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base">
                Upload a roadway photograph or capture a live image to preview computer-vision bounding boxes and severity metrics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/analyze"
                className="px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5 text-center"
              >
                Launch Image Analysis
              </Link>
              <Link
                to="/live-capture"
                className="px-7 py-3.5 rounded-xl font-semibold text-base text-slate-200 hover:text-white bg-navy-800 hover:bg-navy-750 border border-slate-700 transition-all text-center"
              >
                Live Camera Capture
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
