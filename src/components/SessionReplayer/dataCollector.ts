import {
  GetSessionFromSessionKey,
  LoadLocationData,
  Position,
  type LocationData,
  type PositionData,
} from "../../services/OpenF1";
import { usePub } from "../../utils/pubsub";

export interface EventTimeFrame {
  timestamp: Date;
}

async function collectDataChunk(
  sessionKey: number,
  start: Date,
  end: Date
): Promise<LocationData[]> {
  const buffer = (end.getTime() - start.getTime()) / 1_000;

  const [res, err] = await LoadLocationData(
    sessionKey,
    start,
    buffer
  );
  if (err) {
    console.error("Error while fetching chunk.");
  }

  return res;
}

export async function collectAllLocationData(
  sessionKey: number,
  timestep: number
): Promise<LocationData[]> {
  const [sessionData, err] = await GetSessionFromSessionKey(
    sessionKey
  );
  if (err) {
    console.error(err.message);
    return [];
  }

  const { date_start, date_end } = sessionData;
  const start = new Date(date_start);
  const end = new Date(date_end);

  const idate = new Date(start.getTime());
  const chunks: LocationData[] = [];
  const total =
    (end.getTime() - start.getTime()) / (timestep * 1_000) -
    1;

  const publisher = usePub();

  while (idate.getTime() < end.getTime()) {
    const index =
      (idate.getTime() - start.getTime()) /
      (timestep * 1_000);
    console.debug(`getting chunk ${index}/${total}`);

    const jdate = new Date(
      idate.getTime() + timestep * 1_000
    );

    const res = await collectDataChunk(
      sessionKey,
      idate,
      jdate
    );
    chunks.push(...res);
    idate.setTime(jdate.getTime());

    publisher("LocationDataLoad", {
      progress: index,
      total,
    });
  }
  return chunks;
}

export type TimeLocationData = {
  x: number;
  y: number;
  z: number;
};

export type LocationTimeFrame = {
  timestamp: Date;
  locations: Map<number, TimeLocationData>;
};

function convertDataChunkIntoFrames(
  locationData: LocationData[]
): LocationTimeFrame {
  const frame: LocationTimeFrame = {
    timestamp: locationData.at(0)!.date!,
    locations: new Map<number, TimeLocationData>(),
  };

  locationData.forEach((location) => {
    const { x, y, z } = location;
    frame.locations.set(location.driver_number, {
      x,
      y,
      z,
    });
  });

  return frame;
}

export async function convertDataIntoFrames(
  locationData: LocationData[]
): Promise<LocationTimeFrame[]> {
  let idate = locationData.at(0)!.date;
  let chunk: LocationData[] = [];
  const frames: LocationTimeFrame[] = [];

  locationData.forEach((location) => {
    if (location.date != idate) {
      const frame = convertDataChunkIntoFrames(
        chunk.slice()
      );
      frames.push(frame);
      chunk = [];
      idate = location.date;
    }
    chunk.push(location);
  });

  return frames;
}

export type PositionTimeFrame = {
  timestamp: Date;
  positions: Map<number, number>;
};

export async function collectAllPositionData(
  sessionKey: number
): Promise<Promise<PositionData[]>> {
  const [res, err] = await Position(sessionKey);
  if (err) {
    console.error("Error while fetching chunk.");
  }

  return res;
}

export function convertPositionChunkIntoFrame(
  positionData: PositionData[]
): PositionTimeFrame {
  const frame: PositionTimeFrame = {
    timestamp: positionData.at(0)!.date!,
    positions: new Map<number, number>(),
  };

  positionData.forEach((posData) => {
    frame.positions.set(
      posData.driver_number,
      posData.position
    );
  });

  return frame;
}

export async function convertPositionDataIntoFrames(
  positionData: PositionData[]
): Promise<PositionTimeFrame[]> {
  let idate = positionData.at(0)!.date;
  let chunk: PositionData[] = [];
  const frames: PositionTimeFrame[] = [];

  positionData.forEach((position) => {
    if (position.date != idate) {
      const frame = convertPositionChunkIntoFrame(
        chunk.slice()
      );
      frames.push(frame);
      chunk = [];
      idate = position.date;
    }
    chunk.push(position);
  });

  return frames;
}
