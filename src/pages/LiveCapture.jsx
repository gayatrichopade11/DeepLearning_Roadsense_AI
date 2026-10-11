import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  SwitchCamera,
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
  Ruler,
  CheckCircle2,
  ServerCrash
} from 'lucide-react';
import { 
  CALIBRATION_DISCLAIMER, 
  SAFETY_LOGIC_DISCLAIMER
} from '../utils/measurementSchema';
import { API_ENDPOINTS, getApiBaseUrl } from '../utils/apiConfig';

export default function LiveCapture() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'video'
  const [isDemoMode, setIsDemoMode] = useState(false); // Default to Real Live AI Model
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // Prefer rear camera by default on mobile
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedVideoName, setUploadedVideoName] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [inferenceError, setInferenceError] = useState(null);
  const [realDetections, setRealDetections] = useState(null);
  const [frameDims, setFrameDims] = useState({ width: 1280, height: 720 });
  const [activeInspectionTarget, setActiveInspectionTarget] = useState('Pothole'); // For demo target or selection
  const [activeDetectionIndex, setActiveDetectionIndex] = useState(0);
  const [showCalibratedPreview, setShowCalibratedPreview] = useState(false);

  const videoRef = useRef(null);
  const uploadedVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoInputRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Enumerate connected video input devices
  const enumerateVideoDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      return videoInputs;
    } catch (err) {
      console.warn('Unable to enumerate video devices:', err);
      return [];
    }
  }, []);

  // Initialize or switch camera feed via getUserMedia
  const startCamera = useCallback(async (targetDeviceId = null, targetFacingMode = null) => {
    setCameraError(null);
    setIsSwitchingCamera(true);

    // Stop existing stream first to release hardware lock
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) is not supported in this browser.');
      }

      // Configure video constraints
      let constraints;
      if (targetDeviceId) {
        constraints = {
          video: {
            deviceId: { exact: targetDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
      } else {
        const mode = targetFacingMode || facingMode || 'environment';
        constraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        // Fallback for devices that reject specific resolution or exact deviceId constraints
        console.warn('Preferred camera constraints failed, attempting fallback:', constraintErr);
        if (targetDeviceId) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: targetDeviceId },
            audio: false
          });
        } else {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacingMode || 'environment' },
            audio: false
          });
        }
      }

      streamRef.current = mediaStream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.warn('Video auto-play warning:', e));
      }

      // Read active track metadata
      const activeTrack = mediaStream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = typeof activeTrack.getSettings === 'function' ? activeTrack.getSettings() : {};
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
        if (settings.facingMode) {
          setFacingMode(settings.facingMode);
        } else if (targetFacingMode) {
          setFacingMode(targetFacingMode);
        }
      }

      // Re-enumerate to get full device labels (now that permission is granted)
      await enumerateVideoDevices();

    } catch (err) {
      console.warn('Camera access issue:', err);
      let userMsg = 'Camera access is unavailable. You can upload a road image or video instead.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg = 'Camera permission was denied. Please allow camera access in your browser settings to use live inspection.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg = 'No camera device found on this system. You can upload a road image or video instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg = 'Camera is currently in use by another application. Please close other camera apps and retry.';
      } else if (err.name === 'OverconstrainedError') {
        userMsg = 'Camera constraint could not be satisfied. Retrying with basic settings...';
      }
      setCameraError(userMsg);
      setIsCameraActive(false);
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [facingMode, enumerateVideoDevices]);

  // Handle switching between front and rear cameras (or cycling available cameras)
  const handleSwitchCamera = useCallback(async () => {
    if (isSwitchingCamera) return;

    if (videoDevices.length > 1) {
      // Find current device and cycle to the next
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % videoDevices.length : 0;
      const nextDevice = videoDevices[nextIndex];

      const label = (nextDevice.label || '').toLowerCase();
      let nextMode = facingMode === 'environment' ? 'user' : 'environment';
      if (label.includes('front') || label.includes('user')) nextMode = 'user';
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) nextMode = 'environment';

      await startCamera(nextDevice.deviceId, nextMode);
    } else {
      // On mobile devices where facingMode controls front/back lens
      const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextFacingMode);
      await startCamera(null, nextFacingMode);
    }
  }, [isSwitchingCamera, videoDevices, selectedDeviceId, facingMode, startCamera]);

  // Handle direct camera device selection from dropdown
  const handleCameraSelect = useCallback(async (deviceId) => {
    if (!deviceId || deviceId === selectedDeviceId || isSwitchingCamera) return;
    const target = videoDevices.find((d) => d.deviceId === deviceId);
    let targetMode = facingMode;
    if (target) {
      const lbl = (target.label || '').toLowerCase();
      if (lbl.includes('front') || lbl.includes('user')) targetMode = 'user';
      if (lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment')) targetMode = 'environment';
    }
    await startCamera(deviceId, targetMode);
  }, [selectedDeviceId, isSwitchingCamera, videoDevices, facingMode, startCamera]);

  useEffect(() => {
    let active = true;

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      active = false;
      stopCamera();
    };
  }, [activeTab]);

  // Periodic real-time frame inference loop when detection is active
  useEffect(() => {
    if (!isDetecting || isDemoMode) return;

    let isSubscribed = true;
    const intervalId = setInterval(async () => {
      if (isProcessingRef.current) return;
      const video = activeTab === 'camera' ? videoRef.current : uploadedVideoRef.current;
      if (!video || video.readyState < 2) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      isProcessingRef.current = true;
      setIsInferring(true);

      try {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;
        setFrameDims({ width: w, height: h });
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);

        canvas.toBlob(async (blob) => {
          if (!blob || !isSubscribed) {
            isProcessingRef.current = false;
            setIsInferring(false);
            return;
          }

          try {
            const formData = new FormData();
            formData.append('file', blob, 'live_frame.jpg');

            const API_URL = API_ENDPOINTS.ANALYZE_FRAME();
            const response = await fetch(API_URL, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (isSubscribed) {
              setRealDetections(data);
              setInferenceError(null);
              if (data.detections && data.detections.length > 0) {
                setActiveInspectionTarget(data.detections[0].class_name);
              }
            }
          } catch (err) {
            if (isSubscribed) {
              console.warn('Real-time frame inference error:', err);
              setInferenceError(err.message || 'Failed to fetch');
            }
          } finally {
            isProcessingRef.current = false;
            if (isSubscribed) setIsInferring(false);
          }
        }, 'image/jpeg', 0.85);

      } catch (err) {
        console.warn('Frame polling loop error:', err);
        isProcessingRef.current = false;
        setIsInferring(false);
      }
    }, 1800);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [isDetecting, isDemoMode, activeTab]);

  // Capture frame to canvas & perform single-frame inference
  const capturePhoto = async () => {
    setIsCapturing(true);
    const video = activeTab === 'camera' ? videoRef.current : uploadedVideoRef.current;
    const canvas = canvasRef.current;

    let photoDataUrl = null;
    let w = 1280;
    let h = 720;

    if (video && canvas && video.readyState >= 2) {
      w = video.videoWidth || 1280;
      h = video.videoHeight || 720;
      canvas.width = w;
      canvas.height = h;
      setFrameDims({ width: w, height: h });
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataUrl);
    } else {
      photoDataUrl = '/images/crack_sample.jpg';
      setCapturedPhoto(photoDataUrl);
      setFrameDims({ width: 640, height: 480 });
    }

    if (!isDemoMode) {
      try {
        setIsInferring(true);
        const resBlob = await fetch(photoDataUrl);
        const blob = await resBlob.blob();
        const formData = new FormData();
        formData.append('file', blob, 'live_frame.jpg');

        const API_URL = API_ENDPOINTS.ANALYZE_FRAME();
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const frameData = await response.json();
        setRealDetections(frameData);
        setInferenceError(null);
        if (frameData.detections && frameData.detections.length > 0) {
          setActiveInspectionTarget(frameData.detections[0].class_name);
          setActiveDetectionIndex(0);
        }
      } catch (err) {
        console.warn('Live frame backend inference error:', err);
        setInferenceError(err.message || 'ML backend unreachable');
      } finally {
        setIsInferring(false);
        setIsCapturing(false);
      }
    } else {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setRealDetections(null);
    setInferenceError(null);
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
    setInferenceError(null);
    setIsDetecting(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = API_ENDPOINTS.ANALYZE_VIDEO();
      await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.warn('Video endpoint notification error:', err);
    }
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  // Helper to extract real detected items
  const activeDetectionsList = realDetections?.detections || [];
  const hasRealDetections = activeDetectionsList.length > 0;
  const currentSelectedDetection = activeDetectionsList[activeDetectionIndex] || activeDetectionsList[0] || null;

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

        {/* Demo Mode Notice Banner (Visible only when Demo Mode is explicitly engaged) */}
        {isDemoMode && (
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/50 bg-amber-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                <strong>DEMO BENCHMARK MODE ACTIVE:</strong> Rendering synthetic multi-defect detection data for UI verification.
              </span>
            </div>
            <button
              onClick={() => { setIsDemoMode(false); setInferenceError(null); }}
              className="px-3.5 py-1.5 rounded-lg bg-cyber-blue hover:bg-blue-600 text-white font-bold transition-all shadow-glow-blue whitespace-nowrap"
            >
              Switch to Live AI Model
            </button>
          </div>
        )}

        {/* Hidden Canvas for Photo Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Input Mode Switch & Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Mode Selector Tabs (Camera vs Video) */}
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

          {/* Engine Mode Toggle: Real Model Inference vs Demo Mode */}
          <div className="flex items-center gap-1.5 bg-navy-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setIsDemoMode(false); setInferenceError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                !isDemoMode 
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${!isDemoMode ? 'bg-cyber-cyan animate-pulse' : 'bg-slate-500'}`} />
              <span>Live AI Model</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsDemoMode(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                isDemoMode 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-slate-500'}`} />
              <span>Demo Mode</span>
            </button>
          </div>

          {/* Action Buttons: Start/Stop Detection, Switch Camera & Capture */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Camera Switch Controls (Only on Camera tab when not viewing captured photo) */}
            {activeTab === 'camera' && !capturedPhoto && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Switch Camera Button */}
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  disabled={isSwitchingCamera || !isCameraActive}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-navy-850 hover:bg-navy-750 text-slate-200 border border-slate-700 hover:border-cyber-cyan/50 shadow-sm transition-all disabled:opacity-50"
                  title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Rear Camera'}
                >
                  <SwitchCamera className={`w-3.5 h-3.5 text-cyber-cyan ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                  <span>Switch Camera</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-950 text-cyber-cyan border border-cyber-cyan/30 uppercase font-semibold">
                    {facingMode === 'environment' ? 'Rear' : 'Front'}
                  </span>
                </button>

                {/* Multiple Cameras Dropdown (For laptops/desktops with multiple webcams) */}
                {videoDevices.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-navy-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                    <Camera className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => handleCameraSelect(e.target.value)}
                      disabled={isSwitchingCamera}
                      className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                      aria-label="Select camera device"
                    >
                      {videoDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-navy-900 text-slate-200">
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

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
              disabled={isCapturing || isInferring}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all disabled:opacity-50"
            >
              {isInferring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Photo</span>
                </>
              )}
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
              
              {/* Dedicated Detection Overlay Viewport */}
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
                        {cameraError}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-cyber-blue text-white shadow-glow-blue flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedPhoto('/images/crack_sample.jpg');
                            setFrameDims({ width: 640, height: 480 });
                          }}
                          className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-navy-800 text-slate-200 border border-slate-700"
                        >
                          Load Sample Frame
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
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* In-Viewport Quick Flip Camera Button */}
                      {!capturedPhoto && isCameraActive && (
                        <button
                          type="button"
                          onClick={handleSwitchCamera}
                          disabled={isSwitchingCamera}
                          className="absolute top-12 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-950/85 backdrop-blur-md border border-slate-700/80 hover:border-cyber-cyan/60 text-slate-200 text-xs font-mono transition-all shadow-lg active:scale-95 hover:bg-navy-900"
                          title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Rear Camera'}
                        >
                          <SwitchCamera className={`w-3.5 h-3.5 text-cyber-cyan ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
                        </button>
                      )}
                    </>
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

                {/* BOUNDING BOX OVERLAYS */}
                {isDemoMode ? (
                  /* DEMO OVERLAYS: Strictly displayed ONLY in Demo Mode */
                  isDetecting && (
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
                          POTHOLE 94.7% (DEMO)
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
                          CRACK 91.2% (DEMO)
                        </div>
                      </div>

                      {/* Bounding Box 3: Asphalt Reference */}
                      <div 
                        className="absolute border border-emerald-500/70 bg-emerald-500/10 rounded-sm pointer-events-none transition-all duration-300"
                        style={{ top: '65%', left: '15%', width: '70%', height: '28%' }}
                      >
                        <div className="absolute bottom-1 right-2 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-emerald-700/80 text-white whitespace-nowrap">
                          ASPHALT BASE 96.4% (DEMO)
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  /* REAL MODEL BOUNDING BOXES: Rendered ONLY when actual coordinates are returned */
                  (isDetecting || capturedPhoto) && hasRealDetections && (
                    <>
                      {activeDetectionsList.map((det, idx) => {
                        const [x1, y1, x2, y2] = det.bbox;
                        const fw = frameDims.width || 1280;
                        const fh = frameDims.height || 720;
                        const top = `${((y1 / fh) * 100).toFixed(2)}%`;
                        const left = `${((x1 / fw) * 100).toFixed(2)}%`;
                        const width = `${(((x2 - x1) / fw) * 100).toFixed(2)}%`;
                        const height = `${(((y2 - y1) / fh) * 100).toFixed(2)}%`;

                        const isPothole = det.class_name === 'Pothole';
                        const isCrack = det.class_name === 'Crack';
                        const borderColor = isPothole ? 'border-rose-500' : isCrack ? 'border-cyber-cyan' : 'border-emerald-400';
                        const bgColor = isPothole ? 'bg-rose-500/15' : isCrack ? 'bg-cyber-cyan/15' : 'bg-emerald-500/15';
                        const badgeBg = isPothole ? 'bg-rose-600 text-white' : isCrack ? 'bg-cyber-cyan text-navy-950' : 'bg-emerald-500 text-navy-950';

                        return (
                          <div
                            key={idx}
                            className={`absolute border-2 ${borderColor} ${bgColor} rounded-sm pointer-events-none transition-all duration-200`}
                            style={{ top, left, width, height }}
                          >
                            <div className="bbox-corner-tl" />
                            <div className="bbox-corner-tr" />
                            <div className="bbox-corner-bl" />
                            <div className="bbox-corner-br" />
                            <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${badgeBg} shadow-lg whitespace-nowrap`}>
                              {det.class_name.toUpperCase()} {(det.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )
                )}

                {/* HUD Telemetry Top Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none">
                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
                    <span className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-emerald-400' : 'bg-rose-500'} animate-pulse`} />
                    <span>OPTICAL FEED: {capturedPhoto ? 'STILL FRAME' : activeTab === 'video' ? (uploadedVideoName || 'VIDEO STREAM') : isCameraActive ? `LIVE CAMERA (${facingMode === 'environment' ? 'REAR' : 'FRONT'})` : 'CAMERA STANDBY'}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyber-cyan/40 text-cyber-cyan">
                    <Crosshair className="w-3 h-3" />
                    <span>STATUS: {isInferring ? 'INFERENCE ACTIVE...' : isDetecting ? 'STREAMING INFERENCE' : 'STANDBY'}</span>
                  </div>
                </div>

                {/* Bottom Status Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-navy-950/80 border border-slate-700 text-slate-300">
                    YOLO BOUNDING BOX OVERLAY LAYER
                  </span>
                  
                  {isDemoMode ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      DEMO DATA
                    </span>
                  ) : inferenceError ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      INFERENCE UNAVAILABLE
                    </span>
                  ) : hasRealDetections ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {activeDetectionsList.length} DAMAGE DETECTION(S)
                    </span>
                  ) : (isDetecting || capturedPhoto) ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      NO DAMAGE DETECTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      STANDBY
                    </span>
                  )}
                </div>

              </div>

              {/* Viewport Bottom Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span>FRAME RESOLUTION:</span>
                  <span className="text-white font-bold">{frameDims.width} x {frameDims.height} px</span>
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
                {isDemoMode ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DEMO DATA
                  </span>
                ) : inferenceError ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    UNAVAILABLE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    LIVE MODEL
                  </span>
                )}
              </div>

              {/* Real vs Demo Detection Selector */}
              {isDemoMode ? (
                /* Demo Mode Buttons */
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
                      <span>STATUS: BENCHMARK TARGET</span>
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
                      <span>STATUS: BENCHMARK TARGET</span>
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
              ) : (
                /* Real AI Inference Flow: Strictly displays ONLY real model detections */
                <div className="space-y-3 font-mono text-xs">
                  {inferenceError ? (
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-2">
                      <ServerCrash className="w-8 h-8 text-rose-400 mx-auto" />
                      <div className="text-sm font-bold text-rose-300">Inference Unavailable</div>
                      <p className="text-xs text-slate-400 font-sans">
                        Backend unreachable at {getApiBaseUrl()}. Check server status or CORS configuration.
                      </p>
                      <div className="text-[10px] text-rose-400 font-mono pt-1">
                        {inferenceError}
                      </div>
                    </div>
                  ) : hasRealDetections ? (
                    activeDetectionsList.map((det, idx) => {
                      const isSelected = activeDetectionIndex === idx;
                      const isPothole = det.class_name === 'Pothole';
                      const isCrack = det.class_name === 'Crack';
                      const pct = (det.confidence * 100).toFixed(1);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveDetectionIndex(idx);
                            setActiveInspectionTarget(det.class_name);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? isPothole 
                                ? 'bg-rose-950/40 border-rose-500/80 shadow-glow-cyan' 
                                : 'bg-cyan-950/40 border-cyan-500/80 shadow-glow-cyan'
                              : 'bg-navy-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                isPothole ? 'bg-rose-500' : isCrack ? 'bg-cyan-400' : 'bg-emerald-400'
                              }`} />
                              {det.class_name} #{idx + 1}
                            </span>
                            <span className={`font-black text-sm ${
                              isPothole ? 'text-rose-400' : isCrack ? 'text-cyan-400' : 'text-emerald-400'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isPothole ? 'bg-rose-500' : isCrack ? 'bg-cyan-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                            <span>BBOX: [{det.bbox.map(n => Math.round(n)).join(', ')}]</span>
                            <span className={`font-bold ${
                              isPothole ? 'text-rose-400' : isCrack ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {isPothole ? 'CRITICAL' : isCrack ? 'MODERATE' : 'OPTIMAL'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (isDetecting || capturedPhoto) ? (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No Damage Detected</div>
                      <p className="text-xs text-slate-400 font-sans">
                        YOLO inference analyzed the current frame. No distresses (potholes or cracks) detected above the confidence threshold.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 text-[10px] border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Clear Road Pavement
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-center space-y-2">
                      <Radio className="w-7 h-7 text-cyber-cyan mx-auto animate-pulse" />
                      <div className="text-sm font-bold text-white">Inference Standby</div>
                      <p className="text-xs text-slate-400 font-sans">
                        Click "Start Detection" to stream live camera frames or "Capture Photo" for instant inspection.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. DAMAGE MEASUREMENTS PANEL */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyber-cyan" />
                  Damage Measurements
                </h3>
                {isDemoMode ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {showCalibratedPreview ? 'CALIBRATED DEMO' : 'UNCALIBRATED'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    REAL TENSOR PIXELS
                  </span>
                )}
              </div>

              {isDemoMode ? (
                /* Demo Measurement Controls & Cards */
                <>
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

                  <div className="p-4 rounded-2xl border bg-navy-900/90 border-slate-800 space-y-3 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm text-white">{activeInspectionTarget}</span>
                      <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        {activeInspectionTarget === 'Pothole' ? 'Confidence: 95.2%' : 'Confidence: 91.7%'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase text-slate-400">Length</div>
                        <div className="text-base font-black text-white mt-0.5">
                          {showCalibratedPreview ? (activeInspectionTarget === 'Pothole' ? '48 cm' : '1.84 m') : '--'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase text-slate-400">Width</div>
                        <div className="text-base font-black text-cyber-cyan mt-0.5">
                          {showCalibratedPreview ? (activeInspectionTarget === 'Pothole' ? '31 cm' : '3.2 cm') : '--'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase text-slate-400">Area</div>
                        <div className="text-base font-black text-amber-300 mt-0.5">
                          {showCalibratedPreview ? (activeInspectionTarget === 'Pothole' ? '0.149 m²' : '0.059 m²') : '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Real Measurement Flow: Pixel tensor metrics from model coordinates */
                currentSelectedDetection ? (
                  <div className="p-4 rounded-2xl border bg-navy-900/90 border-slate-800 space-y-3 font-mono">
                    {(() => {
                      const [x1, y1, x2, y2] = currentSelectedDetection.bbox;
                      const w = Math.round(Math.max(0, x2 - x1));
                      const h = Math.round(Math.max(0, y2 - y1));
                      const area = w * h;
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="font-black text-sm text-white">
                              {currentSelectedDetection.class_name} #{activeDetectionIndex + 1}
                            </span>
                            <span className="text-xs text-cyber-cyan bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                              Confidence: {(currentSelectedDetection.confidence * 100).toFixed(1)}%
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase text-slate-400">Width</div>
                              <div className="text-base font-black text-white mt-0.5">{w} px</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase text-slate-400">Height</div>
                              <div className="text-base font-black text-cyber-cyan mt-0.5">{h} px</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase text-slate-400">Area</div>
                              <div className="text-base font-black text-amber-300 mt-0.5">{area.toLocaleString()} px²</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border bg-navy-950/80 border-slate-800 text-center text-xs font-mono text-slate-400">
                    No active defect detected in frame.
                  </div>
                )
              )}

              {/* Calibration Notice Label */}
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{CALIBRATION_DISCLAIMER}</span>
              </div>
            </div>

            {/* 3. ROAD SAFETY ASSESSMENT PANEL */}
            {(() => {
              let status = 'SAFE';
              let reason = 'No damage detected in the current optical stream.';
              let recommendation = 'Maintain routine roadway inspection.';
              let badgeColor = 'emerald';

              if (isDemoMode) {
                const isPothole = activeInspectionTarget === 'Pothole';
                const isCrack = activeInspectionTarget === 'Crack';
                status = isPothole ? 'UNSAFE' : isCrack ? 'CAUTION' : 'SAFE';
                reason = isPothole 
                  ? 'A significant pothole was detected in demo benchmark.'
                  : isCrack 
                  ? 'A road crack was detected in demo benchmark.'
                  : 'No significant visible damage detected in the analyzed sample.';
                recommendation = isPothole
                  ? 'Drive with caution and prioritize the damaged section for maintenance.'
                  : isCrack
                  ? 'Inspect the affected road section and consider maintenance.'
                  : 'Maintain routine highway monitoring schedule.';
                badgeColor = isPothole ? 'rose' : isCrack ? 'amber' : 'emerald';
              } else {
                if (inferenceError) {
                  status = 'UNAVAILABLE';
                  reason = 'ML backend service is unreachable.';
                  recommendation = 'Check FastAPI backend status at the configured endpoint.';
                  badgeColor = 'rose';
                } else if (!hasRealDetections && !isDetecting && !capturedPhoto) {
                  status = 'STANDBY';
                  reason = 'Awaiting camera stream or frame capture.';
                  recommendation = 'Activate detection to start evaluation.';
                  badgeColor = 'slate';
                } else if (!hasRealDetections) {
                  status = 'SAFE';
                  reason = 'No damage detected by the active YOLO model.';
                  recommendation = 'Road condition optimal. Maintain routine highway monitoring schedule.';
                  badgeColor = 'emerald';
                } else {
                  const hasPothole = activeDetectionsList.some(d => d.class_name === 'Pothole');
                  const hasCrack = activeDetectionsList.some(d => d.class_name === 'Crack');

                  if (hasPothole) {
                    const topPothole = activeDetectionsList.find(d => d.class_name === 'Pothole');
                    status = 'UNSAFE';
                    reason = `Pothole defect detected with ${(topPothole.confidence * 100).toFixed(1)}% confidence.`;
                    recommendation = 'Drive with caution and prioritize damaged section for road repairs.';
                    badgeColor = 'rose';
                  } else if (hasCrack) {
                    const topCrack = activeDetectionsList.find(d => d.class_name === 'Crack');
                    status = 'CAUTION';
                    reason = `Pavement crack detected with ${(topCrack.confidence * 100).toFixed(1)}% confidence.`;
                    recommendation = 'Inspect affected section and schedule preventative maintenance.';
                    badgeColor = 'amber';
                  } else {
                    status = 'SAFE';
                    reason = 'Road patch detected. Surface repaired with no open cavity.';
                    recommendation = 'Periodic inspection to confirm patch durability.';
                    badgeColor = 'emerald';
                  }
                }
              }

              const styleMap = {
                rose: {
                  panel: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
                  badge: 'bg-rose-500/25 border-rose-500/50 text-rose-300',
                  icon: ShieldAlert,
                },
                amber: {
                  panel: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
                  badge: 'bg-amber-500/25 border-amber-500/50 text-amber-300',
                  icon: AlertTriangle,
                },
                emerald: {
                  panel: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
                  badge: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300',
                  icon: ShieldCheck,
                },
                slate: {
                  panel: 'border-slate-700 bg-navy-950/40 text-slate-400',
                  badge: 'bg-slate-800 border-slate-700 text-slate-300',
                  icon: Info,
                },
              }[badgeColor];

              const Icon = styleMap.icon;

              return (
                <div className={`glass-panel p-6 rounded-3xl border ${styleMap.panel} space-y-4 relative overflow-hidden transition-all duration-300`}>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      ROAD SAFETY ASSESSMENT
                    </span>
                    {isDemoMode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        DEMO DATA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-blue/20 text-blue-300 border border-cyber-blue/40">
                        LIVE EVALUATION
                      </span>
                    )}
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

            {/* Live Model Pipeline Telemetry */}
            <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Backend Inference Endpoint</span>
              </div>
              <div className="text-[10px] text-cyber-cyan font-mono bg-navy-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div>URL: <code>{getApiBaseUrl()}</code></div>
                <div>FRAME ENDPOINT: <code>POST /api/analyze/frame</code></div>
                <div>ACTIVE MODEL: <code>ml/models/best_clean_303.pt</code></div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
