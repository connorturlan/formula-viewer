import { useState } from "react";
import styles from "./TrackList.module.scss";
import { usePub } from "../../utils/pubsub";
import Tracks from "../WorldMap/tracks-array.json";

export const TrackList = ({ children }: any) => {
  const [showList, setListVisibility] = useState(true);
  const selectTrack = usePub();
  return (
    <div className={styles.Container}>
      <div className={styles.Sidebar}>
        <button
          onClick={() => setListVisibility(!showList)}
        >
          Toggle
        </button>
        {showList &&
          Tracks.tracks.map((track, index) => {
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
      {children}
    </div>
  );
};
