import type { ApiError } from "./types";

const baseUrl = "api.openf1.org";
const apiVersion = "v1";
let rateLimited = false;
let rateQueue = 0;
// const rateLimit = 100;
// const timeoutLimit = 10_000;

async function HandleRequest(
  url: string,
  requeue = false
): Promise<Response> {
  console.debug(
    `limited: ${rateLimited}, in queue: ${rateQueue}`
  );

  if (!requeue) rateQueue++;

  // if (rateLimited) {
  //   return new Promise((res, rej) => {
  //     setTimeout(async () => {
  //       res(await HandleRequest(url, true));
  //     }, rateLimit);
  //     setTimeout(async () => {
  //       rej(undefined);
  //     }, timeoutLimit);
  //   });
  // }
  rateQueue--;

  rateLimited = true;
  const res = await fetch(
    `https://${baseUrl}/${apiVersion}/${url}`
  );
  rateLimited = false;

  return res;
}

/* 
Some data about each car, at a sample rate of about 3.7 Hz. 

Name 	Description
brake 	Whether the brake pedal is pressed (100) or not (0).
date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
drs 	The Drag Reduction System (DRS) status (see mapping table below).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
n_gear 	Current gear selection, ranging from 1 to 8. 0 indicates neutral or no gear engaged.
rpm 	Revolutions per minute of the engine.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
speed 	Velocity of the car in km/h.
throttle 	Percentage of maximum engine power being used.

DRS value 	Interpretation
0 	DRS off
1 	DRS off
2 	?
3 	?
8 	Detected, eligible once in activation zone
9 	?
10 	DRS on
12 	DRS on
14 	DRS on
*/
export async function CarData() {
  // https://api.openf1.org/v1/car_data?driver_number=55&session_key=9159&speed>=315
}

/* 
Provides information about drivers for each session.

broadcast_name 	The driver's name, as displayed on TV.
country_code 	A code that uniquely identifies the country.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
first_name 	The driver's first name.
full_name 	The driver's full name.
headshot_url 	URL of the driver's face photo.
last_name 	The driver's last name.
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
name_acronym 	Three-letter acronym of the driver's name.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
team_colour 	The hexadecimal color value (RRGGBB) of the driver's team.
team_name 	Name of the driver's team.
*/
export async function Drivers() {
  // https://api.openf1.org/v1/drivers?driver_number=1&session_key=9158
}

/* 
Fetches real-time interval data between drivers and their gap to the race leader. Available during races only, with updates approximately every 4 seconds.

date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
gap_to_leader 	The time gap to the race leader in seconds, +1 LAP if lapped, or null for the race leader.
interval 	The time gap to the car ahead in seconds, +1 LAP if lapped, or null for the race leader.
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
*/
export async function Intervals() {
  // https://api.openf1.org/v1/intervals?session_key=9165&interval<0.005
}

/* 
Provides detailed information about individual laps.

date_start 	The UTC starting date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
duration_sector_1 	The time taken, in seconds, to complete the first sector of the lap.
duration_sector_2 	The time taken, in seconds, to complete the second sector of the lap.
duration_sector_3 	The time taken, in seconds, to complete the third sector of the lap.
i1_speed 	The speed of the car, in km/h, at the first intermediate point on the track.
i2_speed 	The speed of the car, in km/h, at the second intermediate point on the track.
is_pit_out_lap 	A boolean value indicating whether the lap is an "out lap" from the pit (true if it is, false otherwise).
lap_duration 	The total time taken, in seconds, to complete the entire lap.
lap_number 	The sequential number of the lap within the session (starts at 1).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
segments_sector_1 	A list of values representing the "mini-sectors" within the first sector (see mapping table below).
segments_sector_2 	A list of values representing the "mini-sectors" within the second sector (see mapping table below).
segments_sector_3 	A list of values representing the "mini-sectors" within the third sector (see mapping table below).
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
st_speed 	The speed of the car, in km/h, at the speed trap, which is a specific point on the track where the highest speeds are usually recorded.
*/
export async function Laps() {
  // https://api.openf1.org/v1/laps?session_key=9161&driver_number=63&lap_number=8
}

/* 
The approximate location of the cars on the circuit, at a sample rate of about 3.7 Hz. Useful for gauging their progress along the track, but lacks details about lateral placement — i.e. whether the car is on the left or right side of the track. The origin point (0, 0, 0) appears to be arbitrary and not tied to any specific location on the track.

date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
x 	The 'x' value in a 3D Cartesian coordinate system representing the current approximate location of the car on the track.
y 	The 'y' value in a 3D Cartesian coordinate system representing the current approximate location of the car on the track.
z 	The 'z' value in a 3D Cartesian coordinate system representing the current approximate location of the car on the track.
*/
export async function Location() {
  // https://api.openf1.org/v1/location?session_key=9161&driver_number=81&date>2023-09-16T13:03:35.200&date<2023-09-16T13:03:35.800
  // "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"
}

export interface LocationData {
  date: Date;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;

  index?: number;
}

