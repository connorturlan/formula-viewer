import { useState } from "react";
import styles from "./index.module.scss";
import { UseSub } from "../../utils/pubsub";

export interface ToastMessageEvent {
  message: string;
}

export const DriverPositionList = () => {
  const [positions, _setPositions] = useState<string[]>([]);

  const onPositionUpdate = (
    _positionChangeEvent: any
  ) => {};

  UseSub("PositionUpdate", onPositionUpdate);

  return (
    <div className={styles.Container}>
      {positions.map((pos, index) => {
        return <div key={index}>{pos}</div>;
      })}
    </div>
  );
};
