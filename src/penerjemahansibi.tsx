import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Camera } from "lucide-react";
import "./penerjemahansibi.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

export default function PenerjemahanSibi({ onBack, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<any>(null);
  const lastSendRef = useRef<number>(0);

  const [hurufSaatIni, setHurufSaatIni] = useState<string>("-");
  const [hasilTeks, setHasilTeks] = useState<string>("");
  const [kameraAktif, setKameraAktif] = useState<boolean>(false);

  /* ================= AKTIFKAN KAMERA ================= */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setKameraAktif(true);
      }
    } catch {
      alert("Kamera tidak dapat diakses");
    }
  };

  /* ================= MEDIAPIPE ================= */
  useEffect(() => {
    if (!kameraAktif || !videoRef.current) return;

    const Hands = (window as any).Hands;
    const CameraUtil = (window as any).Camera;

    if (!Hands || !CameraUtil) {
      console.error("MediaPipe CDN belum dimuat");
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (!results.multiHandLandmarks) return;

      const lm = results.multiHandLandmarks[0];
      if (!lm || lm.length !== 21) return;

      const data63: number[] = [];
      lm.forEach((p: any) => data63.push(p.x, p.y, p.z));

      kirimKeAPI(data63);
    });

    cameraRef.current = new CameraUtil(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
    };
  }, [kameraAktif]);

  /* ================= API ================= */
  const kirimKeAPI = async (landmarks: number[]) => {
    const now = Date.now();
    if (now - lastSendRef.current < 800) return;
    lastSendRef.current = now;

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarks }),
      });

      if (!res.ok) return;

      const data = await res.json();
      console.log("HASIL API:", data);

      if (data?.huruf && data.confidence >= 0.6) {
        setHurufSaatIni(data.huruf);
      }
    } catch (err) {
      console.error("API error:", err);
    }
  };

  /* ================= TOMBOL MANUAL ================= */
  const tambahHuruf = () => {
    if (hurufSaatIni !== "-" && hurufSaatIni !== "") {
      setHasilTeks((prev) => prev + hurufSaatIni);
    }
  };

  const tambahSpasi = () => setHasilTeks((prev) => prev + " ");
  const hapusHuruf = () => setHasilTeks((prev) => prev.slice(0, -1));
  const resetTeks = () => {
    setHasilTeks("");
    setHurufSaatIni("-");
  };

  /* ================= UI ================= */
  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h2>Penerjemahan Bahasa Isyarat SIBI</h2>
      </div>

      <div className="content">
        <div className="card">
          <h4>
            <Camera size={18} /> Kamera
          </h4>

          <video ref={videoRef} className="video" muted playsInline />

          {!kameraAktif && (
            <button className="btn-primary" onClick={startCamera}>
              Aktifkan Kamera
            </button>
          )}

          <div className="hasil-container">
            <p>
              Huruf terdeteksi: <strong>{hurufSaatIni}</strong>
            </p>
            <div className="hasil-teks">
              {hasilTeks || "Hasil terjemahan akan muncul di sini"}
            </div>
          </div>

          <div className="text-actions">
            <button onClick={tambahHuruf}>Tambah Huruf</button>
            <button onClick={tambahSpasi}>Spasi</button>
            <button onClick={hapusHuruf}>Hapus</button>
            <button onClick={resetTeks}>Reset</button>
          </div>

          <button
            className="btn-success"
            onClick={() => onFinish(hasilTeks)}
            disabled={!hasilTeks}
          >
            <CheckCircle size={16} /> Proses
          </button>
        </div>
      </div>
    </div>
  );
}
