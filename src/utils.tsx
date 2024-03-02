import { useEffect, useMemo, useState } from "preact/hooks";

enum AgeRange {
  YOUTH = "18-24",
  YOUNG_ADULT = "25-34",
}

type Age = "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+" | "N/A";

export type ITUData = {
  location: string;
  date: Date;
  domestic: boolean;
  catchment: string;
  ageRange: Age;
  visitorType: string;
  visitorCount: number;
};

export async function getCSV(): Promise<ITUData[]> {
  const response = await fetch(new URL("/ITU_data.csv", import.meta.url).href);
  const data = await response.text();
  const lines = data.split("\n");
  return lines.slice(1, lines.length - 1).map((line) => {
    const splitLine = line.split(",");
    return {
      location: splitLine[0],
      date: new Date(
        `${splitLine[1]}-${splitLine[2]}-${splitLine[3]}T${splitLine[4]}:00:00`
      ),
      domestic: splitLine[5].toLowerCase() === "true",
      catchment: splitLine[6],
      ageRange: splitLine[7] as Age,
      visitorType: splitLine[8],
      gender: splitLine[9],
      visitorCount: parseInt(splitLine[10]),
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
