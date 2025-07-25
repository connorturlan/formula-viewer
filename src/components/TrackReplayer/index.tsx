import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import styles from "./TrackReplayer.module.scss";
import {
  LoadLocationData,
  type LocationData,
} from "../../services/OpenF1";
import type VectorLayer from "ol/layer/Vector";
import { Circle } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "../../utils/defaults";
import { Feature } from "ol";

// const melbourne = [144.97, -37.8503];
// const singapore = [5.971003, 50.4457];
// "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"

// sing 2023
// const start = new Date("2023-09-16T13:00:00+00:00");
// const end = new Date("2023-09-16T14:00:00+00:00");
// aus 2025
const start = new Date("2025-03-16T04:00:00+00:00");
const end = new Date("2025-03-16T06:00:00+00:00");
const lastPull = new Date(start.getTime());
const dataFrequency = 3.7;
const timePrecision = 1_000 / dataFrequency;
const timeResolution =
  (end.getTime() - start.getTime()) / timePrecision;

var timer: number;
const historyLength = Math.round(
  ((end.getTime() - start.getTime()) / 1_000) *
    dataFrequency
);

export const TrackReplayer = ({
  origin,
  driverLayer,
}: any) => {
  const [timeValue, setTimeValue] = useState(0);
  const [time, setTime] = useState(start);
  const [rateLimit, toggleRateLimit] = useState(false);
  const [locationData, setLocationData] = useState<
    LocationData[]
  >(new Array(historyLength));

  const handleChange = (ev: ChangeEvent) => {
    // console.log("time:", ev.target.value);
    setTimeValue(Number(ev.target.nodeValue));
  };

  const interpolateTime = (value: number) => {
    const interpolatedTime =
      start.getTime() + value * timePrecision;

    console.debug(
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
    return Math.round(
      ((d.getTime() - start.getTime()) / 1_000) *
        dataFrequency
    );
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
    bufferSeconds: number = 10
  ) => {
    if (rateLimit) {
      return;
    }
    toggleRateLimit(true);
    setTimeout(() => {
      toggleRateLimit(false);
    }, 5_000);

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

    setLocationData(newLocations);
  };

  const updateLocationsOnLayer = () => {
    // console.log(
    //   `${locationData.at(timeValue - 1)} ${
    //     locationData.length
    //   }`
    // );
    const location =
      locationData.at(timeValue + 1)! ||
      locationData.at(timeValue)! ||
      locationData.at(timeValue - 1)!;
    // const resolution = 0.157;
    const resolution = 0.128;
    if (!location) return;

    // get source
    const source = (
      driverLayer as VectorLayer
    ).getSource()!;
    source.clear();

    // create point
    const coord = fromLonLat(origin, PROJECTION);
    const point = new Circle(coord, 20);
    point.translate(
      location.x * resolution + 30,
      location.y * resolution + 170
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

    const seconds = 1 / dataFrequency;
    timer = setInterval(() => {
      setTimeValue(timeRef.current + 1);
    }, seconds * 1_000);
  };

  useEffect(() => {
    // bufferLocationData();
  }, [time]);

  useEffect(() => {
    console.debug(
      `time: ${time.toISOString()}, value: ${timeValue}`
    );
    timeRef.current = timeValue;
    const realtime = interpolateTime(timeValue);
    bufferLocationData(realtime);
    updateLocationsOnLayer();
  }, [timeValue]);

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
