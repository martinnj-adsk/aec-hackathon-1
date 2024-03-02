import { Forma } from "forma-embedded-view-sdk/auto";
import { CameraState } from "forma-embedded-view-sdk/camera";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Project } from "forma-embedded-view-sdk/project";
import { GoogleMaps } from "./GoogleMaps";

function translateToUtm(
  geoJson: GeoJSON.FeatureCollection,
  projString: string
) {
  const { features } = geoJson;
  const projectedFeatures = features.map((feature: any) => {
    const { geometry, properties } = feature;
    const { coordinates } = geometry;
    return {
      ...geoJson,

      features: projectedFeatures,
    };
  });
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
