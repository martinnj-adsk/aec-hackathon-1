import { Project } from "forma-embedded-view-sdk/project";
import { useEffect, useMemo, useState } from "preact/hooks";
import proj4 from "proj4";
import { Filter, determineAge } from "./Filters";

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
  distribution?: { [zoneId: number]: number } | undefined;
};

export async function getCSV<T>(
  url: string,
  mapper: (splitLine: string[]) => T
): Promise<T[]> {
  const response = await fetch(new URL(url, import.meta.url).href);
  const data = await response.text();
  if (!data) throw new Error("No data");

  const delimiter = data.includes("\r\n") ? "\r\n" : "\n";
  const lines = data.split(delimiter);
  return lines.slice(1, lines.length - 1).map((line) => {
    const splitLine = line.split(";");
    return mapper(splitLine);
  });
}

export function useData() {
  const [data, setData] = useState<ITUData[]>();
  useEffect(() => {
    const mapper = (splitLine: string[]): ITUData => {
      const peopleDistribution = splitLine.slice(11);
      const obj: ITUData = {
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
      };
      if (peopleDistribution[0]) {
        const distribution = splitLine.slice(11, 29).reduce((acc, curr, i) => {
          const percentage =
            parseFloat(curr.replace(",", ".").replace("\r", "")) / 100;

          const numPeople = Math.floor(obj.visitorCount * percentage);
          if (numPeople) {
            acc[i] = numPeople;
          }
          return acc;
        }, {} as { [zoneId: number]: number });
        obj.distribution = distribution;
      }
      return obj;
    };
    getCSV("/Residents_Areas_Friday10.csv", mapper)
      .then(setData)
      .catch(console.error);
  }, []);
  return data;
}

type EducationStats = {
  location: string;
  year: number;
  highestEducation: string;
  ageRange: ITUData["ageRange"];
  count: number;
};

export function useEducationData() {
  const [data, setData] = useState<EducationStats[]>();
  useEffect(() => {
    const mapper = (splitLine: string[]): EducationStats => {
      return {
        location: splitLine[1],
        year: parseInt(splitLine[2]),
        highestEducation: splitLine[3],
        ageRange: splitLine[4] as ITUData["ageRange"],
        count: parseInt(splitLine[5]),
      };
    };
    getCSV("/education.csv", mapper).then(setData).catch(console.error);
  }, []);
  return data;
}
type IncomeStats = {
  location: string;
  year: number;
  averageIncome: number;
  ageRange: ITUData["ageRange"];
  count: number;
};

export function useIncomeData() {
  const [data, setData] = useState<IncomeStats[]>();
  useEffect(() => {
    const mapper = (splitLine: string[]): IncomeStats => {
      return {
        year: parseInt(splitLine[0]),
        location: splitLine[2],
        ageRange: splitLine[3] as ITUData["ageRange"],
        count: parseInt(splitLine[4]),
        averageIncome: parseInt(splitLine[5]),
      };
    };
    getCSV("/income.csv", mapper).then(setData).catch(console.error);
  }, []);
  return data;
}

export function useFilteredData(filter: Filter) {
  const data = useData();
  const incomeData = useIncomeData();
  const educationData = useEducationData();

  const ITU_Data = useMemo(() => {
    if (!data || data?.length === 0) return [];
    console.log("all data", data?.length);
    return data.filter((d: ITUData) => {
      const genderFilter = !filter.gender || filter.gender === d.gender;
      const visitorTypeFilter =
        !filter.visitorType || filter.visitorType === d.visitorType;
      const ageFilter = determineAge(d.ageRange, filter.ageFrom, filter.ageTo);
      const date = new Date("2023-11-10");
      const limitDate = new Date("2023-11-11");

      return (
        genderFilter &&
        visitorTypeFilter &&
        ageFilter &&
        d.date.getTime() >= date.getTime() &&
        d.date.getTime() <= limitDate.getTime()
      );
    });
  }, [data, filter]);

  const filteredIncomeData = useMemo(() => {
    if (!incomeData) return [];
    return incomeData.filter((d: IncomeStats) => {
      const ageFilter = determineAge(d.ageRange, filter.ageFrom, filter.ageTo);
      return ageFilter;
    });
  }, [incomeData, filter]);

  const filteredEducationData: Record<string, number> = useMemo(() => {
    if (!educationData) return {};
    return educationData
      .filter((d: EducationStats) => {
        const ageFilter = determineAge(
          d.ageRange,
          filter.ageFrom,
          filter.ageTo
        );
        return ageFilter;
      })
      .reduce((acc, curr) => {
        if (acc[curr.highestEducation]) {
          acc[curr.highestEducation] += curr.count;
        } else {
          acc[curr.highestEducation] = curr.count;
        }
        return acc;
      }, {} as Record<string, number>);
  }, [educationData, filter]);

  return {
    ITU_Data,
    incomeData: filteredIncomeData,
    educationData: filteredEducationData,
  };
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
