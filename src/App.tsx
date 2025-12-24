import { useState } from "react";
import "./App.css";

import ModeSelect from "./modeselect";
import PenerjemahanSibi from "./penerjemahansibi";
import SpeechToText from "./speechtoteks";
import HasilPenerjemahan from "./hasilterjemah";



type Page =
  | "landing"
  | "mode"
  | "sibi"
  | "speech"
  | "hasil";

function App() {
  const [page, setPage] = useState<Page>("landing");
  const [hasilTeks, setHasilTeks] = useState("");

  if (page === "mode") {
    return (
      <ModeSelect
        onBack={() => setPage("landing")}
        onSelectSibi={() => setPage("sibi")}
        onSelectSpeech={() => setPage("speech")}
      />
    );
  }

  if (page === "sibi") {
    return (
      <PenerjemahanSibi
        onBack={() => setPage("mode")}
        onFinish={(hasil) => {
          setHasilTeks(hasil);
          setPage("hasil");
        }}
      />
    );
  }

  if (page === "speech") {
    return (
      <SpeechToText
        onBack={() => setPage("mode")}
        onFinish={(hasil) => {
          setHasilTeks(hasil);
          setPage("hasil");
        }}
      />
    );
  }

  if (page === "hasil") {
    return (
      <HasilPenerjemahan
        hasilTeks={hasilTeks}
        onBack={() => setPage("mode")}
        onReset={() => {
          setHasilTeks("");
          setPage("mode");
        }}
      />
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-wrapper">

        {/* KIRI */}
        <div className="landing-text">
          <h1 className="landing-title">
            WELCOME TO
            <span className="title-gradient">
              Sistem Penerjemah Bahasa Isyarat
            </span>
          </h1>

          <button
            className="landing-button"
            onClick={() => setPage("mode")}
          >
            Mulai
          </button>
        </div>

        {/* KANAN */}
        <div className="landing-robot">
          <img
            src="/robot.png"
            alt="Robot"
            className="landing-logo"
          />

          <span className="site-name robot-under-feet">
            HI, SAHABAT SIBI
          </span>
        </div>

      </div>
    </div>
  );
}

export default App;
