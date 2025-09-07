
import { TrackPoint,TrackStatistics } from "../util/types";


export interface Analysis {
  getStatistics(points: TrackPoint[]): TrackStatistics;
}
