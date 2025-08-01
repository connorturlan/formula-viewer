import React, { useEffect, useRef, useState } from "react";
import { WorldMap } from "./components/WorldMap";
import { TrackList } from "./components/TrackList";
import { MapContainer } from "./components/MapContainer/MapContainer";
import { usePub, UseSub } from "./utils/pubsub";
import { convertCoordToLatLon } from "./utils/utils";
import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature, Map } from "ol";
import { Point } from "ol/geom";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import trackArray from "./components/WorldMap/tracks-array.json";
import trackData from "./components/WorldMap/track-data.json";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "./utils/defaults";
import Icon from "ol/style/Icon";
import { ToastMessage } from "./components/ToastMessage";
import {
  DriverLocationReplayer,
  DriverPositionReplayer,
  SessionTimeKeeper,
} from "./components/SessionReplayer";
import Text from "ol/style/Text";
import styles from "./App.module.scss";
import Layer from "ol/layer/Layer";
import { createRoot } from "react-dom/client";
import { composeCssTransform } from "ol/transform";

const melbourne = [144.97, -37.8503];
// const spa = [5.971003, 50.4457];
// const singapore = [103.86663, 1.2878];

function App() {
  const publisher = usePub();
  const zLevel = useRef<number | undefined>(1);
  const [mapOrigin, setMapOrigin] =
    useState<number[]>(melbourne);

  const onMapMove = (_event: any, map: Map) => {
    const zoomLevel = map.getView().getZoom()!;
    zLevel.current = map.getView().getResolution();
    const coord = convertCoordToLatLon(
      map.getView().getCenter() as [number, number]
    );
    // setMapOrigin(coord);
    if (zoomLevel < 10) {
      publisher("toggle3DGlobe", {
        visible: true,
        lng: coord[0],
        lat: coord[1],
        altitude: 0.3,
      });
    }
  };

  UseSub("LoadTrack", (event: any) => {
    const { trackName } = event;
    const track = trackData.find(
      (item) => item.name === trackName
    );
    if (!track) return;

    setMapOrigin([track.lng, track.lat]);
    setX(track.width!);
    setY(track.height!);
    setR(track.resolution!);
  });

  const [scaleX, setX] = useState(96);
  const [scaleY, setY] = useState(152);
  const [scaleR, setR] = useState(23.8);

  useEffect(() => {
    console.log(scaleX, scaleY, scaleR.toFixed(1));
  }, [scaleX, scaleY, scaleR]);

  // const trackSource = new VectorSource();
  const svgGroup = document.createElement("div");

  // const track = trackData.find(
  //   (track) => track.name === "Melbourne"
  // );

  trackData.forEach((track) => {
    const svgContainer = document.createElement("div");
    svgGroup.appendChild(svgContainer);
    const svgImage = document.createElement("img");
    svgImage.src = track!.image;
    svgContainer.appendChild(svgImage);

    let width = scaleX || track!.width || 96;
    let height = scaleY || track!.height || 152;
    let svgResolution = scaleR || track!.resolution || 23.8;
    svgContainer.setAttribute("width", String(width));
    svgContainer.setAttribute("height", String(height));
    svgContainer.setAttribute(
      "resolution",
      String(svgResolution)
    );
    svgContainer.setAttribute(
      "lng",
      String(track?.lng || 0)
    );
    svgContainer.setAttribute(
      "lat",
      String(track?.lat || 0)
    );
    svgContainer.style.width = width + "px";
    svgContainer.style.height = height + "px";
    svgContainer.style.transformOrigin = "top left";
    svgContainer.className = "svg-layer";
    svgContainer.style.position = "absolute";
    svgContainer.style.userSelect = "none";
  });

  const svgLayerRef = useRef<Layer>(new Layer({}));
  svgLayerRef.current = new Layer({
    // const svgLayer = new Layer({
    render: (frameState) => {
      Array.from(svgGroup.children).forEach((container) => {
        const lng = Number(container.getAttribute("lng"));
        const lat = Number(container.getAttribute("lat"));
        const trackCoord = [lng, lat];

        const width = Number(
          container.getAttribute("width")
        );
        const height = Number(
          container.getAttribute("height")
        );
        const resolution = Number(
          container.getAttribute("resolution")
        );
        const scale =
          resolution / frameState.viewState.resolution;
        const center = frameState.viewState.center;
        const size = frameState.size;
        const coord = fromLonLat(trackCoord);
        const cssTransform = composeCssTransform(
          size[0] / 2,
          size[1] / 2,
          scale,
          scale,
          frameState.viewState.rotation,
          -(center[0] - coord[0]) / resolution - width / 2,
          (center[1] - coord[1]) / resolution - height / 2
        );
        (container as HTMLDivElement).style.transform =
          cssTransform;
        (container as HTMLDivElement).style.opacity =
          String(0.5);
      });
      return svgGroup;
    },
  });

  const trackSource = new VectorSource();
  const trackLayer = new VectorLayer({
    style: (feature) => {
      const track = feature as any;
      return new Style({
        image: new Icon({
          anchor: [0.48, 0.75],
          opacity: 1,
          src: track.get("image") || "red-pin.svg",
          height: 2350 / zLevel.current!,
        }),
        fill: new Fill({
          color: "#5556",
        }),
        stroke: new Stroke({
          color: "orange",
          width: 2,
          miterLimit: 2,
        }),
      });
    },
    source: trackSource,
  });
  trackArray.tracks.forEach((track) => {
    const point = new Point(
      fromLonLat([track.lng, track.lat], PROJECTION)
    );
    trackSource.addFeature(
      new Feature({
        geometry: point,
        image: track.image,
      })
    );
  });

  const locationSource = new VectorSource();
  const locationLayer = new VectorLayer({
    style: (feature) => {
      return new Style({
        zIndex:
          feature.get("driver_position") ||
          feature.get("driver") ||
          0,
        fill: new Fill({
          color: "#FFFFFF",
        }),
        stroke: new Stroke({
          color: `#${
            feature.get("driver_colour") || "333"
          }`,
          width: 6,
          miterLimit: 2,
        }),
        text: new Text({
          justify: "center",
          textBaseline: "top",
          offsetY: -4.5,
          font: "bold 9pt  sans-serif",
          fill: new Fill({
            color: "#222",
          }),
          padding: [2, 4, 2, 4],
          text: `${feature.get("driver")}\n${feature.get(
            "driver_name"
          )}`,
          stroke: new Stroke({
            color: "#FFFFFF",
            width: 4,
            miterLimit: 2,
          }),
        }),
      });
    },
    source: locationSource,
  });

  return (
    <>
      <MapContainer
        layers={[svgLayerRef.current, locationLayer]}
        mapCenter={mapOrigin}
        onClick={undefined}
        onInit={undefined}
        onMove={onMapMove}
        duringMove={onMapMove}
      />
      {/* <WorldMap /> */}
      <div className={styles.Container}>
        <ToastMessage />
        <TrackList />
        <SessionTimeKeeper />
        <DriverLocationReplayer
          origin={mapOrigin}
          driverLayer={locationLayer}
        />
        <DriverPositionReplayer />
        <div style={{ pointerEvents: "all" }} hidden>
          <input
            type="range"
            min={0}
            max={200}
            value={scaleX}
            onChange={(e) => {
              setX(Number(e.target.value));
            }}
            onWheel={(e) => {
              e.stopPropagation();
              setX(scaleX + Math.sign(Number(e.deltaY)));
            }}
          ></input>
          <input
            type="range"
            min={0}
            max={200}
            value={scaleY}
            onChange={(e) => {
              setY(Number(e.target.value));
            }}
            onWheel={(e) => {
              e.stopPropagation();
              setY(scaleY + Math.sign(Number(e.deltaY)));
            }}
          ></input>
          <input
            type="range"
            min={0}
            max={50}
            value={scaleR}
            onChange={(e) => {
              setR(Number(e.target.value));
            }}
            onWheel={(e) => {
              e.stopPropagation();
              setR(
                scaleR + Math.sign(Number(e.deltaY)) / 10
              );
            }}
          ></input>
        </div>
      </div>
    </>
  );
}

export default App;
