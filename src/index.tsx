import { Forma } from "forma-embedded-view-sdk/auto";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Project } from "forma-embedded-view-sdk/project";
import { Filters } from "./Filters";
import geojsonRaw from "./ITU_data.json";
import proj4 from "proj4";
import { ITUData, useFilteredData } from "./utils";

function translateGeojsonPolygons(
  geoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
  project: Project
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs +type=crs";
  const projectedFeatures = geoJson.features.map((feature: GeoJSON.Feature) => {
    if (feature.geometry.type === "Polygon") {
      return {
        ...feature,
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

export default function App() {
  const [project, setProject] = useState<Project>();
  const [filterFunction, setFilterFunction] = useState<(d: ITUData) => boolean>(
    () => () => true
  );
  const data = useFilteredData(filterFunction);

  useEffect(() => {
    console.log("Data changed!", data?.length, "lines of data");
  }, [data]);

  useEffect(() => {
    Forma.project.get().then(setProject).catch(console.error);
  }, []);

  useEffect(() => {
    if (!project) return;
    const geojson = translateGeojsonPolygons(
      geojsonRaw as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
      project
    );
    console.log(geojson);
    Forma.render.geojson.add({ geojson });
  }, [project]);

  return (
    <div style={{ height: "100%" }}>
      <Filters setFilterFunction={setFilterFunction} />
    </div>
  );
}

render(<App />, document.getElementById("app"));
