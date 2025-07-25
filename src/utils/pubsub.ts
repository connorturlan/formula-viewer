import EventEmitter from "eventemitter3";
import { useEffect } from "react";

const emitter = new EventEmitter();

export function UseSub(event: any, callback: any) {
  const unsubscribe = () => {
    emitter.off(event, callback);
  };

  useEffect(() => {
    emitter.on(event, callback);
    return unsubscribe;
  }, []);

  return unsubscribe;
}

export const usePub = () => {
  return (event: string, data: any) => {
    emitter.emit(event, data);
  };
};
