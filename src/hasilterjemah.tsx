import { ArrowLeft, RotateCcw } from "lucide-react";
import "./hasilterjemah.css";

type Props = {
  hasilTeks: string;
  onBack: () => void;
  onReset: () => void;
};

export default function HasilPenerjemahan({
  hasilTeks,
  onBack,
  onReset,
}: Props) {
  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h2>Hasil Penerjemahan SIBI</h2>
      </div>

      <div className="content">
        <div className="card">

          {/* ROBOT */}
          <img
            src="/robot2.png"
            alt="Robot SIBI"
            className="robot-img"
          />

          <h4>Hasil Terjemahan</h4>

          <div className="hasil-teks final">
            {hasilTeks || "Tidak ada hasil terjemahan"}
          </div>

          <div className="action-buttons">
            <button className="btn-outline" onClick={onReset}>
              <RotateCcw size={16} /> Mulai Ulang
            </button>
            <button className="btn-success" onClick={onBack}>
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
