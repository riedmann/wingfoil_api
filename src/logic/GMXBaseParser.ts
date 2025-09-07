import { TrackPoint } from "../util/types";
import { GMXParser } from "./GMXParser";
const { DOMParser } = require('xmldom')

export class GMXBaseParser implements GMXParser {
  public async parse(content: string): Promise<TrackPoint[]> {
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");

    // Get all track points
    const trackPoints = xmlDoc.getElementsByTagName("trkpt");
    const points: TrackPoint[] = [];

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i];
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");

      // Get time
      const timeElement = point.getElementsByTagName("time")[0];
      const time = timeElement ? timeElement.textContent || "" : "";

      // Get extensions data (if available)
      let speed: number | undefined = undefined;
      let hr: number | undefined = undefined;
      let distance: number | undefined = undefined;

      const extensionsElement = point.getElementsByTagName("extensions")[0];
      if (extensionsElement) {
        // Look for heart rate - try different possible formats
        const hrElement =
          extensionsElement.getElementsByTagName("hr")[0] ||
          extensionsElement.getElementsByTagNameNS("*", "hr")[0];

        if (hrElement && hrElement.textContent) {
          hr = parseFloat(hrElement.textContent);
        }

        // Look for speed - try different possible formats
        const speedElement =
          extensionsElement.getElementsByTagName("speed")[0] ||
          extensionsElement.getElementsByTagNameNS("*", "speed")[0];

        if (speedElement && speedElement.textContent) {
          speed = parseFloat(speedElement.textContent);
        }

        // Look for distance - try different possible formats
        const distanceElement =
          extensionsElement.getElementsByTagName("distance")[0] ||
          extensionsElement.getElementsByTagNameNS("*", "distance")[0];

        if (distanceElement && distanceElement.textContent) {
          distance = parseFloat(distanceElement.textContent);
        }

        // If no speed is found but we have distance between points, we can calculate speed
        if (speed === undefined && distance !== undefined && i > 0) {
          const prevTime = new Date(points[i - 1].time).getTime();
          const currTime = new Date(time).getTime();
          const timeDiffSeconds = (currTime - prevTime) / 1000;

          if (timeDiffSeconds > 0) {
            const prevDistance = points[i - 1].distance || 0;
            const distanceDiff = distance - prevDistance;
            speed = distanceDiff / timeDiffSeconds; // m/s
          }
        }
      }

      points.push({
        lat,
        lon,
        time,
        speed,
        hr,
        distance,
      });
    }

    // If we still have points without speed, calculate it based on position changes
    for (let i = 1; i < points.length; i++) {
      if (points[i].speed === undefined) {
        const prevPoint = points[i - 1];
        const currPoint = points[i];

        // Calculate distance between points using Haversine formula
        const R = 6371000; // Earth radius in meters
        const toRad = (deg: number): number => (deg * Math.PI) / 180;

        const lat1 = toRad(prevPoint.lat);
        const lon1 = toRad(prevPoint.lon);
        const lat2 = toRad(currPoint.lat);
        const lon2 = toRad(currPoint.lon);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // in meters

        // Calculate time difference in seconds
        const prevTime = new Date(prevPoint.time).getTime();
        const currTime = new Date(currPoint.time).getTime();
        const timeDiffSeconds = (currTime - prevTime) / 1000;

        if (timeDiffSeconds > 0) {
          points[i].speed = distance / timeDiffSeconds; // m/s
        }
      }
    }

    const fixed = fixPoints(points, { maxSpeedMps: 20, maxJumpMps: 2 });
    return fixed;
  }
}

function toMs(t: string | number | Date): number {
  return typeof t === "number" ? t : new Date(t).getTime();
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface FixOptions {
  maxSpeedMps?: number;
  maxJumpMps?: number;
  maxGapMps?: number;
}

function fixPoints(points: TrackPoint[], options: FixOptions = {}): TrackPoint[] {
  const {
    maxSpeedMps = 20, // absolute max allowed
    maxJumpMps = 2, // max jump tolerance
    maxGapMps = 25, // implied distance/time speed max
  } = options;

  const fixed: TrackPoint[] = [];
  let lastValid: TrackPoint | null = null;

  for (let i = 0; i < points.length; i++) {
    const p = { ...points[i] };
    let s = p.speed;

    if (typeof s !== "number" || !isFinite(s)) {
      // no speed -> try to interpolate
      if (lastValid) s = lastValid.speed ?? 0;
      else s = 0;
    }

    if (lastValid) {
      const dt = (toMs(p.time) - toMs(lastValid.time)) / 1000; // sec
      const prevS = lastValid.speed ?? 0;

      if (dt > 0) {
        // check implied speed from distance/time
        const d = haversine(lastValid.lat, lastValid.lon, p.lat, p.lon);
        const impliedSpeed = d / dt;

        if (impliedSpeed > maxGapMps) {
          s = prevS; // unrealistic jump → smooth
        }
      }

      // check absolute max
      if (s > maxSpeedMps) {
        s = prevS;
      }

      // check spike
      if (Math.abs(s - prevS) > maxJumpMps) {
        s = prevS;
      }
    }

    p.speed = s;
    fixed.push(p);
    lastValid = p;
  }

  return fixed;
}

// --- Example usage ---
// const fixed = fixPoints(points, { maxSpeedMps: 20, maxJumpMps: 2 });
// console.log(fixed);
