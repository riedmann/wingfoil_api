import { TrackPoint, TrackStatistics } from "../util/types";
import { Analysis } from "./Analysis";
import { GMXBaseParser } from "./GMXBaseParser";
import { GMXParser } from "./GMXParser";

export interface Importer {
  getTrackPoints(content: string, parser: GMXParser): Promise<TrackPoint[]>;
  getStatistics(
    trackPoints: TrackPoint[],
    analysis: Analysis
  ): Promise<TrackStatistics>;
}