export async function LoadLocationData(
  timeNow: Date,
  secondsBuffer: number
): Promise<[LocationData[], ApiError | null]> {
  // https://api.openf1.org/v1/location?session_key=9161&driver_number=81&date>2023-09-16T13:03:35.200&date<2023-09-16T13:03:35.800
  // "date_start":"2023-09-16T13:00:00+00:00","date_end":"2023-09-16T14:00:00+00:00"

  // console.log(
  //   `getting data for ${timeNow.toISOString()} + ${secondsBuffer} seconds`
  // );

  const timeBuffer = new Date(
    timeNow.getTime() + secondsBuffer * 1_000
  );

  // sing 2023
  // const res = await HandleRequest(
  //   `location?session_key=9161&driver_number=81&date>${timeNow.toISOString()}&date<${timeBuffer.toISOString()}`
  // );
  // aus 2025
  const res = await HandleRequest(
    `location?session_key=9693&driver_number=81&date>${timeNow.toISOString()}&date<${timeBuffer.toISOString()}`
  );

  if (res.status !== 200) {
    return [
      [],
      {
        status: res.status,
        message: res.statusText,
      },
    ];
  }

  const json = await res.json();

  return [json, null];
}

/* 
Provides information about meetings. A meeting refers to a Grand Prix or testing weekend and usually includes multiple sessions (practice, qualifying, race, ...).

circuit_key 	The unique identifier for the circuit where the event takes place.
circuit_short_name 	The short or common name of the circuit where the event takes place.
country_code 	A code that uniquely identifies the country.
country_key 	The unique identifier for the country where the event takes place.
country_name 	The full name of the country where the event takes place.
date_start 	The UTC starting date and time, in ISO 8601 format.
gmt_offset 	The difference in hours and minutes between local time at the location of the event and Greenwich Mean Time (GMT).
location 	The city or geographical location where the event takes place.
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
meeting_name 	The name of the meeting.
meeting_official_name 	The official name of the meeting.
year 	The year the event takes place.
*/
export async function Meetings() {
  // https://api.openf1.org/v1/meetings?year=2023&country_name=Singapore
}

/* 
Provides information about cars going through the pit lane.

date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
lap_number 	The sequential number of the lap within the session (starts at 1).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
pit_duration 	The time spent in the pit, from entering to leaving the pit lane, in seconds.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
*/
export async function Pit() {
  // https://api.openf1.org/v1/pit?session_key=9158&pit_duration<31
}

/* 
Provides driver positions throughout a session, including initial placement and subsequent changes.

date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
position 	Position of the driver (starts at 1).
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
*/
export async function Position() {
  // https://api.openf1.org/v1/position?meeting_key=1217&driver_number=40&position<=3
}

/* 
Provides information about race control (racing incidents, flags, safety car, ...).

category 	The category of the event (CarEvent, Drs, Flag, SafetyCar, ...).
date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
flag 	Type of flag displayed (GREEN, YELLOW, DOUBLE YELLOW, CHEQUERED, ...).
lap_number 	The sequential number of the lap within the session (starts at 1).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
message 	Description of the event or action.
scope 	The scope of the event (Track, Driver, Sector, ...).
sector 	Segment ("mini-sector") of the track where the event occurred? (starts at 1).
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
*/
export async function RaceControl() {
  // https://api.openf1.org/v1/race_control?flag=BLACK AND WHITE&driver_number=1&date>=2023-01-01&date<2023-09-01
}

/* 
Provides information about sessions. A session refers to a distinct period of track activity during a Grand Prix or testing weekend (practice, qualifying, sprint, race, ...).

circuit_key 	The unique identifier for the circuit where the event takes place.
circuit_short_name 	The short or common name of the circuit where the event takes place.
country_code 	A code that uniquely identifies the country.
country_key 	The unique identifier for the country where the event takes place.
country_name 	The full name of the country where the event takes place.
date_end 	The UTC ending date and time, in ISO 8601 format.
date_start 	The UTC starting date and time, in ISO 8601 format.
gmt_offset 	The difference in hours and minutes between local time at the location of the event and Greenwich Mean Time (GMT).
location 	The city or geographical location where the event takes place.
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
session_name 	The name of the session (Practice 1, Qualifying, Race, ...).
session_type 	The type of the session (Practice, Qualifying, Race, ...).
year 	The year the event takes place.
*/
export async function Sessions() {
  // https://api.openf1.org/v1/sessions?country_name=Belgium&session_name=Sprint&year=2023
}

/* 
Provides information about individual stints. A stint refers to a period of continuous driving by a driver during a session.

compound 	The specific compound of tyre used during the stint (SOFT, MEDIUM, HARD, ...).
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
lap_end 	Number of the last completed lap in this stint.
lap_start 	Number of the initial lap in this stint (starts at 1).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
stint_number 	The sequential number of the stint within the session (starts at 1).
tyre_age_at_start 	The age of the tyres at the start of the stint, in laps completed.
*/
export async function Stints() {
  // https://api.openf1.org/v1/stints?session_key=9165&tyre_age_at_start>=3
}

/* 
Provides a collection of radio exchanges between Formula 1 drivers and their respective teams during sessions. Please note that only a limited selection of communications are included, not the complete record of radio interactions.

date 	The UTC date and time, in ISO 8601 format.
driver_number 	The unique number assigned to an F1 driver (cf. Wikipedia).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
recording_url 	URL of the radio recording.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
*/
export async function TeamRadio() {
  // https://api.openf1.org/v1/team_radio?session_key=9158&driver_number=11
}

/* 
The weather over the track, updated every minute.

air_temperature 	Air temperature (°C).
date 	The UTC date and time, in ISO 8601 format.
humidity 	Relative humidity (%).
meeting_key 	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
pressure 	Air pressure (mbar).
rainfall 	Whether there is rainfall.
session_key 	The unique identifier for the session. Use latest to identify the latest or current session.
track_temperature 	Track temperature (°C).
wind_direction 	Wind direction (°), from 0° to 359°.
wind_speed 	Wind speed (m/s).
*/
export async function Weather() {
  // https://api.openf1.org/v1/weather?meeting_key=1208&wind_direction>=130&track_temperature>=52
}
