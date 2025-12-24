import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Square, CheckCircle, RotateCcw } from "lucide-react";
import "./speechtoteks.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

export default function SpeechToText({ onBack, onFinish }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [hasilTeks, setHasilTeks] = useState("");
  const recognitionRef = useRef<any>(null);
  const stopTimerRef = useRef<number | null>(null);

  /* ===== UTIL: NORMALISASI TEKS (AKURASI) ===== */
  const normalizeText = (text: string) => {
    return text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^./, (c) => c.toUpperCase());
  };

  /* ===== INIT SPEECH API (DENGAN WARM-UP MIC) ===== */
  useEffect(() => {
    const initSpeech = async () => {
      // 🔥 Warm-up mic (menghindari no-speech)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Browser tidak mendukung Speech Recognition");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;      // lebih stabil
      recognition.interimResults = false;  // hanya hasil final (lebih akurat)

      recognition.onstart = () => {
        setIsListening(true);

        // ⏱ Batasi durasi bicara (hindari kalimat terlalu panjang)
        stopTimerRef.current = window.setTimeout(() => {
          recognition.stop();
        }, 6000); // 6 detik
      };

      recognition.onresult = (event: any) => {
        const raw = event.results[0][0].transcript;
        const cleaned = normalizeText(raw);
        setHasilTeks(cleaned);
      };

      recognition.onerror = (event: any) => {
        // no-speech = normal, biarkan user coba lagi
        if (event.error !== "no-speech") {
          alert("Speech error: " + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    };

    initSpeech().catch(() => {
      alert("Mikrofon tidak bisa diakses");
    });

    return () => {
      recognitionRef.current?.stop();
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, []);

  /* ===== CONTROL ===== */
  const startSpeech = () => {
    if (isListening) return;
    setHasilTeks(""); // ⛔ cegah teks lama tercampur
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopSpeech = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const resetSpeech = () => {
    recognitionRef.current?.stop();
    setHasilTeks("");
    setIsListening(false);
  };

  /* ===== RENDER ===== */
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
            <Mic size={18} /> Mikrofon
          </h4>

          <div className="hasil-teks final">
            {hasilTeks || "Tekan mikrofon dan mulai berbicara (maks. 6 detik)"}
          </div>

          {!isListening ? (
            <button className="btn-primary" onClick={startSpeech}>
              <Mic size={16} /> Mulai Rekam
            </button>
          ) : (
            <button className="btn-danger" onClick={stopSpeech}>
              <Square size={16} /> Hentikan
            </button>
          )}

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
