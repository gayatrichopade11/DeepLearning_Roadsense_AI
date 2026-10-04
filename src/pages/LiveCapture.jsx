import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  RefreshCw, 
  UploadCloud, 
  AlertTriangle, 
  Radio, 
  Play, 
  Square, 
  ShieldAlert, 
  ShieldCheck,
  Sliders, 
  Info, 
  Film, 
  Crosshair,
  Ruler
} from 'lucide-react';
import { 
  CALIBRATION_DISCLAIMER, 
  SAFETY_LOGIC_DISCLAIMER 
} from '../utils/measurementSchema';

export default function LiveCapture() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'video'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedVideoName, setUploadedVideoName] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeInspectionTarget, setActiveInspectionTarget] = useState('Pothole'); // 'Pothole' | 'Crack' | 'Asphalt'
  const [showCalibratedPreview, setShowCalibratedPreview] = useState(false);

  const videoRef = useRef(null);
  const uploadedVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoInputRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Initialize camera feed via getUserMedia
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = mediaStream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access is unavailable. You can upload a road image or video instead.');
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (activeTab === 'camera') {
      const initStream = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not supported in this browser.');
          }

          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });

          if (!active) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = mediaStream;
          setIsCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          if (!active) return;
          console.warn('Camera access issue:', err);
          setCameraError('Camera access is unavailable. You can upload a road image or video instead.');
        }
      };

      initStream();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeTab]);

  const [realDetections, setRealDetections] = useState(null);

  // Capture frame to canvas
  const capturePhoto = async () => {
    setIsCapturing(true);
    const video = activeTab === 'camera' ? videoRef.current : uploadedVideoRef.current;
    const canvas = canvasRef.current;

    let photoDataUrl = null;
    if (video && canvas) {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      photoDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPhoto(photoDataUrl);
      setIsDetecting(true); // Automatically engage bounding box overlays on captured frame
    } else {
      // Fallback captured frame simulation if camera unavailable
      photoDataUrl = '/images/road_hero.jpg';
      setCapturedPhoto(photoDataUrl);
      setIsDetecting(true);
    }

    // Live frame inference request to FastAPI backend
    try {
      const resBlob = await fetch(photoDataUrl);
      const blob = await resBlob.blob();
      const formData = new FormData();
      formData.append('file', blob, 'live_frame.jpg');

      const API_URL = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/analyze/frame';
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const frameData = await response.json();
        setRealDetections(frameData);
        if (frameData.detections && frameData.detections.length > 0) {
          setActiveInspectionTarget(frameData.detections[0].class_name);
        }
      }
    } catch (err) {
      console.warn('Live frame backend inference error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setRealDetections(null);
    setIsDetecting(false);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setUploadedVideoName(file.name);
    setCapturedPhoto(null);
    setRealDetections(null);
    setIsDetecting(false);

    // Forward video metadata / file to FastAPI /api/analyze/video
    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/analyze/video';
      await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.warn('Video endpoint notification error:', err);
    }
  };

  // Toggle Live Detection State
  // =========================================================================
  // FUTURE INTEGRATION BOUNDARY:
  // TODO: Connect this UI to FastAPI + YOLO real-time detection
  //
  // The future architecture is:
  // React Frontend
  //   ↓
  // FastAPI
  //   ↓
  // YOLO Deep Learning Model
  //   ↓
  // Pothole / Crack / Asphalt Detection
  //   ↓
  // Confidence
  //   ↓
  // Road Safety Assessment
  //   ↓
  // React UI
  // =========================================================================
  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  return (
    <div className="py-12 lg:py-16 space-y-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            LIVE ROAD ANALYSIS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Real-Time Optical Inspection
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Continuous video feed analysis and automated damage localization designed for inspection vehicles and handheld roadway audits.
          </p>
        </div>

        {/* Hidden Canvas for Photo Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Input Mode Switch & Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 bg-navy-900/90 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('camera'); handleRetake(); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'camera'
                  ? 'bg-cyber-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera / Live Video</span>
            </button>
            <button
              onClick={() => { setActiveTab('video'); stopCamera(); handleRetake(); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-cyber-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          </div>

          {/* Action Buttons: Start/Stop Detection & Capture */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Start / Stop Detection Button */}
            <button
              type="button"
              onClick={toggleDetection}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                isDetecting
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm hover:bg-emerald-500/30'
              }`}
            >
              {isDetecting ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-rose-400" />
                  <span>Stop Detection</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Start Detection</span>
                </>
              )}
            </button>

            {/* Capture Photo Button */}
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isCapturing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Photo</span>
            </button>

            {/* Video File Trigger if on video tab */}
            {activeTab === 'video' && (
              <button
                type="button"
                onClick={() => videoInputRef.current && videoInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold text-slate-200 bg-navy-850 hover:bg-navy-750 border border-slate-700 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Select MP4/WebM</span>
              </button>
            )}

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4, video/webm"
              onChange={handleVideoUpload}
              className="hidden"
              aria-label="Upload roadway video"
            />
          </div>

        </div>

        {/* Main Optical Viewport & Detection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Viewport Card */}
          <div className="lg:col-span-8">
            <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-slate-700/80 shadow-2xl space-y-4">
              
              {/* Dedicated Detection Overlay Area designed for future YOLO bounding boxes */}
              <div className="relative rounded-2xl overflow-hidden bg-navy-950 border border-slate-700 aspect-[16/10] sm:aspect-[16/9] shadow-inner flex items-center justify-center">
                
                {/* 1. If Photo Captured */}
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured Roadway Frame"
                    className="w-full h-full object-cover"
                  />
                ) : activeTab === 'camera' ? (
                  /* 2. Live Camera View */
                  cameraError ? (
                    <div className="p-8 text-center max-w-md space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Camera Access Unavailable</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Camera access is unavailable. You can upload a road image or video instead, or use benchmark simulation below.
                      </p>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCapturedPhoto('/images/road_hero.jpg')}
                          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-cyber-blue text-white shadow-glow-blue"
                        >
                          Load Simulation Frame
                        </button>
                        <Link
                          to="/analyze"
                          className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-navy-800 text-slate-200 border border-slate-700"
                        >
                          Upload Image
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  /* 3. Uploaded Video View */
                  uploadedVideoUrl ? (
                    <video
                      ref={uploadedVideoRef}
                      src={uploadedVideoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-4">
                      <Film className="w-16 h-16 text-slate-600 mx-auto animate-pulse" />
                      <h3 className="text-lg font-bold text-white">No Video Loaded</h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Select an inspection video file (.mp4, .webm) or switch back to the live camera tab.
                      </p>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current && videoInputRef.current.click()}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-cyber-blue text-white shadow-glow-blue"
                      >
                        Choose Video File
                      </button>
                    </div>
                  )
                )}

                {/* Laser Scanning Line (when detection is active) */}
                {isDetecting && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent shadow-[0_0_20px_#00f0ff] animate-scan pointer-events-none" />
                )}

                {/* DEDICATED YOLO BOUNDING BOX DETECTION OVERLAYS */}
                {isDetecting && (
                  <>
                    {/* Bounding Box 1: Pothole */}
                    <div 
                      className="absolute border-2 border-rose-500 bg-rose-500/15 rounded-sm pointer-events-none transition-all duration-300"
                      style={{ top: '38%', left: '22%', width: '25%', height: '22%' }}
                    >
                      <div className="bbox-corner-tl" style={{ borderColor: '#f43f5e' }} />
                      <div className="bbox-corner-tr" style={{ borderColor: '#f43f5e' }} />
                      <div className="bbox-corner-bl" style={{ borderColor: '#f43f5e' }} />
                      <div className="bbox-corner-br" style={{ borderColor: '#f43f5e' }} />
                      <div className="absolute -top-6 left-0 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-600 text-white shadow-lg whitespace-nowrap">
                        POTHOLE 94.7%
                      </div>
                    </div>

                    {/* Bounding Box 2: Crack */}
                    <div 
                      className="absolute border-2 border-cyber-cyan bg-cyber-cyan/15 rounded-sm pointer-events-none transition-all duration-300"
                      style={{ top: '32%', left: '50%', width: '28%', height: '34%' }}
                    >
                      <div className="bbox-corner-tl" />
                      <div className="bbox-corner-tr" />
                      <div className="bbox-corner-bl" />
                      <div className="bbox-corner-br" />
                      <div className="absolute -top-6 left-0 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyber-cyan text-navy-950 shadow-lg whitespace-nowrap">
                        CRACK 91.2%
                      </div>
                    </div>

                    {/* Bounding Box 3: Asphalt Reference */}
                    <div 
                      className="absolute border border-emerald-500/70 bg-emerald-500/10 rounded-sm pointer-events-none transition-all duration-300"
                      style={{ top: '65%', left: '15%', width: '70%', height: '28%' }}
                    >
                      <div className="absolute bottom-1 right-2 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-emerald-700/80 text-white whitespace-nowrap">
                        ASPHALT BASE 96.4%
                      </div>
                    </div>
                  </>
                )}

                {/* HUD Telemetry Top Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none">
                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>OPTICAL FEED: {capturedPhoto ? 'STILL FRAME' : activeTab === 'video' ? (uploadedVideoName || 'VIDEO STREAM') : isCameraActive ? 'LIVE CAMERA STREAM' : 'CAMERA STANDBY'}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyber-cyan/40 text-cyber-cyan">
                    <Crosshair className="w-3 h-3" />
                    <span>STATUS: {isDetecting ? 'INFERENCE ACTIVE' : 'STANDBY'}</span>
                  </div>
                </div>

                {/* Bottom Status Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-navy-950/80 border border-slate-700 text-slate-300">
                    YOLO BOUNDING BOX OVERLAY LAYER
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    DEMO DATA
                  </span>
                </div>

              </div>

              {/* Viewport Bottom Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span>FRAME RESOLUTION:</span>
                  <span className="text-white font-bold">1280 x 720 px</span>
                </div>
                {capturedPhoto && (
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-200 border border-slate-700 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retake / Clear Frame</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Diagnostics & Road Safety Assessment Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Real-Time Detection Confidence & Target Selector */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyber-cyan" />
                  Live Detection Confidence
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO DATA
                </span>
              </div>

              {/* Interactive Target Class Selector */}
              <div className="space-y-2.5 font-mono text-xs">
                
                {/* Pothole — 95.2% */}
                <button
                  type="button"
                  onClick={() => setActiveInspectionTarget('Pothole')}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeInspectionTarget === 'Pothole'
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-glow-cyan'
                      : 'bg-navy-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Pothole
                    </span>
                    <span className="text-rose-400 font-black text-sm">95.2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: '95.2%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>STATUS: ACTIVE TARGET</span>
                    <span className="text-rose-400 font-bold">CRITICAL</span>
                  </div>
                </button>

                {/* Crack — 91.7% */}
                <button
                  type="button"
                  onClick={() => setActiveInspectionTarget('Crack')}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeInspectionTarget === 'Crack'
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-glow-cyan'
                      : 'bg-navy-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      Crack
                    </span>
                    <span className="text-cyan-400 font-black text-sm">91.7%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: '91.7%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>STATUS: DETECTED</span>
                    <span className="text-amber-400 font-bold">MODERATE</span>
                  </div>
                </button>

                {/* Asphalt — 96.4% */}
                <button
                  type="button"
                  onClick={() => setActiveInspectionTarget('Asphalt')}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeInspectionTarget === 'Asphalt'
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-glow-cyan'
                      : 'bg-navy-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Asphalt Base
                    </span>
                    <span className="text-emerald-400 font-black text-sm">96.4%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: '96.4%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>SURFACE: NORMAL</span>
                    <span className="text-emerald-400 font-bold">OPTIMAL</span>
                  </div>
                </button>

              </div>
            </div>

            {/* 2. LIVE DAMAGE MEASUREMENTS PANEL (CALIBRATION PENDING) */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyber-cyan" />
                  Damage Measurements
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {showCalibratedPreview ? 'CALIBRATED DEMO' : 'UNCALIBRATED'}
                </span>
              </div>

              {/* Mode Switcher Toggle */}
              <div className="flex items-center justify-between text-[11px] font-mono bg-navy-950/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Values Mode:</span>
                <button
                  type="button"
                  onClick={() => setShowCalibratedPreview(!showCalibratedPreview)}
                  className="px-2.5 py-1 rounded-lg bg-navy-850 hover:bg-navy-750 text-cyber-cyan border border-slate-700 hover:border-cyber-cyan/40 transition-all font-bold"
                >
                  {showCalibratedPreview ? 'Show Default Placeholder (--)' : 'Show Demo Values (cm/m)'}
                </button>
              </div>

              {/* Detection 1: Pothole (Confidence: 95.2%) */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeInspectionTarget === 'Pothole'
                  ? 'bg-navy-900/90 border-rose-500/40'
                  : 'bg-navy-950/60 border-slate-800/80'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-mono font-black text-sm text-white">Pothole</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                    Confidence: 95.2%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Length</div>
                    <div className="text-base font-mono font-black text-white mt-0.5">
                      {showCalibratedPreview ? '48 cm' : '--'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Width</div>
                    <div className="text-base font-mono font-black text-cyber-cyan mt-0.5">
                      {showCalibratedPreview ? '31 cm' : '--'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Area</div>
                    <div className="text-base font-mono font-black text-amber-300 mt-0.5">
                      {showCalibratedPreview ? '0.149 m²' : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detection 2: Crack (Confidence: 91.7%) */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeInspectionTarget === 'Crack'
                  ? 'bg-navy-900/90 border-amber-500/40'
                  : 'bg-navy-950/60 border-slate-800/80'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="font-mono font-black text-sm text-white">Crack</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    Confidence: 91.7%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Length</div>
                    <div className="text-base font-mono font-black text-white mt-0.5">
                      {showCalibratedPreview ? '1.84 m' : '--'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Average Width</div>
                    <div className="text-base font-mono font-black text-cyber-cyan mt-0.5">
                      {showCalibratedPreview ? '3.2 cm' : '--'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Area</div>
                    <div className="text-base font-mono font-black text-amber-300 mt-0.5">
                      {showCalibratedPreview ? '0.059 m²' : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calibration Notice Label */}
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{CALIBRATION_DISCLAIMER}</span>
              </div>

              {/* Future API Contract Structure Code Snippet */}
              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span>Prepared Future API Schema:</span>
                  <span className="text-cyber-cyan">Ready for YOLO</span>
                </div>
                <pre className="text-cyber-cyan overflow-x-auto">
{JSON.stringify(
  {
    length_cm: showCalibratedPreview ? 48 : null,
    width_cm: showCalibratedPreview ? 31 : null,
    area_cm2: showCalibratedPreview ? 1488 : null,
    measurement_method: "pixel"
  },
  null,
  2
)}
                </pre>
              </div>

            </div>

            {/* 3. ROAD SAFETY ASSESSMENT PANEL */}
            {(() => {
              const isPotholeTarget = activeInspectionTarget === 'Pothole';
              const isCrackTarget = activeInspectionTarget === 'Crack';

              const status = isPotholeTarget ? 'UNSAFE' : isCrackTarget ? 'CAUTION' : 'SAFE';
              const reason = isPotholeTarget 
                ? 'A significant pothole was detected.'
                : isCrackTarget 
                ? 'A road crack was detected.'
                : 'No significant visible damage detected in the analyzed sample.';
              const recommendation = isPotholeTarget
                ? 'Drive with caution and prioritize the damaged section for inspection and maintenance.'
                : isCrackTarget
                ? 'Inspect the affected road section and consider maintenance.'
                : 'Maintain routine highway monitoring schedule.';

              const styleMap = {
                UNSAFE: {
                  panel: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
                  badge: 'bg-rose-500/25 border-rose-500/50 text-rose-300',
                  icon: ShieldAlert,
                },
                CAUTION: {
                  panel: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
                  badge: 'bg-amber-500/25 border-amber-500/50 text-amber-300',
                  icon: AlertTriangle,
                },
                SAFE: {
                  panel: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
                  badge: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300',
                  icon: ShieldCheck,
                },
              }[status];

              const Icon = styleMap.icon;

              return (
                <div className={`glass-panel p-6 rounded-3xl border ${styleMap.panel} space-y-4 relative overflow-hidden transition-all duration-300`}>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      ROAD SAFETY ASSESSMENT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      DEMO DATA
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Assessment Status</div>
                      <div className="text-2xl font-black font-mono tracking-tight mt-0.5">
                        {status}
                      </div>
                    </div>
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${styleMap.badge}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-slate-300 uppercase">Reason:</div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans bg-navy-950/70 p-3 rounded-xl border border-slate-800">
                      {reason}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-slate-300 uppercase">Recommendation:</div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans bg-navy-950/70 p-3 rounded-xl border border-slate-800">
                      {recommendation}
                    </p>
                  </div>

                  {/* Non-misleading Notice */}
                  <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 text-center">
                    {SAFETY_LOGIC_DISCLAIMER}
                  </div>

                </div>
              );
            })()}

            {/* Clean Future Integration Boundary Note */}
            <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Backend Extension Architecture</span>
              </div>
              <div className="text-[11px] text-cyber-cyan font-mono bg-navy-950 p-2.5 rounded-lg border border-slate-800">
                <code>// TODO: Connect this UI to FastAPI + YOLO real-time detection</code>
              </div>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5 pt-1 bg-navy-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-300 font-semibold mb-1">Target Pipeline:</div>
                <div>React Frontend</div>
                <div className="text-cyber-cyan">↓</div>
                <div>FastAPI</div>
                <div className="text-cyber-cyan">↓</div>
                <div>YOLO Deep Learning Model</div>
                <div className="text-cyber-cyan">↓</div>
                <div>Pothole / Crack / Asphalt Detection</div>
                <div className="text-cyber-cyan">↓</div>
                <div>Confidence</div>
                <div className="text-cyber-cyan">↓</div>
                <div>Road Safety Assessment</div>
                <div className="text-cyber-cyan">↓</div>
                <div>React UI</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
