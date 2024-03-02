import { Forma } from "forma-embedded-view-sdk/auto";
import { CameraState } from "forma-embedded-view-sdk/camera";
import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { Project } from "forma-embedded-view-sdk/project";
import { GoogleMaps } from "./GoogleMaps";
import geojsonRaw from "./ITU_data.json";
import proj4 from "proj4";

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

  useEffect(() => {
    Forma.project.get().then(setProject).catch(console.error);
  }, []);

  const [currentCamera, setCurrentCamera] = useState<CameraState>();
  const [initialCamera, setInitialCamera] = useState<CameraState>();

  useEffect(() => {
    if (!project) return;
  }, [project]);

  useEffect(() => {
    Forma.camera.getCurrent().then(async (res) => {
      setCurrentCamera(res);
      setInitialCamera(res);
    });
    Forma.camera.subscribe(setCurrentCamera);
  }, [setCurrentCamera, setInitialCamera]);

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
    <div>
      <GoogleMaps />
      <h2>current Camera position</h2>
      <div>
        <pre>{JSON.stringify(currentCamera, null, 2)}</pre>
      </div>
      <div>
        <h2>initial Camera position</h2>
        <pre>{JSON.stringify(initialCamera, null, 2)}</pre>
      </div>
      <button
        onClick={() =>
          Forma.camera.move({ ...initialCamera, transitionTimeMs: 1000 })
        }
      >
        Reset to original position
      </button>
    </div>
  );
}

render(<App />, document.getElementById("app"));
