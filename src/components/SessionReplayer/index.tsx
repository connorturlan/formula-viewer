import { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import {
  Drivers,
  type DriverData,
} from "../../services/OpenF1";
import type VectorLayer from "ol/layer/Vector";
import { Circle } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { PROJECTION } from "../../utils/defaults";
import { Feature } from "ol";
import { usePub } from "../../utils/pubsub";
import {
  collectAllData,
  convertDataIntoFrames,
  type TimeFrame,
} from "./dataCollector";

// const melbourne = [144.97, -37.8503];
// const singapore = [5.971003, 50.4457];
// "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"

// sing 2023
// const start = new Date("2023-09-16T13:00:00+00:00");
// const end = new Date("2023-09-16T14:00:00+00:00");
// aus 2025
const start = new Date("2025-03-16T04:00:00+00:00");
const end = new Date("2025-03-16T04:10:00+00:00");
// const end = new Date("2025-03-16T06:00:00+00:00");
const dataFrequency = 3.7;
const timePrecision = 1_000 / dataFrequency;
const timeResolution =
  (end.getTime() - start.getTime()) / timePrecision;

var timer: number;
const historyLength = Math.round(
  ((end.getTime() - start.getTime()) / 1_000) *
    dataFrequency
);

export const SessionReplayer = ({
  origin,
  driverLayer,
}: any) => {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeValue, setTimeValue] = useState(0);
  const [timePosition, setTime] = useState(start);

  const [driverLocationData, setDriverLocationData] =
    useState<TimeFrame[]>(new Array(historyLength));
  const [driverData, setDriverData] = useState<
    Map<number, DriverData>
  >(new Map<number, DriverData>());

  const publisher = usePub();

  const handleChange = (ev: any) => {
    // console.log("time:", ev.target.value);
    setTimeValue(Number(ev.target.value));
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

  const updateLocationsOnLayer = () => {
    // console.log(
    //   `${locationData.at(timeValue - 1)} ${
    //     locationData.length
    //   }`
    // );
    const frame = driverLocationData.at(timeValue)!;
    // const resolution = 0.157;
    const resolution = 0.128;
    if (!frame) return;

    // get source
    const source = (
      driverLayer as VectorLayer
    ).getSource()!;
    source.clear();

    // create point
    frame.locations.forEach((data, driverNumber) => {
      const coord = fromLonLat(origin, PROJECTION);
      const point = new Circle(coord, 20);
      point.translate(
        data.x * resolution + 30,
        data.y * resolution + 170
      );

      const driverName =
        driverData.get(driverNumber)?.name_acronym || "";
      const driverColour =
        driverData.get(driverNumber)?.team_colour || "";
      console.log(
        driverNumber,
        driverData.get(driverNumber)
      );

      // add feature
      source.addFeature(
        new Feature({
          geometry: point,
          image: "red-pin.svg",
          driver: driverNumber,
          driver_name: driverName,
          driver_colour: driverColour,
        })
      );
    });
  };

  const timeRef = useRef<number>(timeValue);
  const toggleTimer = (enabled: boolean) => {
    console.log(
      `timer is ${enabled ? "enabled" : "disabled"}`
    );
    clearInterval(timer);
    setTimerEnabled(enabled);

    if (!enabled) return;

    if (timeRef.current > timeResolution) return;

    const seconds = 1 / dataFrequency;
    timer = setInterval(() => {
      setTimeValue(timeRef.current + 1);
    }, seconds * 1_000);
  };

  useEffect(() => {
    // bufferLocationData();
  }, [timePosition]);

  const prefire = useRef(0);

  useEffect(() => {
    prefire.current = prefire.current + 1;
    if (prefire.current > 1) return;

    const f = async () => {
      publisher("InfoMessage", {
        message: `Loading session data...`,
      });
      const data = await collectAllData(start, end, 120);
      const frames = await convertDataIntoFrames(data);
      console.log(data.length, data.at(0));
      console.log(frames.length, frames.slice(0, 10));
      setDriverLocationData(frames);

      const [drivers, err] = await Drivers(9693);
      if (err) {
        publisher("ErrorMessage", {
          message: `Unable to get driver data: ${err.message}. Please try again later.`,
        });
        console.error("unable to get driver data.", err);
      }
      const driverMap = new Map<number, DriverData>();
      drivers.forEach((driver) => {
        driverMap.set(driver.driver_number, driver);
      });
      setDriverData(driverMap);

      publisher("InfoMessage", {
        message: `Session loaded!`,
      });
    };
    f();
  }, []);

  useEffect(() => {
    console.log(driverData);
  }, [driverData]);

  useEffect(() => {
    console.log(
      driverLocationData.length,
      driverLocationData.slice(0, 10)
    );
  }, [driverLocationData]);

  useEffect(() => {
    console.debug(
      `time: ${timePosition.toISOString()}, value: ${timeValue}`
    );
    // timeRef.current = timeValue;
    setTime(interpolateTime(timeValue));
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
      {timerEnabled ? (
        <input
          type="button"
          value={"PAUSE"}
          onClick={() => {
            toggleTimer(false);
          }}
        />
      ) : (
        <input
          type="button"
          value={"PLAY"}
          onClick={() => {
            toggleTimer(true);
          }}
        />
      )}
    </div>
  );
};
