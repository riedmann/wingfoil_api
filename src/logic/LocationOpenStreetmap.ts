import { TrackPoint } from "../util/types";
import { Location } from "./Location";

export class LocationOpenStreetmap implements Location {
  async getLocation(point: TrackPoint): Promise<any> {
    try {
      const location = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lon}`
      );
      const data = await location.json();
      return data;
    } catch (error) {
      throw new Error("xx");
    }
  }
}
