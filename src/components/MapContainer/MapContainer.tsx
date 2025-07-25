import { useEffect, useRef, useState } from "react";
import styles from "./MapContainer.module.scss";

// openlayers
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { PROJECTION } from "../../utils/defaults";
import { transform } from "ol/proj";
import {
  convertCoord,
  convertCoordFromLatLon,
  ObjectIsEmpty,
} from "../../utils/utils";
import { UseSub } from "../../utils/pubsub";

const DEFAULT_ZOOM = 12;

const mapLayer = new TileLayer({
  source: new XYZ({
    url: "https://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}",
    transition: 0,
  }),
});

export const MapContainer = ({
  layers,
  onInit,
  onClick,
  onMove,
  duringMove,
  mapCenter,
}: any) => {
  const [map, setMap] = useState<Map>();
  // const [mapLayers, setMapLayers] = useState();

  const renderCount = useRef(0);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<View>(undefined);

  const mapRef = useRef<Map>(undefined);
  mapRef.current = map;

  const mapLayers = useRef<TileLayer<XYZ>[]>([]);
  mapLayers.current = [mapLayer, ...layers];

  UseSub("MapMoveTo", (newView: any) => {
    if (
      ObjectIsEmpty(newView) ||
      !newView.coord ||
      newView.coord.length <= 0
    ) {
      console.error(
        `[MAP]<event> map move triggered to invalid position. ${newView}`
      );
      return;
    }
    console.log(
      `[MAP]<event> map move to ${newView.coord}`
    );
    // mapRef.current?.getView().animate({
    //   center: convertCoordFromLatLon(newView.coord),
    //   zoom: 10.1,
    // });
    mapRef.current?.getView().animate({
      center: convertCoordFromLatLon(newView.coord),
      // duration: 2_000,
      zoom: DEFAULT_ZOOM,
    });
  });

  UseSub("MapFitTo", (newExtent: any) => {
    if (ObjectIsEmpty(newExtent)) {
      console.error(
        `[MAP]<event> map move triggered to invalid position. ${newExtent}`
      );
      return;
    }

    console.log(`[MAP]<event> map move to ${newExtent}`);
    const map = mapRef.current!;
    map.getView().fit(newExtent, {
      size: map.getSize(),
      minResolution: 2,
      duration: 800,
      padding: [48, 48, 48, 48],
    });
  });

  useEffect(() => {
    if (renderCount.current > 0) return;
    renderCount.current = 1;

    const view = new View({
      projection: PROJECTION,
      center: transform(mapCenter, "EPSG:4326", PROJECTION),
      zoom: DEFAULT_ZOOM,
    });
    viewRef.current = view;

    const initialMap = new Map({
      target: mapElement.current!,
      layers: mapLayers.current,
      view,
      controls: [],
    });

    initialMap.on("singleclick", (event) => {
      onClick && onClick(event, mapRef.current);
    });

    // initialMap.on("pointermove", function (e) {
    //   const pixel = initialMap.getEventPixel(
    //     e.originalEvent
    //   );
    //   const hit = initialMap.hasFeatureAtPixel(pixel);
    //   initialMap.getTarget()!.style.cursor = hit
    //     ? "pointer"
    //     : "";
    // });

    initialMap.on("moveend", (event) => {
      onMove && onMove(event, mapRef.current);
    });

    initialMap.on("postrender", (event) => {
      duringMove && duringMove(event, mapRef.current);
    });

    initialMap.on("change", (event) => {
      duringMove && duringMove(event, mapRef.current);
    });

    // initialMap.on("mapzioom", (event) => {
    //   duringMove && duringMove(event, mapRef.current);
    // });

    setMap(initialMap);
    mapRef.current = initialMap;
    onInit && onInit(initialMap);
  }, []);

  useEffect(() => {
    console.debug("[MAP] updating layers");
    if (!map) return;
    map.setLayers(mapLayers.current);
  }, [layers]);

  useEffect(() => {
    console.debug("[MAP] updating center");
    if (!map) return;
    map.getView().animate({
      center: convertCoord(mapCenter),
      duration: 1000,
    });
  }, [mapCenter]);

  return (
    <div
      ref={mapElement}
      className={styles.MapContainer}
    ></div>
  );
};
