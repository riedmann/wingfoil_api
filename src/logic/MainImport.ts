import { TrackPoint, TrackStatistics } from "../util/types";
import { AnalysisBase } from "./AnalysisBase";
import { GMXBaseParser } from "./GMXBaseParser";
import { Importer } from "./Importer";
import { ImporterMain } from "./ImporterMain";
import { LocationOpenStreetmap } from "./LocationOpenStreetmap";

export async function handleGPXFile(content: string, name: string) {
  const importer: Importer = new ImporterMain();
  const points: TrackPoint[] = await importer.getTrackPoints(
    content,
    new GMXBaseParser()
  );
  const stats: TrackStatistics = await importer.getStatistics(
    points,
    new AnalysisBase()
  );
  const location: any = await new LocationOpenStreetmap().getLocation(
    points[0]
  );

  const sessionData = {
    name: name ?? "No name",
    date: points[0].time ?? new Date(),
    location: location.display_name ?? "No location",
    country: location.address.country ?? "No country",
    village: location.address.village ?? "No village",
    hamlet: location.address.hamlet ?? "No hamlet",
    statistics: stats,
    //points: points,
  };

  return removeUndefinedRecursively(sessionData);
}

const removeUndefinedRecursively = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedRecursively);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefinedRecursively(v)])
    );
  }
  return obj;
};
