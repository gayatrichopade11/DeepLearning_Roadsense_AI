import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Info,
  Cpu
} from 'lucide-react';

export default function About() {
  const targetClasses = [
    {
      name: 'Asphalt',
      category: 'Healthy Condition',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      image: '/images/asphalt_sample.jpg',
      description: 'Represents properly compacted, smooth bituminous road surface without significant structural distress or rutting. Serves as our baseline benchmark for high-quality highway quality.',
      features: ['Uniform bituminous matrix', 'Clear lane line visibility', 'High structural skid resistance']
    },
    {
      name: 'Crack',
      category: 'Early/Moderate Damage',
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      image: '/images/crack_sample.jpg',
      description: 'Encompasses longitudinal, transverse, block, and alligator (fatigue) fissures resulting from repetitive vehicular load stress, thermal fluctuations, and base layer moisture intrusion.',
      features: ['Alligator & block pattern fatigue', 'Water infiltration vulnerability', 'Precursor to severe potholes']
    },
    {
      name: 'Pothole',
      category: 'Severe Hazard',
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      image: '/images/pothole_sample.jpg',
      description: 'Severe structural bowl-shaped depression in the pavement surface exposing underlying sub-base gravel. Presents imminent mechanical damage risks to vehicles and safety hazards to drivers.',
      features: ['Deep void & sub-base gravel loss', 'Vehicle suspension & tire risk', 'Requires emergency patching']
    },
  ];

  const workflowStages = [
    { step: '01', title: 'Historical Road Dataset', desc: 'Curated repository of road defect imagery with ground-truth bounding box annotations.' },
    { step: '02', title: 'Data Preprocessing', desc: 'Resizing, contrast normalization, brightness jitter, and bounding box coordinate scaling.' },
    { step: '03', title: 'Deep Learning Training', desc: 'Backpropagation through convolutional layers optimizing intersection-over-union (IoU) loss.' },
    { step: '04', title: 'Trained Model', desc: 'Exported lightweight model weights ready for high-throughput inference.' },
    { step: '05', title: 'New Real-World Road Image', desc: 'Fresh road photography captured from inspection vehicles or local colony road testing.' },
    { step: '06', title: 'AI Prediction', desc: 'Bounding box localization and multi-class probability scoring on the novel image.' },
    { step: '07', title: 'Road Condition Analysis', desc: 'Severity index rating (Good, Damaged) delivered to civil engineering maintenance teams.' },
  ];

  return (
    <div className="py-12 lg:py-16 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-blue/10 border border-cyber-blue/30 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Info className="w-3.5 h-3.5" />
            PROJECT OVERVIEW
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            About RoadSense AI
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            RoadSense AI is a deep-learning based road condition analysis and damage prediction project designed to automate highway safety inspection using computer vision.
          </p>
        </div>

        {/* Civil Engineering Context & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 glass-panel p-8 rounded-2xl border border-slate-700/80 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Transforming Roadway Inspection with Computer Vision
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Traditional pavement condition assessments rely heavily on manual human surveys, which are slow, labor-intensive, subjective, and hazardous for workers on active highways.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong>RoadSense AI</strong> introduces an automated approach using computer vision and deep learning architectures. By ingesting visual inputs from dashboard cameras, drones, or smartphones, the system accurately classifies road surfaces and localizes defects with sub-second turnaround times.
            </p>

            {/* Local / Colony Roads Testing Note */}
            <div className="p-4 rounded-xl bg-navy-900 border border-cyber-cyan/30 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-300">
                <strong className="text-white">Field Testing Methodology:</strong> Real-world road photographs can be captured directly from local and colony roads, residential lanes, and arterial highways for evaluation, ensuring the model generalizes well across diverse asphalt conditions, illumination, and weathering patterns.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-mono font-black text-cyber-cyan">3</div>
              <div className="text-sm font-bold text-white mt-1">Core Target Classes</div>
              <div className="text-xs text-slate-400 mt-1">Asphalt, Crack, Pothole</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-mono font-black text-blue-400">&gt;94%</div>
              <div className="text-sm font-bold text-white mt-1">Validation Precision</div>
              <div className="text-xs text-slate-400 mt-1">Deep Learning Benchmark</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-mono font-black text-emerald-400">100%</div>
              <div className="text-sm font-bold text-white mt-1">Automated Pipeline</div>
              <div className="text-xs text-slate-400 mt-1">Zero Manual Labor</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-mono font-black text-amber-400">Civil</div>
              <div className="text-sm font-bold text-white mt-1">Infrastructure Focus</div>
              <div className="text-xs text-slate-400 mt-1">Smart City Ready</div>
            </div>
          </div>
        </div>

        {/* Target Classes Cards */}
        <div className="space-y-6 mb-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Target Classification Classes
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Our neural network is specialized to differentiate between pristine road surfaces and structural damage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {targetClasses.map((item, idx) => (
              <div key={idx} className={`glass-panel rounded-2xl border ${item.color} overflow-hidden flex flex-col justify-between`}>
                <div>
                  <div className="relative h-48 overflow-hidden bg-navy-950">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${item.tagColor}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-2xl font-black text-white">
                      {item.name}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2">
                      <div className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Key Indicators:
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {item.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-navy-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>CLASS ID: 0{idx}</span>
                  <span className="text-cyber-cyan">TRAINED WEIGHTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Workflow Breakdown */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-700/80 space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Cpu className="w-3.5 h-3.5" />
              SYSTEM LIFE CYCLE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Complete Project Workflow
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              The foundational process from training on historical roadway data to real-time road condition analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 relative">
            {workflowStages.map((stage, sIdx) => (
              <div 
                key={sIdx}
                className="bg-navy-900/80 p-5 rounded-xl border border-slate-800 flex flex-col justify-between text-left group hover:border-cyber-cyan/50 transition-all"
              >
                <div>
                  <span className="font-mono text-xl font-bold text-cyber-cyan">
                    {stage.step}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2 mb-1 group-hover:text-cyber-cyan transition-colors">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                {sIdx < workflowStages.length - 1 && (
                  <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-end text-slate-500 group-hover:text-cyber-cyan transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center pt-8">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>Test the Analysis Demo</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
