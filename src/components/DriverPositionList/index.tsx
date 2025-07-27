import styles from "./index.module.scss";
import type { DriverData } from "../../services/OpenF1";

export interface DriverPositionListProps {
  driverData: Map<number, DriverData>;
  positions: number[];
}

export const DriverPositionList = ({
  driverData,
  positions,
}: DriverPositionListProps) => {
  return (
    <div className={styles.Container}>
      <div className={styles.List}>
        {positions.map((pos: any, index: number) => {
          return (
            <div
              key={
                `${index}` +
                (driverData.get(pos)?.name_acronym || "a")
              }
              className={styles.ListItem}
            >
              <p>
                {index + 1}{" "}
                {driverData.get(pos)?.name_acronym || ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
