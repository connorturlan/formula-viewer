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
import { usePub, UseSub } from "../../utils/pubsub";
import {
  collectAllLocationData,
  collectAllPositionData,
  convertDataIntoFrames,
  convertPositionDataIntoFrames,
  type LocationTimeFrame,
  type PositionTimeFrame,
} from "./dataCollector";
import { DriverPositionList } from "../DriverPositionList";

// export enum Events {
//   ReplayerDriverDataUpdate = 1_000,
//   ReplayerDriverDataUpdate,
// }

// const melbourne = [144.97, -37.8503];
// const singapore = [5.971003, 50.4457];
// "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"

// sing 2023
// const start = new Date("2023-09-16T13:00:00+00:00");
// const end = new Date("2023-09-16T14:00:00+00:00");
// aus 2025
// const start = new Date("2025-03-16T04:00:00+00:00");
// const end = new Date("2025-03-16T05:00:00+00:00");
// const start = new Date("2025-03-16T04:00:00+00:00");
// const end = new Date("2025-03-16T04:02:00+00:00");
// const start = new Date("2025-03-16T04:18:06.734000+00:00");
// const end = new Date("2025-03-16T04:20:06.734000+00:00");
const dataFrequency = 3.7;
const framesPerSecond = 1 * dataFrequency;

export const SessionTimeKeeper = () => {
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);

  const [timer, setTimer] = useState<NodeJS.Timeout>(
    {} as NodeJS.Timeout
  );
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeValue, setTimeValue] = useState(start / 1_000);
  const [timePosition, setTime] = useState(start);
  const [events, setEvents] = useState<any[]>([]);
  const [lastEventIndex, setLastEventIndex] = useState(0);

  // 9693 is melbourne
  const [sessionKey, setSessionKey] = useState<number>(0);

  const [loadingTotal, setLoadingTotal] = useState(-1);
  const [loadingValue, setLoadingValue] = useState(-1);

  const publisher = usePub();

  const handleChange = (ev: any) => {
    // console.log("time:", ev.target.value);
    setTimeValue(Number(ev.target.value));
  };

  const realtimeRef = useRef<number>(start);
  const toggleTimer = (enabled: boolean) => {
    setTimerEnabled(enabled);
    console.log(
      `timer is ${enabled ? "enabled" : "disabled"}`
    );
    clearInterval(timer);

    if (!enabled) return;

    const timestep = (1 / framesPerSecond) * 1_000;
    const timerId = setInterval(() => {
      realtimeRef.current += timestep;
      setTime(realtimeRef.current);
    }, timestep);
    setTimer(timerId);
  };

  // const timeRef = useRef<number>(timeValue);
  // const toggleTickTimer = (enabled: boolean) => {
  //   setTimerEnabled(enabled);
  //   console.log(
  //     `timer is ${enabled ? "enabled" : "disabled"}`
  //   );
  //   clearInterval(timer);

  //   if (!enabled) return;

  //   if (timeRef.current > timeResolution) {
  //     return;
  //   }

  //   const seconds = 1 / dataFrequency;
  //   timer = setInterval(() => {
  //     setTimeValue(timeRef.current + 1);
  //   }, seconds * 1_000);
  // };

  const loadAll = async () => {
    if (!sessionKey) return;

    const newEvents = [] as any[];
    publisher("InfoMessage", {
      message: `Loading session data...`,
    });
    const data = await collectAllLocationData(
      sessionKey,
      120
    );
    const frames = await convertDataIntoFrames(data);
    newEvents.push(...frames);

    const posData = await collectAllPositionData(
      sessionKey
    );
    const posFrames = await convertPositionDataIntoFrames(
      posData
    );
    newEvents.push(...posFrames);

    const [drivers, err] = await Drivers(sessionKey);
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

    newEvents.sort((a, b) => {
      return (
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
      );
    });
    setEvents(newEvents);

    publisher("InfoMessage", {
      message: `Session loaded!`,
    });
    publisher("ErrorMessage", {
      message: `Session loaded!`,
    });
    publisher("ReplayerDriverDataUpdate", {
      data: driverMap,
    });
  };

  useEffect(() => {
    if (events.length <= 0) return;
    const firstEvent = events.at(0)!;
    const newStart = new Date(
      firstEvent.timestamp
    ).getTime();
    setStart(newStart);
    const lastEvent = events.at(-1)!;
    setEnd(new Date(lastEvent.timestamp).getTime());

    console.log(events, firstEvent, newStart);
    setTimeValue(newStart);
  }, [events]);

  UseSub("LoadSession", (event: any) => {
    setSessionKey(event.sessionKey);
  });

  useEffect(() => {
    setEvents([]);
    loadAll();
  }, [sessionKey]);

  const prefire = useRef(0);
  useEffect(() => {
    prefire.current = prefire.current + 1;
    if (prefire.current > 1) return;

    loadAll();
  }, []);

  useEffect(() => {
    console.debug(
      `time: ${new Date(
        timePosition
      ).toISOString()}, value: ${timeValue}`
    );
    realtimeRef.current = timeValue * 1_000;
    setTime(timeValue * 1_000);
    setLastEventIndex(0);
  }, [timeValue]);

  const log = (s: string) => {
    console.log(`${timePosition}:\t${s}`);
  };

  useEffect(() => {
    log(`time tick, ${events.length} events exist`);
    // check that the next event will trigger, otherwise return
    if (events.length <= 0) return;
    const futureEvents = events.slice(lastEventIndex);
    if (
      new Date(futureEvents.at(0).timestamp).getTime() >
      timePosition
    ) {
      return;
    }

    const lastIndex = futureEvents.findIndex((event) => {
      return (
        new Date(event.timestamp).getTime() >= timePosition
      );
    });
    setLastEventIndex(lastEventIndex + lastIndex + 1);

    const triggeredEvents = events.slice(
      lastEventIndex,
      lastEventIndex + lastIndex
    );
    log(`triggering ${triggeredEvents.length} events`);

    publisher("ReplayerEventUpdate", {
      events: triggeredEvents,
    });
  }, [timePosition]);

  UseSub("LocationDataLoad", (event: any) => {
    setLoadingValue(event.progress);
    setLoadingTotal(event.total);
  });

  return (
    <div className={styles.Container}>
      <div className={styles.ContainerSection}>
        {loadingValue < loadingTotal && (
          <>
            <input
              className={`${styles.Input} ${styles.InputLoader}`}
              type="range"
              min={0}
              max={loadingTotal}
              value={loadingValue}
              readOnly
            />
            <span
              className={`${styles.InputLoaderSpinner} ${styles.InputLoaderFlag}`}
            ></span>
          </>
        )}
      </div>
      <div className={styles.ContainerSection}>
        <input
          className={styles.Input}
          type="range"
          min={start / 1_000}
          max={end / 1_000}
          value={timeValue}
          onChange={handleChange}
        />
        <button
          onClick={() => {
            toggleTimer(!timerEnabled);
          }}
        >
          {timerEnabled ? "⏸" : "⏵"}
        </button>
        <p>{new Date(timePosition).toISOString()}</p>
      </div>
    </div>
  );
};

