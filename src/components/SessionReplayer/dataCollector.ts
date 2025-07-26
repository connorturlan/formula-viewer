import {
  LoadLocationData,
  Position,
  type LocationData,
  type PositionData,
} from "../../services/OpenF1";

async function collectDataChunk(
  start: Date,
  end: Date
): Promise<LocationData[]> {
  const buffer = (end.getTime() - start.getTime()) / 1_000;

  const [res, err] = await LoadLocationData(start, buffer);
  if (err) {
    console.error("Error while fetching chunk.");
  }

  return res;
}

export async function collectAllData(
  start: Date,
  end: Date,
  timestep: number
): Promise<LocationData[]> {
  const idate = new Date(start.getTime());
  const chunks: LocationData[] = [];
  while (idate.getTime() < end.getTime()) {
    const jdate = new Date(
      idate.getTime() + timestep * 1_000
    );

    const res = await collectDataChunk(idate, jdate);
    chunks.push(...res);
    idate.setTime(jdate.getTime());
  }
  return chunks;
}

export interface TimeLocationData {
  x: number;
  y: number;
  z: number;
}

export interface LocationTimeFrame {
  timestamp: Date;
  locations: Map<number, TimeLocationData>;
}

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

export interface PositionTimeFrame {
  timestamp: Date;
  positions: Map<number, number>;
}

export async function collectAllPositionData(): Promise<
  Promise<PositionData[]>
> {
  const [res, err] = await Position(9693);
  if (err) {
    console.error("Error while fetching chunk.");
  }

  return res;
}

export async function convertPositionDataIntoFrames(
  positionData: PositionData[],
  locationFrames: LocationTimeFrame[]
): Promise<PositionTimeFrame[]> {
  const frames:PositionTimeFrame[] = []

  lastDataIndex = 0;

  locationFrames.forEach((frame)=>{
    
  })
}
