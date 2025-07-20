import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import Tracks from "./tracks.json";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/Addons.js";

interface TrackInterface {
  name: string;
  size: number;
  lng: number;
  lat: number;
}

export function WorldMap({ pointCount = 300 }) {
  const [labelSize, setLabelSize] = useState(1);
  const [trackModel, setTrackModel] = useState<
    THREE.Object3D<THREE.Object3DEventMap> | undefined
  >(undefined);

  const N = pointCount;
  const gData = [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
    color: ["red", "white", "blue", "green"][
      Math.round(Math.random() * 3)
    ],
  }));

  const pData = Tracks.tracks.map((track) => {
    return {
      name: track.name,
      text: track.name,
      lat: track.lat,
      lng: track.lng,
      size: 0.0001,
      color: "red",
    };
  });
  const tData = Tracks.tracks.map((track) => {
    return {
      name: track.name,
      text: track.name,
      lat: track.lat,
      lng: track.lng,
      size: 0.1,
      color: "red",
    };
  });
  console.log(Tracks, tData);

  const globeEl = useRef<GlobeMethods | undefined>(
    undefined
  );

  const moveCameraTo = (
    lng: number,
    lat: number,
    altitude: number
  ) => {
    globeEl.current?.pointOfView(
      {
        lng: lng,
        lat: lat,
        altitude: altitude,
      },
      1000
    );
  };

  const onReady = () => {
    moveCameraTo(138.599503, -34.92123, 1);

    globeEl.current
      ?.lights()
      .push(new THREE.AmbientLight());
  };

  const onZoom = (ev) => {};

  const onComponentLoad = () => {
    const jsonloader = new STLLoader();
    const loader = new THREE.ObjectLoader();

    jsonloader.load(
      "models/albert_park.stl",

      // onLoad callback
      // Here the loaded data is assumed to be an object
      function (geometry) {
        // Add the loaded object to the scene\
        const newObj = new THREE.Mesh(geometry);
        const scale = 0.01;
        newObj.scale.set(scale, scale, scale);
        setTrackModel(newObj);
      },

      // onProgress callback
      function (xhr) {
        console.log(
          (xhr.loaded / xhr.total) * 100 + "% loaded"
        );
      },

      // onError callback
      function (err) {
        console.error("An error happened", err);
      }
    );
  };

  useEffect(onComponentLoad, []);

  return (
    <Globe
      ref={globeEl}
      onGlobeReady={onReady}
      onZoom={onZoom}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png"
      globeTileEngineUrl={(x, y, level) =>
        `https://mt0.google.com/vt/lyrs=p&hl=en&x=${x}&y=${y}&z=${level}`
      }
      pointsData={pData}
      pointRadius={0.001}
      onPointClick={(point, e, _) => {
        const trackIndicator = point as TrackInterface;
        window.alert(
          `point ${trackIndicator.name} clicked`
        );
      }}
      pointAltitude="size"
      pointColor="red"
      labelsData={tData}
      onLabelClick={(point, e, _) => {
        const trackIndicator = point as TrackInterface;
        // window.alert(`point ${trackIndicator.name} clicked`);
        moveCameraTo(
          trackIndicator.lng,
          trackIndicator.lat,
          0.1
        );
      }}
      labelColor={() => {
        return "red";
      }}
      // labelSize={(d) => Math.sqrt(d.properties.pop_max) * 4e-4}
      labelDotRadius={(d) => {
        const p = d as TrackInterface;
        return p.size;
      }}
      labelsTransitionDuration={0}
      labelSize={(d) => {
        return labelSize;
      }}
      objectsData={tData}
      objectThreeObject={trackModel}
    />
  );
}
