import { TrackPoint, TrackStatistics } from "../util/types";
import { Analysis } from "./Analysis";
import { GMXParser } from "./GMXParser";
import { Importer } from "./Importer";

export class ImporterMain implements Importer {
  async getTrackPoints(
    content: string,
    parser: GMXParser
  ): Promise<TrackPoint[]> {
    const points: TrackPoint[] = await parser.parse(content);
    const cleaned = points.map((entry) => ({
      ...entry,
      lat: entry.lat ?? 0,
      lon: entry.lon ?? 0,
      time: entry.time ?? 0,
      speed: entry.speed ?? 0,
      hr: entry.hr ?? 0,
    }));
    return cleaned;
  }
  async getStatistics(
    trackPoints: TrackPoint[],
    analysis: Analysis
  ): Promise<TrackStatistics> {
    const stats: TrackStatistics = await analysis.getStatistics(trackPoints);
    return stats;
  }
}
