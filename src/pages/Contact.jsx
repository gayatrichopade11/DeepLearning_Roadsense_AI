import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  MapPin, 
  Building2, 
  CheckCircle2
} from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Civil Engineering / Pavement Management',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      department: 'Civil Engineering / Pavement Management',
      message: ''
    });
  };

  return (
    <div className="py-12 lg:py-20 space-y-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Mail className="w-3.5 h-3.5" />
            CONNECT WITH THE TEAM
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Contact RoadSense AI
          </h1>
          <p className="mt-3 text-slate-300 text-base leading-relaxed">
            Have questions about dataset integration, camera calibration, or deep learning model evaluation? Reach out to our project team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Contact Information & Project Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-7 sm:p-8 border border-slate-700/80 space-y-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Project Headquarters
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                RoadSense AI is developed as a computer vision research project focusing on civil engineering highway safety and municipal road asset preservation.
              </p>

              <div className="space-y-4 pt-2 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-cyber-cyan flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400">Department</div>
                    <div className="text-white font-medium">Civil Engineering & AI Labs</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-cyber-cyan flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400">Email Inquiry</div>
                    <div className="text-white font-medium">contact@roadsense.ai</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-cyber-cyan flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400">Testing Locations</div>
                    <div className="text-white font-medium">Urban Highways & Colony Roads</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-cyber-cyan font-bold">RESEARCH INITIATIVE:</span> Open for collaborative benchmark dataset contributions and municipal pilot demonstrations.
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-7 sm:p-10 border border-slate-700/80 shadow-2xl">
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-3 rounded-xl bg-navy-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex.morgan@city.gov"
                      className="w-full px-4 py-3 rounded-xl bg-navy-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Message / Project Note
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your inquiry, road survey dataset, or questions about model deployment..."
                      className="w-full px-4 py-3 rounded-xl bg-navy-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      Message Sent Successfully
                    </h3>
                    <p className="text-sm text-slate-300 max-w-md mx-auto">
                      Thank you for contacting RoadSense AI. In this frontend demonstration, your submission has been recorded.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-navy-850 hover:bg-navy-750 text-slate-200 border border-slate-700"
                  >
                    Send Another Message
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
