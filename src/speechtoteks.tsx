import { useRef, useState } from "react";
import { ArrowLeft, Mic, Square, CheckCircle, RotateCcw } from "lucide-react";
import "./speechtoteks.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

type SpeechRecognition = {
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

export default function SpeechToText({ onBack, onFinish }: Props) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasilTeks, setHasilTeks] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /* ===== NORMALISASI TEKS ===== */
  const normalizeText = (text: string) =>
    text.trim().replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase());

  /* ===== START SPEECH ===== */
  const startSpeech = () => {
    if (isListening) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Browser tidak mendukung Speech Recognition");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("🎤 Speech started");
      setIsListening(true);
      setHasilTeks("");

      // ⏱ Auto stop 6 detik
      setTimeout(() => {
        recognition.stop();
      }, 6000);
    };

    recognition.onresult = (event: any) => {
      console.log("🎯 Raw result:", event.results);
      const text = event.results[0][0].transcript;
      setHasilTeks(normalizeText(text));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);

      if (event.error !== "no-speech") {
        alert("Gagal mendeteksi suara, silakan coba lagi.");
      }
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

  /* ===== STOP ===== */
  const stopSpeech = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  /* ===== RESET ===== */
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
            {hasilTeks || "Tekan mikrofon lalu berbicaralah"}
          </div>

          {!isListening ? (
            <button className="btn-primary" onClick={startSpeech}>
              <Mic size={16} /> Mulai Bicara
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
