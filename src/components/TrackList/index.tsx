import { useEffect, useState } from "react";
import styles from "./TrackList.module.scss";
import { usePub } from "../../utils/pubsub";
import Tracks from "../WorldMap/tracks-array.json";
import {
  Meetings,
  Sessions,
  type MeetingData,
  type SessionData,
} from "../../services/OpenF1";

export const TrackList = ({ children }: any) => {
  const publisher = usePub();

  const [showList, setListVisibility] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<
    number | undefined
  >();
  const [meetingList, setMeetingList] = useState<
    MeetingData[]
  >([]);
  const [sessionList, setSessionList] = useState<
    SessionData[]
  >([]);

  const loadMeetingData = async () => {
    const [data, err] = await Meetings(2025);
    if (err) console.log(`error: ${err.message}`);
    setMeetingList(data);
  };

  const loadSessionData = async () => {
    const [data, err] = await Sessions(selectedMeeting!);
    if (err) console.log(`error: ${err.message}`);
    setSessionList(data);
  };

  useEffect(() => {
    loadSessionData();
  }, [selectedMeeting]);

  useEffect(() => {
    loadMeetingData();
  }, []);

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
                  publisher("onTrackSelect", {
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
