import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import Tracks from "./tracks-array.json";
import Trackmap from "./tracks-map.json";
import * as THREE from "three";
import styles from "./WorldMap.module.scss";
import { STLLoader } from "three/examples/jsm/Addons.js";
import { usePub, UseSub } from "../../utils/pubsub";

const MOVE_DELAY = 2_000;
const MIN_ALTITUDE = 0.01;

export interface TrackInterface {
  name: string;
  size: number;
  lng: number;
  lat: number;
  model: string;
  index: number;
}

export interface TrackSelectEvent {
  trackIndex: number;
}

export function WorldMap({}) {
  const [labelSize, setLabelSize] = useState(1);
  const selectedTrack = useRef(0);
  const [loadedTrack, setLoadedTrack] = useState("");
  const [showGlobe, setGlobe] = useState(true);
  const [trackModel, setTrackModel] = useState<
    THREE.Object3D<THREE.Object3DEventMap> | undefined
  >(undefined);

  const publisher = usePub();

  const tracksData = Tracks.tracks.map((track, index) => {
    return {
      name: track.name,
      text: track.name,
      lat: track.lat,
      lng: track.lng,
      size: labelSize,
      color: "red",
      model: track.model,
      index,
    };
  });

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
      MOVE_DELAY
    );
  };

  const onReady = () => {
    moveCameraTo(138.599503, -34.92123, 1);

    globeEl.current
      ?.lights()
      .push(new THREE.AmbientLight());
  };

  const onZoom = (event: any) => {
    // setLabelSize(event.altitude);
    setGlobe(event.altitude >= MIN_ALTITUDE);
    if (event.altitude <= MIN_ALTITUDE) {
      publisher("MapMoveTo", {
        coord: [event.lat, event.lng],
      });
    }
  };

  const loadTrack = (trackName: string) => {
    trackName = trackName || "models/albert_park.stl";
    if (loadedTrack == trackName) return;
    setLoadedTrack(trackName);

    console.log(`loading ${trackName}`);

    const jsonloader = new STLLoader();

    jsonloader.load(
      trackName || "models/albert_park.stl",

      // onLoad callback
      // Here the loaded data is assumed to be an object
      function (geometry) {
        // Add the loaded object to the scene\
        const newObj = new THREE.Mesh(geometry);
        const scale = 0.000_125;
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

  const onLabelClick = (
    label: any,
    event: any,
    location: any
  ) => {
    const trackIndicator = label as TrackInterface;
    selectTrack({ trackIndex: trackIndicator.index });
  };

  const selectTrack = (event: TrackSelectEvent) => {
    const currentTrack = Tracks.tracks.at(
      selectedTrack.current
    )!;
    selectedTrack.current = event.trackIndex;
    const track = Tracks.tracks.at(event.trackIndex)!;

    loadTrack(track.model);
    // const midpoint = [
    //   ((currentTrack.lng + track.lng) % 360) / 2,
    //   ((currentTrack.lat + track.lat) % 180) / 2,
    // ];
    const midpoint = [track.lng, track.lat];
    moveCameraTo(midpoint[0], midpoint[1], 1);
    setTimeout(() => {
      publisher("MapMoveTo", {
        coord: [track.lat, track.lng],
      });
    }, MOVE_DELAY);
    setTimeout(() => {
      moveCameraTo(
        track.lng,
        track.lat,
        MIN_ALTITUDE - 0.001
      );
    }, MOVE_DELAY);
  };

  useEffect(onComponentLoad, []);

  UseSub("onTrackSelect", (e: any) => {
    selectTrack(e);
  });

  UseSub("toggle3DGlobe", (e: any) => {
    setGlobe(e.visible);
    const currentTrack = Tracks.tracks.at(
      selectedTrack.current
    )!;
    moveCameraTo(
      e.lng,
      e.lat,
      MIN_ALTITUDE + 0.01 //e.altitude
    );
  });

  return (
    <div
      className={
        showGlobe ? styles.OpacityShow : styles.OpacityHide
      }
      // style={{ opacity: "0.5" }}
    >
      <Globe
        ref={globeEl}
        onGlobeReady={onReady}
        onZoom={onZoom}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png"
        globeTileEngineUrl={(x, y, level) =>
          `https://mt0.google.com/vt/lyrs=p&hl=en&x=${x}&y=${y}&z=${level}`
        }
        // backgroundColor={showGlobe ? "#000011" : "#00000000"}
        // showAtmosphere={showGlobe}
        // showGlobe={showGlobe}
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
          return d.size;
        }}
        labelIncludeDot={false}
        // labelIncludeDot={false}
        objectsData={[
          tracksData.at(selectedTrack.current)!,
        ]}
        objectAltitude={0.00001}
        objectThreeObject={trackModel}
      />
    </div>
  );
}
