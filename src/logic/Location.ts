import { TrackPoint } from "../util/types";

export interface Location {
  getLocation(point: TrackPoint): Promise<any>;
}
