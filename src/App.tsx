import { useEffect, useRef, useState } from "react";
import styles from "./App.module.scss";
import { WorldMap } from "./components/WorldMap";
import { TrackList } from "./components/TrackList";
import { MapContainer } from "./components/MapContainer/MapContainer";
import { usePub } from "./utils/pubsub";
import {
  convertCoord,
  convertCoordToLatLon,
} from "./utils/utils";
import Layer from "ol/layer/Layer";
import { composeCssTransform } from "ol/transform";
import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Circle, Geometry, Point } from "ol/geom";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Text from "ol/style/Text";
import trackArray from "./components/WorldMap/tracks-array.json";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "./utils/defaults";
import { Image } from "ol/source";
import Icon from "ol/style/Icon";
import { SizeType } from "ol/expr/expression";

function App() {
  const publisher = usePub();
  const zLevel = useRef(1);

  const onMapMove = (event, map) => {
    const zoomLevel = map.getView().getZoom();
    zLevel.current = map.getView().getResolution();
    const coord = convertCoordToLatLon(
      map.getView().getCenter()
    );
    if (zoomLevel < 10) {
      publisher("toggle3DGlobe", {
        visible: true,
        lng: coord[0],
        lat: coord[1],
        altitude: 0.3,
      });
    }
    console.log(zLevel.current);
  };

  const duringMapMove = (event, map) => {
    const zoomLevel = map.getView().getZoom();
    zLevel.current = map.getView().getResolution();
    const coord = convertCoordToLatLon(
      map.getView().getCenter()
    );
    if (zoomLevel < 10) {
      publisher("toggle3DGlobe", {
        visible: true,
        lng: coord[0],
        lat: coord[1],
        altitude: 0.3,
      });
    }
    console.log(zLevel.current);
  };

  const trackSource = new VectorSource();
  const trackLayer = new VectorLayer({
    style: (feature) => {
      const track = feature as any;
      return new Style({
        image: new Icon({
          anchor: [0.48, 0.75],
          opacity: 1,
          src: track.get("image") || "red-pin.svg",
          height: 2350 / zLevel.current,
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

  return (
    <>
      <MapContainer
        layers={[trackLayer]}
        mapCenter={[144.97, -37.8503]}
        onMove={onMapMove}
        duringMove={onMapMove}
      />
      <WorldMap />
      <TrackList />
    </>
  );
}

export default App;
