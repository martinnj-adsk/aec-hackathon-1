import { Forma } from "forma-embedded-view-sdk/auto";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Project } from "forma-embedded-view-sdk/project";
import { Divide, Filter, Filters } from "./Filters";
import zonesRaw from "./zones.json";
import { ITUData, translateGeojsonPolygons, useFilteredData } from "./utils";

function parseZoneUsage(data: ITUData[]) {
  const zoneUsage = new Map<number, number>();
  let distCount = 0;
  data.forEach((d) => {
    if (d.distribution) {
      distCount += 1;
      for (const [zoneId, count] of Object.entries(d.distribution)) {
        const zoneIdNum = parseInt(zoneId);
        const currentCount = zoneUsage.get(zoneIdNum) ?? 0;
        zoneUsage.set(zoneIdNum, currentCount + count);
      }
    }
  });

  const min = Math.min(...zoneUsage.values());
  const max = Math.max(...zoneUsage.values());
  const sum = Array.from(zoneUsage.values()).reduce((a, b) => a + b, 0);
  return { zoneUsage, min, max, sum };
}

const Table3Column = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  alignItems: "center",
  width: "100%",
};
const Table2Column = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  width: "100%",
};

function heatMapColorforValue(value: number) {
  const h = Math.floor((1.0 - value) * 240);

  return `hsl(${h},100%,50%)`;
}

export default function App() {
  const [filter, setFilter] = useState<Filter>({
    ageFrom: 0,
    ageTo: 110,
    gender: null,
    visitorType: null,
  });
  const [project, setProject] = useState<Project>();
  const { incomeData, educationData, ITU_Data: data } = useFilteredData(filter);

  useEffect(() => {
    console.log("Data changed!", data?.length, "lines of data");
  }, [data]);

  useEffect(() => {
    console.log("Income data changed!", incomeData);
    console.log("education data changed!", educationData);
  }, [data]);

  const [play, setPlay] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date]>();
  const [timeAwareData, settimeAwareData] = useState(data);
  useEffect(() => {
    console.log("play", play);
    if (!play) {
      setDateRange(undefined);
      return;
    }
    let HOUR = 0;
    const interval = setInterval(() => {
      HOUR = (HOUR + 1) % 24;
      const NEXTHOUR = HOUR + 1;
      const dateFrom = new Date(
        `2023-11-10T${HOUR < 10 ? "0" + HOUR : HOUR}:00:00`
      );
      const dateTo = new Date(
        `2023-11-10T${NEXTHOUR < 10 ? "0" + NEXTHOUR : NEXTHOUR}:00:00`
      );
      console.log("new date!");
      setDateRange([dateFrom, dateTo]);
      Forma.sun.setDate({ date: dateFrom });
    }, 1000);
    return () => clearInterval(interval);
  }, [play]);

  useEffect(() => {
    console.log(dateRange);
    if (dateRange) {
      const [dateFrom, dateTo] = dateRange;
      settimeAwareData(
        data.filter((d) => dateFrom <= d.date && d.date <= dateTo)
      );
    } else {
      settimeAwareData(data);
    }
  }, [data, dateRange]);

  useEffect(() => {
    console.log("data", timeAwareData.length);
  }, [timeAwareData]);

  const [zone, setZone] = useState<string>();

  useEffect(() => {
    Forma.project.get().then(setProject).catch(console.error);
  }, []);

  useEffect(() => {
    if (!project) return;
    if (timeAwareData.length === 0) return;

    const { zoneUsage, max, min, sum } = parseZoneUsage(timeAwareData);
    const colorMap = new Map<number, string>();
    for (const [zoneId, count] of zoneUsage.entries()) {
      const color = heatMapColorforValue((count - min) / (max - min));
      colorMap.set(zoneId, color);
    }
    const newGeoJson = translateGeojsonPolygons(
      zonesRaw as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
      project,
      colorMap
    );

    Forma.render.geojson.add({ geojson: newGeoJson });
    Forma.render.geojson.add({ geojson: newGeoJson });

    return () => {
      Forma.render.geojson.cleanup();
    };
  }, [timeAwareData]);

  return (
    <div style={{ height: "100%" }}>
      <h2>Human behavioral assessment tool</h2>
      <button onClick={() => setPlay(!play)}>
        {play ? "Stop" : "Start"} simulation{" "}
      </button>
      <Filters filter={filter} setFilter={setFilter} />
      <h3>Income</h3>
      <section style={Table3Column}>
        <p>
          <b>Age Interval</b>
        </p>
        <p>
          <b>Average Income</b>
        </p>
        <p>
          <b>#People</b>
        </p>
        {incomeData?.map((d) => {
          return (
            <>
              <p>{d.ageRange}</p>
              <p>{d.averageIncome}</p>
              <p>{d.count}</p>
            </>
          );
        })}
      </section>
      <h3>Education</h3>
      <section style={Table2Column}>
        <p>
          <b>Highest Education</b>
        </p>
        <p>
          <b>#People</b>
        </p>
        {Object.entries(educationData)?.map(([education, count]) => {
          return (
            <>
              <p>{education}</p>
              <p>{count}</p>
            </>
          );
        })}
      </section>
    </div>
  );
}

render(<App />, document.getElementById("app"));
