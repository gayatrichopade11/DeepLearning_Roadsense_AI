/**
 * RoadSense AI - Pavement Damage Measurement & YOLO API Schema
 * =============================================================
 * 
 * This module defines the standardized frontend data structures for:
 * 1. Pixel-based detection & bounding box coordinates from future YOLO models.
 * 2. Uncalibrated / estimated physical dimensions (length, width, area).
 * 3. Road safety classification (SAFE, CAUTION, UNSAFE) with heuristic reasoning.
 * 
 * NOTE ON CALIBRATION:
 * The current frontend does NOT have a hardware camera calibration system.
 * Pixel dimensions do NOT directly equal metric units. All real-world dimensions
 * are DEMO / ESTIMATED values until depth sensor or camera calibration is integrated.
 */

export const CALIBRATION_DISCLAIMER = 
  "Estimated measurements — calibration required for real-world dimensions.";

export const SAFETY_LOGIC_DISCLAIMER =
  "These safety categories are DEMO FRONTEND LOGIC for now. Real AI models provide raw detections; structural road safety requires engineering inspection standards.";

/**
 * Future YOLO API Response Schema Template
 * POST /api/v1/detect
 * Response:
 * {
 *   "detections": [
 *     {
 *       "class": "Pothole" | "Crack" | "Asphalt",
 *       "confidence": 0.947,
 *       "bbox": { "x": 120, "y": 180, "width": 240, "height": 160 },
 *       "measurements": {
 *         "length_cm": 48,
 *         "width_cm": 31,
 *         "area_cm2": 1488,
 *         "width_px": 240,
 *         "height_px": 160,
 *         "area_px": 38400,
 *         "measurement_method": "pixel" // or "calibrated"
 *       }
 *     }
 *   ],
 *   "road_safety": {
 *     "status": "UNSAFE" | "CAUTION" | "SAFE",
 *     "reason": "...",
 *     "recommendation": "..."
 *   }
 * }
 */

export const DEMO_MEASUREMENTS = {
  Pothole: {
    class: 'Pothole',
    confidence: 0.947,
    condition: 'Damaged',
    severity: 'Critical Safety Hazard',
    secondary: 'Deep asphalt depression with loose aggregate loss',
    bbox: {
      x: 120,
      y: 180,
      width: 240,
      height: 160,
    },
    // Raw pixel measurements from bounding box
    pixel_measurements: {
      width_px: 240,
      height_px: 160,
      area_px: 38400,
    },
    // Future real-world measurement structure (populated with demo benchmarks)
    measurements: {
      // Metric dimensions
      length_cm: 48,
      width_cm: 31,
      area_m2: 0.149,
      area_cm2: 1488,
      // Pixel fallback
      width_px: 240,
      height_px: 160,
      area_px: 38400,
      measurement_method: 'pixel', // will become 'calibrated' when backend depth calibration is implemented
      display_cards: [
        { label: 'LENGTH', value: '48 cm', sub: 'Longitudinal span' },
        { label: 'WIDTH', value: '31 cm', sub: 'Transverse span' },
        { label: 'ESTIMATED AREA', value: '0.149 m²', sub: '~1,488 cm²' },
      ],
    },
    road_safety: {
      status: 'UNSAFE',
      badge_color: 'rose',
      reason: 'A significant pothole was detected.',
      recommendation: 'Drive with caution and prioritize the damaged section for inspection and maintenance.',
    },
    boxes: [
      { top: '36%', left: '24%', width: '50%', height: '38%', label: 'POTHOLE 94.7%' },
      { top: '22%', left: '38%', width: '30%', height: '20%', label: 'CRACK 91.2%' },
    ],
  },

  Crack: {
    class: 'Crack',
    confidence: 0.912,
    condition: 'Damaged',
    severity: 'Moderate Structural Fatigue',
    secondary: 'Longitudinal & fatigue cracks detected along wheel path',
    bbox: {
      x: 160,
      y: 110,
      width: 280,
      height: 250,
    },
    pixel_measurements: {
      width_px: 280,
      height_px: 250,
      area_px: 70000,
    },
    measurements: {
      crack_length_m: 1.84,
      avg_width_cm: 3.2,
      affected_area_m2: 0.059,
      length_cm: 184,
      width_cm: 3.2,
      area_cm2: 588.8,
      width_px: 280,
      height_px: 250,
      area_px: 70000,
      measurement_method: 'pixel',
      display_cards: [
        { label: 'CRACK LENGTH', value: '1.84 m', sub: 'Trace distance' },
        { label: 'AVERAGE CRACK WIDTH', value: '3.2 cm', sub: 'Aperture average' },
        { label: 'AFFECTED AREA', value: '0.059 m²', sub: '~589 cm²' },
      ],
    },
    road_safety: {
      status: 'CAUTION',
      badge_color: 'amber',
      reason: 'A road crack was detected.',
      recommendation: 'Inspect the affected road section and consider maintenance.',
    },
    boxes: [
      { top: '25%', left: '20%', width: '58%', height: '52%', label: 'CRACK 91.2%' },
    ],
  },

  Road_Patch: {
    class: 'Road_Patch',
    confidence: 0.950,
    condition: 'Good',
    severity: 'Repaired Surface',
    secondary: 'Compacted road patch / repaired asphalt overlay with no active cavity',
    surface_condition: 'Repaired Road Surface',
    bbox: {
      x: 100,
      y: 200,
      width: 440,
      height: 280,
    },
    pixel_measurements: {
      width_px: 440,
      height_px: 280,
      area_px: 123200,
    },
    measurements: null,
    road_safety: {
      status: 'SAFE',
      badge_color: 'emerald',
      reason: 'Repaired pavement patch detected with no structural depression.',
      recommendation: 'Periodic civil inspection to confirm patch longevity.',
    },
    boxes: [
      { top: '48%', left: '16%', width: '68%', height: '44%', label: 'ROAD_PATCH 95.0%' },
    ],
  },

  Asphalt: {
    class: 'Asphalt',
    confidence: 0.964,
    condition: 'Good',
    severity: 'Optimal Skid Resistance',
    secondary: 'Uniform surface texture, zero structural fissures detected',
    surface_condition: 'Normal Road Surface',
    bbox: {
      x: 100,
      y: 200,
      width: 440,
      height: 280,
    },
    pixel_measurements: {
      width_px: 440,
      height_px: 280,
      area_px: 123200,
    },
    // For normal asphalt, no damage measurement should be shown
    measurements: null,
    road_safety: {
      status: 'SAFE',
      badge_color: 'emerald',
      reason: 'No significant visible damage detected in the analyzed sample.',
      recommendation: 'Maintain routine highway monitoring schedule.',
    },
    boxes: [
      { top: '48%', left: '16%', width: '68%', height: '44%', label: 'ASPHALT 96.4%' },
    ],
  },
};

