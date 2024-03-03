import { Forma } from "forma-embedded-view-sdk/auto";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Project } from "forma-embedded-view-sdk/project";
import { Divide, Filter, Filters } from "./Filters";
import geojsonRaw from "./ITU_data.json";
import zonesRaw from "./zones.json";
import { ITUData, translateGeojsonPolygons, useFilteredData } from "./utils";

const bluecolorScale10Item = [
  "#f7fbff",
  "#deebf7",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#4292c6",
  "#2171b5",
  "#08519c",
  "#08306b",
  "#08306b",
];

function parseZoneUsage(data: ITUData[]) {
  const zoneUsage = new Map<number, number>();
  console.log(data?.length);
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

  console.log("total distribution count", distCount);
  const min = Math.min(...zoneUsage.values());
  console.log("min", min);
  const max = Math.max(...zoneUsage.values());
  console.log("max", max);
  console.log("zoneUsage", zoneUsage);
  const sum = Array.from(zoneUsage.values()).reduce((a, b) => a + b, 0);
  console.log("zoneUsage", zoneUsage);
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
  var h = (1.0 - value) * 240;
  return "hsl(" + h + ", 100%, 50%)";
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

  const [zone, setZone] = useState<string>();

  useEffect(() => {
    Forma.project.get().then(setProject).catch(console.error);
  }, []);

  useEffect(() => {
    if (!project) return;
    if (data.length === 0) return;

    const { zoneUsage, sum } = parseZoneUsage(data);
    const colorMap = new Map<number, string>();
    for (const [zoneId, count] of zoneUsage.entries()) {
      const color = heatMapColorforValue(count / sum);
      colorMap.set(zoneId, color);
    }
    const newGeoJson = translateGeojsonPolygons(
      zonesRaw as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
      project,
      colorMap
    );
    if (!zone) {
      Forma.render.geojson.add({ geojson: newGeoJson }).then((res) => {
        setZone(res.id);
        console.log("zones added");
      });
    } else {
      console.log("zones updated");
      Forma.render.geojson.update({
        id: zone,
        geojson: newGeoJson,
      });
    }
  }, [data]);

  return (
    <div style={{ height: "100%" }}>
      <h2>Human behavioral assessment tool</h2>
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
