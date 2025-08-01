import styles from "./index.module.scss";
import type { DriverData } from "../../services/OpenF1";

export interface DriverPositionListProps {
  driverData: Map<number, DriverData>;
  positions: number[];
  positionsGained: number[];
  positionsLost: number[];
}

export const DriverPositionList = ({
  driverData,
  positions,
  positionsGained,
  positionsLost,
}: DriverPositionListProps) => {
  // const [lastPosition, setLastPosition] = useState<number>
  return (
    <div className={styles.Container}>
      <div className={styles.List}>
        {positions.map(
          (driverNumber: any, index: number) => {
            return (
              <div
                key={
                  `${index}` +
                  (driverData.get(driverNumber)
                    ?.name_acronym || "a")
                }
                className={`${styles.ListItem} ${
                  positionsGained.includes(driverNumber) &&
                  styles.ListItemGained
                } ${
                  positionsLost.includes(driverNumber) &&
                  styles.ListItemLost
                }`}
              >
                <p>
                  {index + 1}{" "}
                  {driverData.get(driverNumber)
                    ?.name_acronym || ""}
                </p>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
