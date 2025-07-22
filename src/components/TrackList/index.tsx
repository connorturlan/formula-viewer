import { useState } from "react";
import styles from "./TrackList.module.scss";
import { usePub } from "../../utils/pubsub";
import Tracks from "../WorldMap/tracks-array.json";
import type {
  TrackInterface,
  TrackSelectEvent,
} from "../WorldMap";

export const TrackList = () => {
  const [showList, setListVisibility] = useState(true);
  const selectTrack = usePub();
  return (
    <div className={styles.Container}>
      {showList && (
        <div
          className={styles.Sidebar}
          //   onClick={() => setListVisibility(false)}
        >
          {Tracks.tracks.map((track, index) => {
            return (
              <h3
                key={track.name}
                className={styles.SidebarLabel}
                onClick={() => {
                  console.log(`selected: ${track.name}`);
                  selectTrack("onTrackSelect", {
                    trackIndex: index,
                  });
                }}
              >
                {track.name}
              </h3>
            );
          })}
        </div>
      )}
    </div>
  );
};