/**
 * Normalizes any detection payload into the standardized representation
 */
export function normalizeDetectionResult(rawResult) {
  if (!rawResult) return null;

  // If already structured
  const detectedClass = rawResult.class || rawResult.prediction || (rawResult.detections && rawResult.detections[0]?.class_name) || 'Pothole';
  const defaultTemplate = DEMO_MEASUREMENTS[detectedClass] || DEMO_MEASUREMENTS.Road_Patch || DEMO_MEASUREMENTS.Pothole;
  const isPatchOrAsphalt = detectedClass === 'Road_Patch' || detectedClass === 'Asphalt';

  let realBbox = rawResult.bbox;
  let realPixelMeas = rawResult.pixel_measurements;
  if (!realBbox && rawResult.detections && rawResult.detections[0]?.bbox) {
    const rawBox = rawResult.detections[0].bbox;
    if (Array.isArray(rawBox) && rawBox.length === 4) {
      const [x1, y1, x2, y2] = rawBox;
      const w = Math.round(Math.max(0, x2 - x1));
      const h = Math.round(Math.max(0, y2 - y1));
      realBbox = { x: Math.round(x1), y: Math.round(y1), width: w, height: h };
      realPixelMeas = { width_px: w, height_px: h, area_px: w * h };
    }
  }

  return {
    class: detectedClass,
    confidence: rawResult.confidence ?? (rawResult.detections && rawResult.detections[0]?.confidence) ?? defaultTemplate.confidence,
    condition: rawResult.condition ?? (rawResult.road_condition === 'damaged' || rawResult.road_condition === 'severe' ? 'Damaged' : 'Good'),
    severity: rawResult.severity ?? defaultTemplate.severity,
    secondary: rawResult.secondary ?? defaultTemplate.secondary,
    surface_condition: rawResult.surface_condition ?? defaultTemplate.surface_condition ?? (isPatchOrAsphalt ? 'Normal / Repaired Road Surface' : null),
    bbox: realBbox ?? defaultTemplate.bbox,
    pixel_measurements: realPixelMeas ?? defaultTemplate.pixel_measurements,
    measurements: rawResult.measurements !== undefined ? rawResult.measurements : (isPatchOrAsphalt ? null : defaultTemplate.measurements),
    road_safety: rawResult.road_safety ?? defaultTemplate.road_safety,
    boxes: rawResult.boxes ?? defaultTemplate.boxes,
    raw_api_response: rawResult.raw_api_response || rawResult,
  };
}

/**
 * Formats data strictly for the future YOLO API preview
 */
export function generateFutureApiResponse(normalized) {
  if (!normalized) return {};

  if (normalized.raw_api_response && normalized.raw_api_response.detections) {
    return normalized.raw_api_response;
  }

  return {
    detections: [
      {
        class: normalized.class,
        confidence: normalized.confidence,
        bbox: normalized.bbox || { x: 0, y: 0, width: 0, height: 0 },
        measurements: (normalized.class === 'Asphalt' || normalized.class === 'Road_Patch') ? null : {
          length_cm: normalized.measurements?.length_cm ?? (normalized.class === 'Pothole' ? 48 : 184),
          width_cm: normalized.measurements?.width_cm ?? (normalized.class === 'Pothole' ? 31 : 3.2),
          area_cm2: normalized.measurements?.area_cm2 ?? (normalized.class === 'Pothole' ? 1488 : 588.8),
          width_px: normalized.pixel_measurements?.width_px ?? 240,
          height_px: normalized.pixel_measurements?.height_px ?? 160,
          area_px: normalized.pixel_measurements?.area_px ?? 38400,
          measurement_method: normalized.measurements?.measurement_method ?? 'pixel',
        },
      },
    ],
    road_safety: {
      status: normalized.road_safety?.status ?? (normalized.condition === 'Damaged' ? 'UNSAFE' : 'SAFE'),
      reason: normalized.road_safety?.reason ?? '',
      recommendation: normalized.road_safety?.recommendation ?? '',
      is_demo_logic: false,
    },
  };
}
