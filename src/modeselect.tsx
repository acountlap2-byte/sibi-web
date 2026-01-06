import "./modeselect.css";

type ModeSelectProps = {
  onBack: () => void;
  onSelectSibi: () => void;
  onSelectSpeech: () => void;
};

export default function ModeSelect({
  onBack,
  onSelectSibi,
  onSelectSpeech,
}: ModeSelectProps) {
  return (
    <div className="mode-container">
      <h1 className="mode-title">Penerjemah Bahasa Isyarat SIBI</h1>

      <p className="mode-subtitle">
        Silakan pilih metode komunikasi yang ingin digunakan
      </p>

      <div className="mode-card-container">
        {/* MODE SIBI */}
        <div className="mode-card">
          <h2>📷 Gerakan SIBI</h2>
          <p>
            Menggunakan kamera untuk mendeteksi gerakan bahasa isyarat SIBI
          </p>
          <button
            className="btn-primary"
            onClick={onSelectSibi}
          >
            Mulai Gerakan SIBI
          </button>
        </div>

        {/* MODE SPEECH */}
        <div className="mode-card">
          <h2>🔊 Speech to Text</h2>
          <p>Mengubah suara menjadi teks secara real-time</p>
          <button
            className="btn-secondary"
            onClick={onSelectSpeech}
          >
            Mulai Speech to Text
          </button>
        </div>
      </div>

      <button className="back-button" onClick={onBack}>
        ⬅ 
      </button>
    </div>
  );
}
