import { fromLonLat, toLonLat } from "ol/proj";
import { PROJECTION } from "./defaults";

export const ObjectIsEmpty = (obj: Object) => {
  return !obj || Object.keys(obj).length === 0;
};

export const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const convertCoord = (coord: [number, number]) => {
  return fromLonLat(coord, PROJECTION);
};

export const convertCoordToLatLon = (
  coord: [number, number]
) => {
  return toLonLat(coord, PROJECTION);
};

export const convertCoordFromLatLon = (
  coord: [number, number]
) => {
  return convertCoord([coord.at(1)!, coord.at(0)!]);
};
