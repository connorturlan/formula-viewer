import { useEffect, useState } from "react";
import styles from "./TrackList.module.scss";
import { usePub } from "../../utils/pubsub";
import {
  Meetings,
  Sessions,
  type MeetingData,
  type SessionData,
} from "../../services/OpenF1";

export const TrackList = () => {
  const publisher = usePub();

  const [showList, setListVisibility] = useState(true);
  const [selectedMeeting, setSelectedMeeting] =
    useState<number>(-1);
  const [selectedMeetingIndex, setSelectedMeetingIndex] =
    useState<number>(-1);
  const [selectedSessionIndex, setSelectedSessionIndex] =
    useState<number>(-1);
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
          meetingList.map((meeting, index) => {
            return (
              <h3
                key={meeting.meeting_key}
                className={`${styles.SidebarLabel} ${
                  index === selectedMeetingIndex &&
                  styles.SidebarLabelSelected
                }`}
                onClick={() => {
                  console.log(
                    `selected: ${meeting.meeting_name}`
                  );
                  publisher("onTrackSelect", {
                    trackIndex: index,
                    trackName: meeting.location,
                  });
                  setSelectedMeeting(meeting.meeting_key);
                  setSelectedMeetingIndex(index);
                }}
              >
                {meeting.country_name}
              </h3>
            );
          })}
      </div>
      <div className={styles.Sidebar}>
        {showList &&
          sessionList.map((meeting, index) => {
            return (
              <h3
                key={meeting.session_key}
                className={`${styles.SidebarLabel} ${
                  index === selectedSessionIndex &&
                  styles.SidebarLabelSelected
                }`}
                onClick={() => {
                  console.log(
                    `selected: ${meeting.session_name}`
                  );
                  publisher("LoadSession", {
                    sessionKey: meeting.session_key,
                  });
                  setSelectedSessionIndex(index);
                }}
              >
                {meeting.session_name}
              </h3>
            );
          })}
      </div>
    </div>
  );
};
