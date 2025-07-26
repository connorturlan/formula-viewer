import { useRef } from "react";
import { WorldMap } from "./components/WorldMap";
import { TrackList } from "./components/TrackList";
import { MapContainer } from "./components/MapContainer/MapContainer";
import { usePub } from "./utils/pubsub";
import { convertCoordToLatLon } from "./utils/utils";
import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature, Map } from "ol";
import { Point } from "ol/geom";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import trackArray from "./components/WorldMap/tracks-array.json";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "./utils/defaults";
import Icon from "ol/style/Icon";
import { ToastMessage } from "./components/ToastMessage";
import { SessionReplayer } from "./components/SessionReplayer";
import Text from "ol/style/Text";

const melbourne = [144.97, -37.8503];
// const spa = [5.971003, 50.4457];
// const singapore = [103.86663, 1.2878];

function App() {
  const publisher = usePub();
  const zLevel = useRef<number | undefined>(1);

  const onMapMove = (_event: any, map: Map) => {
    const zoomLevel = map.getView().getZoom()!;
    zLevel.current = map.getView().getResolution();
    const coord = convertCoordToLatLon(
      map.getView().getCenter() as [number, number]
    );
    if (zoomLevel < 10) {
      publisher("toggle3DGlobe", {
        visible: true,
        lng: coord[0],
        lat: coord[1],
        altitude: 0.3,
      });
    }
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
    style: (_feature) => {
      return new Style({
        zIndex:
          _feature.get("driver_position") ||
          _feature.get("driver") ||
          0,
        fill: new Fill({
          color: "#FFFFFF",
        }),
        stroke: new Stroke({
          color: `#${
            _feature.get("driver_colour") || "333"
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
          text: `${_feature.get("driver")}\n${_feature.get(
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
        layers={[trackLayer, locationLayer]}
        mapCenter={melbourne}
        onClick={undefined}
        onInit={undefined}
        onMove={onMapMove}
        duringMove={onMapMove}
      />
      <WorldMap />
      <TrackList>
        {/* <TrackReplayer
          origin={melbourne}
          driverLayer={locationLayer}
        /> */}
        <SessionReplayer
          origin={melbourne}
          driverLayer={locationLayer}
        />
        <ToastMessage />
      </TrackList>
    </>
  );
}

export default App;
