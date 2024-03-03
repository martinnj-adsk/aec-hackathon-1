import { Project } from "forma-embedded-view-sdk/project";
import { useEffect, useMemo, useState } from "preact/hooks";
import proj4 from "proj4";

export type ITUData = {
  location: string;
  date: Date;
  domestic: boolean;
  catchment: string;
  ageRange: "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+" | "N/A";
  gender: "M" | "F" | "N" | "none";
  visitorType:
    | "Commuter"
    | "in-transit"
    | "One day visitor"
    | "Overnight visitor"
    | "Potential event visitor"
    | "Resident"
    | "Short term visitor";
  visitorCount: number;
  zoneId: number;
};

export async function getCSV(): Promise<ITUData[]> {
  const response = await fetch(new URL("/ITU_data.csv", import.meta.url).href);
  const data = await response.text();
  if (!data) throw new Error("No data");

  const lines = data.split("\n");
  return lines.slice(1, lines.length - 1).map((line) => {
    const splitLine = line.split(",");
    return {
      location: splitLine[0],
      date: new Date(
        `${splitLine[1]}-${splitLine[2]}-${splitLine[3]}T${splitLine[4]}:00:00`
      ),
      domestic: splitLine[5]?.toLowerCase() === "true",
      catchment: splitLine[6],
      ageRange: splitLine[7] as ITUData["ageRange"],
      visitorType: splitLine[8] as ITUData["visitorType"],
      gender: splitLine[9] as ITUData["gender"],
      visitorCount: parseInt(splitLine[10]),
      zoneId: parseInt(splitLine[11]),
    };
  });
}

export function useData() {
  const [data, setData] = useState<ITUData[]>();
  useEffect(() => {
    getCSV().then(setData).catch(console.error);
  }, []);
  return data;
}

export function useFilteredData(filter: (data: ITUData) => boolean) {
  const data = useData();
  return useMemo(() => {
    if (!data) return [];
    return data.filter(filter);
  }, [data, filter]);
}

export function translateGeojsonPolygons(
  geoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
  project: Project,
  idToColor?: Map<number, string>
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs +type=crs";
  const projectedFeatures = geoJson.features.map((feature: GeoJSON.Feature) => {
    if (feature.geometry.type === "Polygon") {
      const color =
        feature.properties.stroke ??
        idToColor?.get(feature.id as number) ??
        "#000000";
      console.log(color);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          stroke: color,
          fill: color,
        },
        geometry: {
          ...feature.geometry,
          coordinates: feature.geometry.coordinates.map((c) =>
            c.map(([x, y]) => {
              const [xx, yy] = proj4(wgs84, project.projString, [x, y]);
              return [xx - project.refPoint[0], yy - project.refPoint[1]];
            })
          ),
        },
      };
    }
    throw new Error("Only Polygon features are supported"); // TODO: handle other types
  });
  return { ...geoJson, features: projectedFeatures };
}
