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
      <button
        className={`${styles.Toggle} ${
          !showList && styles.ToggleHide
        }`}
        onClick={() => setListVisibility(!showList)}
      >
        TRK
      </button>
      {showList && (
        <div className={styles.Modal}>
          <button
            className={`${styles.ModalToggle} ${
              !showList && styles.ModalToggleHide
            }`}
            onClick={() => setListVisibility(!showList)}
          >
            ⨉
          </button>
          <div className={styles.ModalList}>
            {meetingList.map((meeting, index) => {
              return (
                <button
                  key={meeting.meeting_key}
                  className={`${styles.ModalItem} ${
                    index === selectedMeetingIndex &&
                    styles.ModalItemSelected
                  }`}
                  onClick={() => {
                    console.log(
                      `selected: ${meeting.meeting_name}`
                    );
                    publisher("onTrackSelect", {
                      trackIndex: index,
                      trackName: meeting.location,
                    });
                    publisher("LoadTrack", {
                      trackIndex: index,
                      trackName: meeting.location,
                    });
                    setSelectedMeeting(meeting.meeting_key);
                    setSelectedMeetingIndex(index);
                    setSelectedSessionIndex(-1);
                  }}
                >
                  {meeting.country_name}
                </button>
              );
            })}
          </div>
          <div className={styles.ModalCluster}>
            {sessionList.map((meeting, index) => {
              return (
                <button
                  key={meeting.session_key}
                  className={`${styles.ModalItem} ${
                    index === selectedSessionIndex &&
                    styles.ModalItemSelected
                  }`}
                  onClick={() => {
                    console.log(
                      `selected: ${meeting.session_name}`
                    );
                    publisher("LoadSession", {
                      sessionKey: meeting.session_key,
                    });
                    publisher("InfoMessage", {
                      message: `Loading session ${meeting.session_name}`,
                    });
                    setSelectedSessionIndex(index);
                  }}
                >
                  {meeting.session_name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
