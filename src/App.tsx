import { useState } from "react";
import styles from "./App.module.scss";
import { WorldMap } from "./components/WorldMap";
import { TrackList } from "./components/TrackList";

function App() {
  return (
    <>
      <WorldMap />
      <TrackList />
    </>
  );
}

export default App;
