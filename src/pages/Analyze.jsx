import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, 
  Camera, 
  Trash2, 
  Sparkles, 
  Scan, 
  RefreshCw, 
  Sliders, 
  Info
} from 'lucide-react';
import ResultCard from '../components/ResultCard';
import { API_ENDPOINTS, getApiBaseUrl } from '../utils/apiConfig';

export default function Analyze() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.20);
  const fileInputRef = useRef(null);

  // Real representative benchmark presets from the project dataset
  const presetSamples = [
    { name: 'Pothole Sample', path: '/images/pothole_sample.jpg' },
    { name: 'Crack Sample', path: '/images/crack_sample.jpg' },
    { name: 'Road Patch Sample', path: '/images/asphalt_sample.jpg' },
  ];

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid JPG, JPEG, PNG, or WEBP image file.');
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null); // Clear previous analysis immediately

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setImageName(file.name);
      setAnalysisResult(null); // Ensure cleared on image load
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSelectPreset = (preset) => {
    setSelectedImage(preset.path);
    setImageName(preset.name);
    setSelectedFile(null);
    setAnalysisResult(null); // Clear previous analysis immediately
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setImageName('');
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =========================================================================
  // ANALYZE IMAGE FUNCTION (FASTAPI + YOLO INFERENCE)
  // Strictly real YOLO predictions, zero demo/mock substitutions
  // =========================================================================
  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let fileToSend = selectedFile;
      if (!fileToSend) {
        const res = await fetch(selectedImage);
        if (!res.ok) {
          throw new Error(`Failed to load preset image file (HTTP ${res.status})`);
        }
        const blob = await res.blob();
        let fileName = imageName || 'road_sample.jpg';
        if (!fileName.includes('.')) {
          fileName += '.jpg';
        }
        fileToSend = new File([blob], fileName, {
          type: blob.type || 'image/jpeg',
        });
      }

      const formData = new FormData();
      formData.append('file', fileToSend);

      const API_URL = API_ENDPOINTS.ANALYZE_IMAGE(confidenceThreshold);
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const apiData = await response.json();

      // Compute bounding box pixel coordinates to percentage overlays for ALL detections
      let boxes = [];
      if (apiData.detections && apiData.detections.length > 0) {
        const img = new Image();
        img.src = selectedImage;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        const natW = img.naturalWidth || 640;
        const natH = img.naturalHeight || 640;

        boxes = apiData.detections.map((det) => {
          const [x1, y1, x2, y2] = det.bbox;
          const labelName = (det.class_name || 'Damage').toUpperCase();
          return {
            top: `${((y1 / natH) * 100).toFixed(2)}%`,
            left: `${((x1 / natW) * 100).toFixed(2)}%`,
            width: `${(((x2 - x1) / natW) * 100).toFixed(2)}%`,
            height: `${(((y2 - y1) / natH) * 100).toFixed(2)}%`,
            label: `${labelName} ${(det.confidence * 100).toFixed(1)}%`,
            class_name: det.class_name,
            confidence: det.confidence,
            bbox: det.bbox,
          };
        });
      }

      const detectionsList = apiData.detections || [];
      const hasDetections = detectionsList.length > 0;

      setAnalysisResult({
        status: apiData.status || (hasDetections ? 'success' : 'no_damage_detected'),
        message: apiData.message || (hasDetections ? `Inference complete. ${detectionsList.length} detection(s) found.` : 'No road damage detected by the current model.'),
        detections: detectionsList,
        boxes: boxes,
        road_condition: apiData.road_condition || (hasDetections ? 'damaged' : 'good'),
        image_url: apiData.image_url,
        raw_api_response: apiData,
        zero_detections: !hasDetections,
        confidence_threshold: confidenceThreshold,
      });
    } catch (err) {
      console.error('Backend API request error:', err);
      const targetBase = getApiBaseUrl();
      setAnalysisResult({
        status: 'error',
        error: 'ML backend unavailable. Please start the FastAPI server.',
        errorDetails: `Could not reach ${targetBase}. ${err.message}`,
        detections: [],
        boxes: [],
        road_condition: null,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="py-12 lg:py-16 space-y-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyber-blue/10 border border-cyber-blue/30 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Scan className="w-3.5 h-3.5" />
            AI INFERENCE TERMINAL
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Analyze Road Condition
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Upload a road image and analyze its condition using deep learning computer vision.
          </p>
        </div>

        {/* Preset Sample Quick Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyber-cyan" />
            Quick Benchmark Presets:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {presetSamples.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-cyber-cyan/40 transition-all text-xs"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Upload / Preview Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center Upload & Preview Card */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
              
              {!selectedImage ? (
                /* Empty Upload Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[360px] ${
                    isDragOver
                      ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-glow-cyan'
                      : 'border-slate-700 hover:border-slate-500 bg-navy-950/50'
                  }`}
                >
                  <div className="w-20 h-20 rounded-2xl bg-navy-900 border border-slate-700 flex items-center justify-center text-cyber-cyan shadow-inner mb-6">
                    <UploadCloud className="w-10 h-10 animate-bounce" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Drag & Drop Road Image
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-4">
                    or select a file from your system
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all"
                    >
                      Choose Image
                    </button>

                    <Link
                      to="/live-capture"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-navy-850 hover:bg-navy-750 border border-slate-700 transition-all"
                    >
                      <Camera className="w-4 h-4 text-cyber-cyan" />
                      <span>Use Camera</span>
                    </Link>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    aria-label="Upload road image"
                  />

                  <div className="mt-8 text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span>Supported formats:</span>
                    <span className="text-cyber-cyan font-bold">JPG, JPEG, PNG, WEBP</span>
                  </div>
                </div>
              ) : (
                /* Selected Image Preview with Laser Scanning Overlay */
                <div className="space-y-6">
                  
                  <div className="relative rounded-2xl overflow-hidden bg-navy-950 border border-slate-700 aspect-[16/10] shadow-inner">
                    <img
                      src={selectedImage}
                      alt="Selected road sample for analysis"
                      className="w-full h-full object-cover"
                    />

                    {/* Laser scanning line during analysis */}
                    {isAnalyzing && (
                      <>
                        <div className="absolute inset-0 bg-cyber-blue/10 pointer-events-none" />
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent shadow-[0_0_20px_#00f0ff] animate-scan pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/60 backdrop-blur-sm pointer-events-none">
                          <RefreshCw className="w-10 h-10 text-cyber-cyan animate-spin mb-3" />
                          <div className="text-white font-mono font-bold text-sm tracking-wider">
                            PROCESSING ROAD TENSOR...
                          </div>
                          <div className="text-xs font-mono text-cyber-cyan mt-1">
                            Executing YOLO deep learning inference
                          </div>
                        </div>
                      </>
                    )}

                    {/* Render bounding boxes if analysis completed and boxes exist */}
                    {analysisResult && analysisResult.boxes && analysisResult.boxes.map((box, bIdx) => (
                      <div
                        key={bIdx}
                        className="absolute border-2 border-cyber-cyan bg-cyber-cyan/15 rounded-sm pointer-events-none transition-all duration-300"
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

                        <div className="absolute -top-6 left-0 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyber-cyan text-navy-950 shadow-lg">
                          {box.label}
                        </div>
                      </div>
                    ))}

                    <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md px-3 py-1 rounded text-xs font-mono text-slate-300 border border-slate-700">
                      {imageName || 'road_sample.jpg'}
                    </div>
                  </div>

                  {/* Action Buttons: Analyze vs Remove */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={handleRemoveImage}
                      disabled={isAnalyzing}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Image</span>
                    </button>

                    <button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-bold text-base text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Image'}</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Right Diagnostics & Result Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real-time State Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyber-cyan" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Diagnostic Output
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {analysisResult ? 'ANALYSIS COMPLETE' : 'AWAITING INPUT'}
                </span>
              </div>

              {/* Model Confidence Sensitivity Slider */}
              <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Sliders className="w-3.5 h-3.5 text-cyber-cyan" />
                    <span>Sensitivity Threshold:</span>
                  </span>
                  <span className="font-bold text-cyber-cyan bg-navy-900 px-2 py-0.5 rounded border border-slate-800">
                    {Math.round(confidenceThreshold * 100)}% ({confidenceThreshold.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">10%</span>
                  <input
                    type="range"
                    min="0.10"
                    max="0.50"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    disabled={isAnalyzing}
                    className="w-full accent-cyber-cyan cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    aria-label="Confidence threshold slider"
                  />
                  <span className="text-[10px] text-slate-500">50%</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>High Recall (Subtle defects)</span>
                  <span>High Precision</span>
                </div>
              </div>

              {!analysisResult ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Scan className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-sm font-sans">
                    Upload an image or pick a benchmark preset, then click <strong className="text-white">"Analyze Image"</strong> to run inference.
                  </p>
                  <div className="text-xs font-mono text-slate-500 pt-2">
                    Target Classes: Pothole | Crack | Road_Patch
                  </div>
                </div>
              ) : (
                <ResultCard result={analysisResult} showApiPayload={true} />
              )}

            </div>

            {/* Architecture / Pipeline details */}
            <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Live YOLO Inference Pipeline</span>
              </div>
              <p className="font-sans leading-relaxed text-slate-400">
                Connected to FastAPI backend running <code>ml/models/best_clean_303.pt</code>. Endpoint <code>POST /api/analyze/image</code> processes road imagery in real time.
              </p>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5 pt-1 bg-navy-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-300 font-semibold mb-1">Active Pipeline:</div>
                <div className="text-slate-200">React Frontend (Browser)</div>
                <div className="text-cyber-cyan">↓ POST multipart/form-data</div>
                <div className="text-slate-200">FastAPI Server (:8000)</div>
                <div className="text-cyber-cyan">↓ Tensor inference</div>
                <div className="text-slate-200">YOLOv8n (Pothole, Crack, Road_Patch)</div>
                <div className="text-cyber-cyan">↓ JSON Result</div>
                <div className="text-slate-200">React ResultCard & Overlays</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
