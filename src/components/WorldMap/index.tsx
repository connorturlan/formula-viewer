import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import Tracks from "./tracks-array.json";
import Trackmap from "./tracks-map.json";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/Addons.js";
import { UseSub } from "../../utils/pubsub";

export interface TrackInterface {
  name: string;
  size: number;
  lng: number;
  lat: number;
  model: string;
}

export interface TrackSelectEvent {
  trackIndex: number;
}

export function WorldMap({}) {
  const [labelSize, setLabelSize] = useState(1);
  const [trackModel, setTrackModel] = useState<
    THREE.Object3D<THREE.Object3DEventMap> | undefined
  >(undefined);

  const tracksData = Tracks.tracks.map((track) => {
    return {
      name: track.name,
      text: track.name,
      lat: track.lat,
      lng: track.lng,
      size: 0.1,
      color: "red",
      model: track.model,
    };
  });
  console.log(Tracks, tracksData);

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

  const loadTrack = (trackName: string) => {
    console.log(`loading ${trackName}`);

    const jsonloader = new STLLoader();

    jsonloader.load(
      trackName || "models/albert_park.stl",

      // onLoad callback
      // Here the loaded data is assumed to be an object
      function (geometry) {
        // Add the loaded object to the scene\
        const newObj = new THREE.Mesh(geometry);
        const scale = 0.01;
        newObj.scale.set(scale, scale, scale);
        const mat = new THREE.MeshBasicMaterial();
        mat.color = new THREE.Color(0x202020);
        newObj.material = mat;
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

  const onComponentLoad = () => {
    loadTrack("models/albert_park.stl");
  };

  const onLabelClick = (label: any, event, location) => {
    const trackIndicator = label as TrackInterface;
    moveCameraTo(
      trackIndicator.lng,
      trackIndicator.lat,
      0.1
    );
    loadTrack(label.model);
  };

  useEffect(onComponentLoad, []);

  UseSub("onTrackSelect", (e: any) => {
    console.log("selected track");

    const event = e as TrackSelectEvent;
    const track = Tracks.tracks.at(event.trackIndex);

    if (!track) {
      console.warn(
        `invalid track index provided ${event.trackIndex}`
      );
      return;
    }

    loadTrack(track.model);
    moveCameraTo(track.lng, track.lat, 0.1);
  });

  return (
    <Globe
      ref={globeEl}
      onGlobeReady={onReady}
      onZoom={onZoom}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png"
      globeTileEngineUrl={(x, y, level) =>
        `https://mt0.google.com/vt/lyrs=p&hl=en&x=${x}&y=${y}&z=${level}`
      }
      // pointsData={pData}
      // pointRadius={0.001}
      // onPointClick={(point, e, _) => {
      //   const trackIndicator = point as TrackInterface;
      //   window.alert(
      //     `point ${trackIndicator.name} clicked`
      //   );
      // }}
      // pointAltitude="size"
      // pointColor="red"
      labelsData={tracksData}
      onLabelClick={onLabelClick}
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
      objectsData={tracksData}
      objectThreeObject={trackModel}
    />
  );
}
