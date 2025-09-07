import { TrackPoint } from "../util/types";

export interface GMXParser {
  parse(content: string): Promise<TrackPoint[]>;
}
