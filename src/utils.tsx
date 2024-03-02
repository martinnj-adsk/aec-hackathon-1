import { useEffect, useMemo, useState } from "preact/hooks";

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
      domestic: splitLine[5].toLowerCase() === "true",
      catchment: splitLine[6],
      ageRange: splitLine[7] as ITUData["ageRange"],
      visitorType: splitLine[8],
      gender: splitLine[9] as ITUData["gender"],
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
