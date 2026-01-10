import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Camera } from "lucide-react";
import "./penerjemahansibi.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

export default function PenerjemahanSibi({ onBack, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);

  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const lastSendRef = useRef(0);
  const lastHurufRef = useRef<string>("-");
  const lastFinalTimeRef = useRef(0);
  const neutralDetectedRef = useRef(true);

  const SEND_INTERVAL = 250;
  const REPEAT_DELAY = 900;

  const [hurufSaatIni, setHurufSaatIni] = useState("-");
  const [hasilTeks, setHasilTeks] = useState("");
  const [kameraAktif, setKameraAktif] = useState(false);

  const [showEdukasi, setShowEdukasi] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
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

  useEffect(() => {
    if (!kameraAktif || !videoRef.current) return;

    const Hands = (window as any).Hands;
    const CameraUtil = (window as any).Camera;

    if (!Hands || !CameraUtil) return;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (!results.multiHandLandmarks) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const lm = results.multiHandLandmarks[0];
      if (!lm || lm.length !== 21) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const now = Date.now();
      if (now - lastSendRef.current < SEND_INTERVAL) return;
      lastSendRef.current = now;

      const landmark = lm.map((p: any) => [p.x, p.y, p.z]);

      fetch("https://phialine-unstamped-baylee.ngrok-free.dev/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          landmark,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data || data.status !== "FINAL") return;

          const nowFinal = Date.now();

          const hurufBaru = data.huruf !== lastHurufRef.current;

          const bolehUlang =
            data.huruf === lastHurufRef.current &&
            neutralDetectedRef.current &&
            nowFinal - lastFinalTimeRef.current > REPEAT_DELAY;

          if (hurufBaru || bolehUlang) {
            lastHurufRef.current = data.huruf;
            lastFinalTimeRef.current = nowFinal;
            neutralDetectedRef.current = false;
            setHurufSaatIni(data.huruf);
          }
        });
    });

    cameraRef.current = new CameraUtil(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    cameraRef.current.start();

    return () => cameraRef.current?.stop();
  }, [kameraAktif]);

  const tambahHuruf = () => hurufSaatIni !== "-" && setHasilTeks(p => p + hurufSaatIni);
  const tambahSpasi = () => setHasilTeks(p => p + " ");
  const hapusHuruf = () => setHasilTeks(p => p.slice(0, -1));
  const resetTeks = () => {
    setHasilTeks("");
    setHurufSaatIni("-");
  };

  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18}/>
        </button>
        <h2>Penerjemahan Bahasa Isyarat SIBI</h2>
      </div>

      <div className="content split-layout">
        <div className="card camera-side">

          <div className="kamera-header">
            <h4><Camera size={18}/> Kamera</h4>
            <button
              className="edukasi-btn"
              onClick={() => setShowEdukasi(!showEdukasi)}
              title="Lihat Abjad SIBI"
            >
              📘
            </button>
          </div>

          <div className="video-wrapper">
            <video ref={videoRef} className="video" muted playsInline />
            <canvas ref={canvasRef} className="canvas" />
          </div>

          {!kameraAktif && (
            <button className="btn-primary" onClick={startCamera}>
              Aktifkan Kamera
            </button>
          )}

          <div className="hasil-container">
            <p>Huruf terdeteksi: <strong>{hurufSaatIni}</strong></p>
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
            <CheckCircle size={16}/> Selesai
          </button>
        </div>

        {showEdukasi && (
          <div className="edukasi-side">
            <img
              src="/abjadsibi.jpg"
              alt="Abjad SIBI"
              className="edukasi-img"
            />
          </div>
        )}
      </div>
    </div>
  );
}