export const DriverLocationReplayer = ({
  origin,
  driverLayer,
}: any) => {
  const [lastLocationEvent, setLastLocation] = useState<
    LocationTimeFrame | undefined
  >(undefined);
  const [driverData, setDriverData] = useState<
    Map<number, DriverData>
  >(new Map<number, DriverData>());

  // const publisher = usePub();

  const updateLocationsOnLayer = () => {
    if (!lastLocationEvent) return;

    const frame = lastLocationEvent;
    const resolution = 0.128;
    const translateX = 30;
    const resolutionX = resolution;
    const translateY = 220;
    const resolutionY = resolution;
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
        data.x * resolutionX + translateX,
        data.y * resolutionY + translateY
      );

      const driverName =
        driverData.get(driverNumber)?.name_acronym || "";
      const driverColour =
        driverData.get(driverNumber)?.team_colour || "";

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

  useEffect(() => {
    updateLocationsOnLayer();
  }, [lastLocationEvent]);

  UseSub("ReplayerDriverDataUpdate", (event: any) => {
    setDriverData(event.data as Map<number, DriverData>);
  });

  UseSub("ReplayerEventUpdate", (event: any) => {
    event.events.forEach((event: any) => {
      if (event.locations) {
        setLastLocation(event as LocationTimeFrame);
      }
    });
  });

  return <></>;
};

export const DriverPositionReplayer = () => {
  const [driverData, setDriverData] = useState<
    Map<number, DriverData>
  >(new Map<number, DriverData>());
  const [driverPositions, setDriverPositions] = useState<
    number[]
  >([]);
  const [positionsGained, setPositionsGained] = useState<
    number[]
  >([]);
  const [positionsLost, setPositionsLost] = useState<
    number[]
  >([]);

  const updatePositions = (event: PositionTimeFrame) => {
    const newPositions = driverPositions.slice();
    const positionMap = new Map<number, number>();
    driverPositions.forEach((driver, index) =>
      positionMap.set(driver, index)
    );

    const gained: number[] = [];
    const lost: number[] = [];

    Array.from(event.positions.entries()).forEach(
      ([driverNumber, position]: [number, number]) => {
        while (newPositions.length < position) {
          newPositions.push(-1);
        }
        newPositions[position - 1] = driverNumber;

        if (position - 1 < positionMap.get(driverNumber)!)
          gained.push(driverNumber);
        if (position - 1 > positionMap.get(driverNumber)!)
          lost.push(driverNumber);
      }
    );

    setDriverPositions(newPositions);
    setPositionsGained(gained);
    setPositionsLost(lost);
  };

  UseSub("ReplayerDriverDataUpdate", (event: any) => {
    setDriverData(event.data as Map<number, DriverData>);
  });

  UseSub("ReplayerEventUpdate", (event: any) => {
    event.events.forEach((event: any) => {
      if (event.positions) {
        updatePositions(event);
      }
    });
  });

  return (
    <DriverPositionList
      driverData={driverData}
      positions={driverPositions}
      positionsGained={positionsGained}
      positionsLost={positionsLost}
    />
  );
};

// export const RaceControlReplayer = () => {
//   const [driverData, setDriverData] = useState<
//     Map<number, DriverData>
//   >(new Map<number, DriverData>());

//   UseSub("ReplayerDriverDataUpdate", (event: any) => {
//     setDriverData(event.data as Map<number, DriverData>);
//   });

//   UseSub("ReplayerEventUpdate", (event: any) => {
//     event.events.forEach((event: any) => {
//       if (event.positions) {
//       }
//     });
//   });

//   return <></>;
// };
