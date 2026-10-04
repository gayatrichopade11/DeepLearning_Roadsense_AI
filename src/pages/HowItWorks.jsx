import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Sliders, 
  BrainCircuit, 
  Camera, 
  Scan, 
  FileCheck2, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  CheckCircle2
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Dataset Collection',
      subtitle: 'Gathering Annotated Roadway Imagery',
      icon: Database,
      tag: 'Data Ingestion',
      description: 'Comprehensive road surface datasets are assembled from camera survey rigs, mobile captures on local colony roads, and public pavement benchmarks. Each image is systematically tagged with ground-truth bounding box coordinates and classification labels for Asphalt, Crack, and Pothole.',
      details: [
        'Multi-angle captures under varying daylight and shadow conditions',
        'Annotation format standardized to normalized coordinates (x, y, w, h)',
        'Class balance optimization across pristine and degraded pavement samples'
      ]
    },
    {
      number: '02',
      title: 'Image Preprocessing',
      subtitle: 'Data Standardization & Augmentation',
      icon: Sliders,
      tag: 'Image Processing',
      description: 'Raw road images undergo algorithmic conditioning before neural network ingestion. Pixel intensities are normalized, images are resized to uniform square tensors (e.g. 640x640), and synthetic data augmentation techniques expand model resilience.',
      details: [
        'Resizing, bilinear interpolation, and zero-padding aspect ratios',
        'Augmentation: Mosaic cropping, horizontal flips, contrast adjustment',
        'RGB color channel normalization for faster gradient descent convergence'
      ]
    },
    {
      number: '03',
      title: 'Model Training',
      subtitle: 'Deep Convolutional Architecture',
      icon: BrainCircuit,
      tag: 'Neural Optimization',
      description: 'The deep learning model (such as a YOLO / CNN object detection architecture) is trained across multiple epochs. Convolutional layers extract spatial textures, base aggregates, and pavement fractures, while loss functions optimize bounding box regression and class probability.',
      details: [
        'Backpropagation utilizing stochastic gradient descent with momentum',
        'Multi-scale feature pyramid networks (FPN) for detecting small cracks',
        'Intersection over Union (IoU) and binary cross-entropy loss tracking'
      ]
    },
    {
      number: '04',
      title: 'New Road Image',
      subtitle: 'Capturing Target Road Conditions',
      icon: Camera,
      tag: 'Field Input',
      description: 'During active deployment, field inspectors capture real-world road imagery via smartphone uploads, vehicle dashcams, or our integrated live camera capture interface. The image represents the unannotated roadway waiting for diagnostic evaluation.',
      details: [
        'Support for JPEG, JPG, and PNG image compression formats',
        'Zero specialized hardware required — runs on everyday camera feeds',
        'Immediate client-side caching and preview rendering'
      ]
    },
    {
      number: '05',
      title: 'AI Prediction',
      subtitle: 'Sub-Second Inference & Localization',
      icon: Scan,
      tag: 'Inference Engine',
      description: 'The trained model passes the novel road image through its feedforward network. Anchor boxes detect candidate defect regions, non-maximum suppression (NMS) filters overlapping boxes, and confidence thresholds produce finalized bounding box coordinates.',
      details: [
        'Simultaneous multi-object detection across the pavement canvas',
        'Calculated confidence scores assigned to every predicted class',
        'Tight bounding boxes around surface depressions and fissures'
      ]
    },
    {
      number: '06',
      title: 'Result & Analysis',
      subtitle: 'Civil Health Index & Actionable Report',
      icon: FileCheck2,
      tag: 'Condition Synthesis',
      description: 'Predicted defect detections are synthesized into an overall road condition rating (Good or Damaged). The system generates visual overlays and metric summaries that civil engineers can leverage to dispatch maintenance crews and allocate repair budgets.',
      details: [
        'Automated categorization: Good (Safe) vs Damaged (Hazardous)',
        'Immediate visual inspection report with bounding box tags',
        'Data readiness for municipal road maintenance logging'
      ]
    }
  ];

  return (
    <div className="py-12 lg:py-16 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Cpu className="w-3.5 h-3.5" />
            METHODOLOGY & ARCHITECTURE
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            How RoadSense AI Operates
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            Follow the six sequential phases that power our automated deep learning road damage prediction and pavement health classification pipeline.
          </p>
        </div>

        {/* Six Large Steps */}
        <div className="space-y-8 relative">
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div 
                key={idx}
                className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 hover:border-cyber-cyan/40 transition-all duration-300 shadow-xl relative overflow-hidden group"
              >
                {/* Background watermarked step number */}
                <div className="absolute -top-6 right-6 font-mono font-black text-7xl sm:text-9xl text-slate-800/30 select-none pointer-events-none group-hover:text-cyber-cyan/10 transition-colors">
                  {step.number}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                  
                  {/* Left: Step Identifier & Icon */}
                  <div className="lg:col-span-4 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyber-blue to-cyber-cyan p-0.5 shadow-glow-cyan flex-shrink-0 flex items-center justify-center">
                      <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                        <IconComp className="w-7 h-7 text-cyber-cyan group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 mb-1.5">
                        {step.tag}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-slate-100">
                        {step.title}
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Detailed Description & Technical Specifications */}
                  <div className="lg:col-span-8 space-y-4">
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {step.description}
                    </p>

                    <div className="bg-navy-900/80 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Technical Execution Points:
                      </div>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                        {step.details.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Progress bar at bottom of each card */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>STAGE {idx + 1} OF 6</span>
                  <span className="text-cyber-cyan">
                    {idx === 5 ? 'PIPELINE ENDPOINT' : 'PROCEEDING TO NEXT STAGE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Launch CTA */}
        <div className="text-center pt-8">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>Experience the Pipeline on Your Road Image</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
