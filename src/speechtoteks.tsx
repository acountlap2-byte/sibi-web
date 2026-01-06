import { useRef, useState } from "react";
import { ArrowLeft, Mic, Square, CheckCircle, RotateCcw } from "lucide-react";
import "./speechtoteks.css";

/* =======================
   PROPS
======================= */
type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

/* =======================
   SPEECH TYPE
======================= */
type SpeechRecognitionType = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

/* =======================
   DETEKSI IOS
======================= */
const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

/* =======================
   COMPONENT
======================= */
export default function SpeechToText({ onBack, onFinish }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [hasilTeks, setHasilTeks] = useState("");

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  /* =======================
     NORMALISASI TEKS
  ======================= */
  const normalizeText = (text: string) =>
    text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^./, (c) => c.toUpperCase());

  /* =======================
     START SPEECH
     (HANYA ANDROID / DESKTOP)
  ======================= */
  const startSpeech = () => {
    if (isListening || isIOS) return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Browser tidak mendukung Speech Recognition");
      return;
    }

    const recognition: SpeechRecognitionType = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setHasilTeks("");

      // auto stop 6 detik
      setTimeout(() => {
        recognition.stop();
      }, 6000);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setHasilTeks(normalizeText(text));
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("Gagal mendeteksi suara");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  /* =======================
     STOP & RESET
  ======================= */
  const stopSpeech = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const resetSpeech = () => {
    recognitionRef.current?.stop();
    setHasilTeks("");
    setIsListening(false);
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h2>Speech to Text</h2>
      </div>

      <div className="content">
        <div className="card">
          <h4>
            <Mic size={18} /> Input Suara
          </h4>

          {/* ===== HASIL ===== */}
          <div className="hasil-teks final">
            {hasilTeks || "Masukkan suara atau teks"}
          </div>

          {/* ===== MODE IOS ===== */}
          {isIOS && (
            <div className="ios-fallback">
              <p className="ios-info">
                ⚠️ iOS tidak mendukung speech otomatis.  
                Tap kolom di bawah lalu tekan <b>ikon mic di keyboard iPhone</b>.
              </p>

              <textarea
                className="ios-textarea"
                placeholder="Tekan mic di keyboard lalu bicara..."
                value={hasilTeks}
                onChange={(e) => setHasilTeks(e.target.value)}
              />
            </div>
          )}

          {/* ===== MODE ANDROID / DESKTOP ===== */}
          {!isIOS && (
            <>
              {!isListening ? (
                <button className="btn-primary" onClick={startSpeech}>
                  <Mic size={16} /> Mulai Bicara
                </button>
              ) : (
                <button className="btn-danger" onClick={stopSpeech}>
                  <Square size={16} /> Hentikan
                </button>
              )}
            </>
          )}

          {/* ===== ACTION ===== */}
          <div className="action-buttons">
            <button className="btn-outline" onClick={resetSpeech}>
              <RotateCcw size={16} /> Reset
            </button>

            <button
              className="btn-success"
              disabled={!hasilTeks}
              onClick={() => onFinish(hasilTeks)}
            >
              <CheckCircle size={16} /> Proses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
