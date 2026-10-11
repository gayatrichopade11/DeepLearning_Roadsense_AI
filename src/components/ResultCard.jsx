import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Maximize2, 
  Sparkles, 
  Code2, 
  ChevronDown, 
  ChevronUp,
  Layers,
  ServerCrash
} from 'lucide-react';

/**
 * ResultCard Component
 * ====================
 * Displays REAL YOLO detection results from FastAPI backend:
 * 1. Error state if backend fails (HTTP error / unreachable)
 * 2. Zero-detection state if no distress cavities/cracks detected
 * 3. All individual detections (Pothole, Crack, Road_Patch) with:
 *    - Real class name
 *    - Real confidence percentage
 *    - Real bounding box tensor [x1, y1, x2, y2]
 *    - Calculated width, height, and area in pixels
 * 4. Real road condition from backend response
 * 5. Road safety assessment calculated directly from detections
 * 6. Collapsible Raw FastAPI JSON API response viewer
 * 
 * NOTE: Strictly NO hardcoded mock or demo predictions.
 */
export default function ResultCard({ result, showApiPayload = true }) {
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showPixelDetails, setShowPixelDetails] = useState({});

  if (!result) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-slate-400 font-mono text-xs">
        No detection result provided.
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 1. BACKEND ERROR STATE (Requirement 11)
  // -------------------------------------------------------------------------
  if (result.status === 'error' || result.error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/80 text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
          <ServerCrash className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-rose-300 font-mono">
            {result.error || 'ML backend unavailable. Please start the FastAPI server.'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {result.errorDetails || 'Could not connect to http://127.0.0.1:8000. Verify the FastAPI server is running.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950 border border-slate-800 text-[11px] font-mono text-slate-400">
          <code className="text-cyber-cyan">POST /api/analyze/image</code>
          <span>→</span>
          <span className="text-rose-400">Connection Failed</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. ZERO DETECTIONS STATE (Requirement 12)
  // -------------------------------------------------------------------------
  const detections = result.detections || [];
  const roadCondition = (result.road_condition || 'good').toLowerCase();
  const isDamaged = roadCondition === 'damaged' || roadCondition === 'severe';

  if (result.zero_detections || detections.length === 0) {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DETECTION RESULT</span>
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider">
            YOLO CV-INFERENCE
          </span>
        </div>

        {/* Zero Detections Card */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white font-mono">
              No road damage detected by the current model.
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              The YOLO detector scanned the image and identified 0 distress cavities or structural cracks exceeding the model confidence threshold.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <div className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 ${
              isDamaged
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isDamaged ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Road Condition: {isDamaged ? 'Damaged' : 'Good'}</span>
            </div>
          </div>
        </div>

        {/* Real FastAPI JSON Response Preview */}
        {showApiPayload && result.raw_api_response && (
          <div className="bg-navy-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>FASTAPI RESPONSE JSON</span>
              </span>
              <button
                onClick={() => setShowJsonModal(!showJsonModal)}
                className="text-cyber-cyan hover:underline text-[10px]"
              >
                {showJsonModal ? 'Collapse' : 'Expand JSON'}
              </button>
            </div>
            <pre className={`text-cyber-cyan overflow-x-auto text-[10px] bg-navy-900/70 p-3 rounded-lg border border-slate-800/80 ${showJsonModal ? 'max-h-96' : 'max-h-40'}`}>
{JSON.stringify(result.raw_api_response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. ONE OR MORE DETECTIONS (Requirement 6, 7, 8, 9, 10)
  // -------------------------------------------------------------------------
  const potholeCount = detections.filter(d => d.class_name === 'Pothole').length;
  const crackCount = detections.filter(d => d.class_name === 'Crack').length;
  const patchCount = detections.filter(d => d.class_name === 'Road_Patch').length;

  // Road safety assessment based strictly on detections
  let safetyStatus = 'SAFE';
  let safetyReason = 'No significant structural damage identified.';
  let safetyRecommendation = 'Maintain standard roadway audit intervals.';

  if (potholeCount > 0 || isDamaged) {
    safetyStatus = 'UNSAFE';
    safetyReason = `Detected ${potholeCount > 0 ? `${potholeCount} pothole(s)` : ''}${potholeCount > 0 && crackCount > 0 ? ' and ' : ''}${crackCount > 0 ? `${crackCount} crack(s)` : ''} impacting pavement integrity.`;
    safetyRecommendation = 'Prioritize road section for inspection and scheduled maintenance.';
  } else if (crackCount > 0) {
    safetyStatus = 'CAUTION';
    safetyReason = `Detected ${crackCount} surface crack(s). Surface fatigue observed.`;
    safetyRecommendation = 'Inspect affected road section and monitor crack propagation.';
  } else if (patchCount > 0) {
    safetyStatus = 'SAFE';
    safetyReason = `Detected ${patchCount} repaired road patch(es) with stable asphalt overlay.`;
    safetyRecommendation = 'Routine monitoring to evaluate patch longevity.';
  }

  const safetyStyles = {
    SAFE: {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      panel: 'bg-emerald-950/20 border-emerald-500/30',
      accent: 'text-emerald-400',
      icon: ShieldCheck,
    },
    CAUTION: {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      panel: 'bg-amber-950/20 border-amber-500/30',
      accent: 'text-amber-400',
      icon: AlertTriangle,
    },
    UNSAFE: {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      panel: 'bg-rose-950/20 border-rose-500/30',
      accent: 'text-rose-400',
      icon: ShieldAlert,
    },
  }[safetyStatus];

  const SafetyIcon = safetyStyles.icon;

  const togglePixelDetails = (idx) => {
    setShowPixelDetails(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. Header with Detection Count */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono font-bold">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DETECTION RESULT</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono tracking-wider">
          <Layers className="w-3 h-3 text-cyber-cyan" />
          <span>{detections.length} DETECTION{detections.length > 1 ? 'S' : ''} FOUND</span>
        </span>
      </div>

      {/* 2. List of EVERY Detection Returned by YOLO (Requirement 6) */}
      <div className="space-y-4">
        {detections.map((det, idx) => {
          const className = det.class_name;
          const conf = det.confidence ?? 0;
          const confPercent = (conf * 100).toFixed(1);
          const rawBox = det.bbox || [0, 0, 0, 0];
          const [x1, y1, x2, y2] = rawBox;
          const widthPx = Math.round(Math.max(0, x2 - x1));
          const heightPx = Math.round(Math.max(0, y2 - y1));
          const areaPx = widthPx * heightPx;

          const isPothole = className === 'Pothole';
          const isCrack = className === 'Crack';

          const badgeClass = isPothole
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : isCrack
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

          const gaugeGradient = isPothole
            ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400'
            : isCrack
            ? 'bg-gradient-to-r from-amber-500 to-cyber-cyan'
            : 'bg-gradient-to-r from-emerald-500 to-teal-400';

          return (
            <div 
              key={idx}
              className="bg-navy-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-all"
            >
              {/* Detection Class & Confidence Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      DETECTION #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      Class ID: {det.class_id ?? (isPothole ? 0 : isCrack ? 1 : 2)}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
                    <span>{className}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    CONFIDENCE
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-cyber-cyan mt-0.5">
                    {confPercent}%
                  </div>
                </div>
              </div>

              {/* Confidence Gauge Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${gaugeGradient}`}
                    style={{ width: `${Math.min(100, Math.max(5, conf * 100))}%` }}
                  />
                </div>
              </div>

              {/* Pixel Bounding Box Sub-strip (Requirement 7) */}
              <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3 text-cyber-cyan" />
                  <span>BBox Tensor:</span>
                  <code className="text-slate-200 bg-navy-950 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                    [{Math.round(x1)}, {Math.round(y1)}, {Math.round(x2)}, {Math.round(y2)}]
                  </code>
                </span>

                <span className="text-slate-400">
                  Size: <strong className="text-slate-200">{widthPx} × {heightPx} px</strong> ({areaPx.toLocaleString()} px²)
                </span>
              </div>

              {/* Toggleable Raw Pixel Details */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => togglePixelDetails(idx)}
                  className="text-[11px] font-mono text-cyber-cyan hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>{showPixelDetails[idx] ? 'Hide Coordinate Telemetry' : 'View Exact Pixel Telemetry'}</span>
                  {showPixelDetails[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showPixelDetails[idx] && (
                  <div className="mt-2 p-3 rounded-lg bg-navy-950 border border-slate-800/90 text-[10px] font-mono space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Coordinates [x1, y1, x2, y2]:</span>
                      <span className="text-white">[{x1.toFixed(1)}, {y1.toFixed(1)}, {x2.toFixed(1)}, {y2.toFixed(1)}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounding Box Width:</span>
                      <span className="text-white">{widthPx} px</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounding Box Height:</span>
                      <span className="text-white">{heightPx} px</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounding Box Area:</span>
                      <span className="text-white">{areaPx.toLocaleString()} px²</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Road Condition Section (Requirement 9) */}
      <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Road Condition
          </span>
          <div className="text-lg font-bold text-white mt-0.5">
            {isDamaged ? 'Surface Damage Detected' : 'Normal / Repaired Road Surface'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono">
            Backend Flag: <span className="text-slate-200 uppercase font-bold">{result.road_condition || 'unknown'}</span>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-1.5 ${
          isDamaged
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          {isDamaged ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isDamaged ? 'Damaged' : 'Good'}</span>
        </div>
      </div>

      {/* 4. Road Safety Assessment Section */}
      <div className={`p-5 rounded-2xl border space-y-3.5 ${safetyStyles.panel}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${safetyStyles.accent}`}>
            <SafetyIcon className="w-4 h-4" />
            ROAD SAFETY ASSESSMENT
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${safetyStyles.badge}`}>
            {safetyStatus}
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950/80 border border-slate-800">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Assessment Level</div>
            <div className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${safetyStyles.accent}`}>
              {safetyStatus}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${safetyStyles.badge}`}>
            {safetyStatus}
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Reason:
          </div>
          <p className="text-xs text-slate-200 font-sans bg-navy-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
            {safetyReason}
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Recommendation:
          </div>
          <p className="text-xs text-slate-200 font-sans bg-navy-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
            {safetyRecommendation}
          </p>
        </div>
      </div>

      {/* 5. Real FastAPI JSON Response Preview */}
      {showApiPayload && result.raw_api_response && (
        <div className="bg-navy-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>FASTAPI RESPONSE JSON</span>
            </span>
            <button
              onClick={() => setShowJsonModal(!showJsonModal)}
              className="text-cyber-cyan hover:underline text-[10px]"
            >
              {showJsonModal ? 'Collapse' : 'Expand JSON'}
            </button>
          </div>

          <pre className={`text-cyber-cyan overflow-x-auto text-[10px] bg-navy-900/70 p-3 rounded-lg border border-slate-800/80 ${showJsonModal ? 'max-h-96' : 'max-h-40'}`}>
{JSON.stringify(result.raw_api_response, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}
