import { useEffect, useRef, useState } from "react";
import styles from "./TrackReplayer.module.scss";
import { usePub } from "../../utils/pubsub";
import Tracks from "../WorldMap/tracks-array.json";
import type {
  TrackInterface,
  TrackSelectEvent,
} from "../WorldMap";
import {
  LoadLocationData,
  Location,
  Position,
  type LocationData,
} from "../../services/OpenF1";
import type Layer from "ol/layer/Layer";
import type VectorLayer from "ol/layer/Vector";
import { Circle, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "../../utils/defaults";
import { Feature } from "ol";

const melbourne = [144.97, -37.8503];
const singapore = [5.971003, 50.4457];
// "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"

// sing 2023
// const start = new Date("2023-09-16T13:00:00+00:00");
// const end = new Date("2023-09-16T14:00:00+00:00");
// aus 2025
const start = new Date("2025-03-16T04:00:00+00:00");
const end = new Date("2025-03-16T06:00:00+00:00");
const lastPull = new Date(start.getTime());
const timePrecision = 1_000;
const timeResolution =
  (end.getTime() - start.getTime()) / timePrecision;

var timer: number;
const historyLength =
  ((end.getTime() - start.getTime()) / 1_000) * 4;

export const TrackReplayer = ({ origin, driverLayer }) => {
  const [timeValue, setTimeValue] = useState(0);
  const [time, setTime] = useState(start);
  console.log(historyLength);
  const [locationData, setLocationData] = useState<
    LocationData[]
  >(new Array(historyLength));

  const handleChange = (ev) => {
    // console.log("time:", ev.target.value);
    setTimeValue(Number(ev.target.value));
  };

  const interpolateTime = (value: number) => {
    const interpolatedTime =
      start.getTime() + value * timePrecision;

    console.log(
      `start: ${start.getTime()}, value: ${value}, interpolatedTime: ${interpolatedTime}, diff: ${
        value * timePrecision
      }`
    );

    const date = new Date(interpolatedTime);
    setTime(date);
    return date;
  };

  const indexTimestamp = (timestamp: Date) => {
    const d = new Date(timestamp);
    return (d.getTime() / 1_000) * 4;
  };

  const getLatestLocationData = (
    locations: LocationData[]
  ) => {
    const mappedLocations = locations.map((location) => {
      return {
        ...location,
        index: indexTimestamp(location.date),
      };
    });
    if (locationData.length > 0) {
      return mappedLocations.filter((location) => {
        return !locationData.at(location.index);
      });
    } else {
      return mappedLocations;
    }
  };

  const bufferLocationData = async (
    realtime: Date,
    bufferSeconds: number = 1
  ) => {
    if (time.getTime() < lastPull.getTime() + 2_000) {
      return;
    }

    // get the new locations.
    const res = await LoadLocationData(time, bufferSeconds);
    lastPull.setTime(realtime.getTime());
    const latest = getLatestLocationData(res);

    // append the new locations.
    const newLocations = locationData.slice();
    latest.forEach(
      (location) =>
        (newLocations[location.index] = location)
    );
    newLocations.push(...latest);

    setLocationData(newLocations);
  };

  const updateLocationsOnLayer = () => {
    const location = locationData.at(-1)!;
    // const resolution = 0.157;
    const resolution = 0.128;
    if (!location) return;

    // get source
    const source = (
      driverLayer as VectorLayer
    ).getSource()!;
    // source.clear();

    // create point
    const coord = fromLonLat(origin, PROJECTION);
    const point = new Circle(coord, 20);
    point.translate(
      location.x * resolution,
      location.y * resolution
    );

    // add feature
    source.addFeature(
      new Feature({
        geometry: point,
        image: "red-pin.svg",
      })
    );
  };

  const timeRef = useRef<number>(timeValue);
  const toggleTimer = (enabled: boolean) => {
    console.log(
      `timer is ${enabled ? "enabled" : "disabled"}`
    );
    clearInterval(timer);

    if (!enabled) return;

    if (timeRef.current > timeResolution) return;

    const seconds = 0.5;
    timer = setInterval(() => {
      setTimeValue(timeRef.current + seconds);
    }, seconds * 1_000);
  };

  useEffect(() => {
    console.log(`time: ${time.toISOString()}`);
    // bufferLocationData();
  }, [time]);

  useEffect(() => {
    console.log(
      `time: ${time.toISOString()}, value: ${timeValue}`
    );
    timeRef.current = timeValue;
    const realtime = interpolateTime(timeValue);
    bufferLocationData(realtime);
    updateLocationsOnLayer();
  }, [timeValue]);

  useEffect(() => {
    console.log(`location count: ${locationData.length}`);
  }, [locationData]);

  return (
    <div className={styles.Container}>
      <input
        className={styles.Input}
        type="range"
        min={0}
        max={timeResolution}
        value={timeValue}
        onChange={handleChange}
      />
      <input
        type="button"
        value={"start"}
        onClick={() => {
          toggleTimer(true);
        }}
      />
      <input
        type="button"
        value={"stop"}
        onClick={() => {
          toggleTimer(false);
        }}
      />
    </div>
  );
};
