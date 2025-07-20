import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
// import "./App.css";
import styles from "./App.module.scss";
import { WorldMap } from "./components/WorldMap";
import Tracks from "./components/WorldMap/tracks.json";

function App() {
  const [showSplash, setSplash] = useState(false);

  return (
    <>
      <WorldMap pointCount={10} />
      {showSplash && (
        <div
          className={styles.AppLayer}
          onClick={() => setSplash(false)}
        >
          Layer Two
        </div>
      )}
    </>
  );
}

export default App;
