import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, BookOpen } from "lucide-react";
import "./penerjemahansibi.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

export default function PenerjemahanSibi({ onBack, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lastSendRef = useRef(0);
  const SEND_INTERVAL = 300;

  const [hurufSaatIni, setHurufSaatIni] = useState("-");
  const [hasilTeks, setHasilTeks] = useState("");
  const lastPredictionRef = useRef<string | null>(null);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [showEdu, setShowEdu] = useState(false);

  const sessionIdRef = useRef(crypto.randomUUID());

  /* ================= AKTIFKAN KAMERA ================= */
  const startCamera = () => {
    setKameraAktif(true);
  };

  /* ================= MEDIAPIPE ================= */
  useEffect(() => {
    if (!kameraAktif || !videoRef.current) return;

    let isMounted = true;

    const initCamera = async () => {
      try {
        const Hands = (window as any).Hands;
        const CameraUtil = (window as any).Camera;

        if (!Hands || !CameraUtil) {
          console.error("MediaPipe Hands / Camera belum tersedia");
          return;
      }

      // 🔹 debug optional
      if (import.meta.env.MODE === "development") {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.table(devices.filter(d => d.kind === "videoinput"));
      }

      // 1. ambil stream dulu
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (!isMounted) return;

      streamRef.current = stream;

      // 2. pasang ke video
      const videoEl = videoRef.current!;
      videoEl.srcObject = stream;
      await videoEl.play(); // WAJIB tunggu

      // 3. init mediapipe
      handsRef.current = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      handsRef.current.onResults((results: any) => {
        // kode gambar kamu BIARKAN seperti sekarang
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (!results.multiHandLandmarks?.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        const lm = results.multiHandLandmarks[0];
        if (!lm || lm.length !== 21) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;

        const connections = [
          [0,1],[1,2],[2,3],[3,4],
          [0,5],[5,6],[6,7],[7,8],
          [5,9],[9,10],[10,11],[11,12],
          [9,13],[13,14],[14,15],[15,16],
          [13,17],[17,18],[18,19],[19,20],
          [0,17],
        ];

        connections.forEach(([a, b]) => {
          ctx.beginPath();
          ctx.moveTo(lm[a].x * cw, lm[a].y * ch);
          ctx.lineTo(lm[b].x * cw, lm[b].y * ch);
          ctx.stroke();
        });

        ctx.fillStyle = "#ff0000";
        lm.forEach((p: any) => {
          ctx.beginPath();
          ctx.arc(p.x * cw, p.y * ch, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // ===== kirim ke API (biarkan kode kamu) =====
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
          .then((r) => r.json())
          .then((d) => {
            if (d?.status === "neutral") {
              setHurufSaatIni("-");
            } else if (d?.preview && d.preview !== "-") {
              setHurufSaatIni(d.preview);
            }

            if (
              d?.status === "confirmed" &&
              d.huruf &&
              lastPredictionRef.current !== d.huruf
            ) {
              setHasilTeks(prev => prev + d.huruf);
              lastPredictionRef.current = d.huruf;
            }

            if (d?.status !== "confirmed") {
              lastPredictionRef.current = null;
            }
          })
          .catch(err => console.error("Fetch error:", err));
      });

      // 4. BARU start CameraUtil
      const processFrame = async () => {
        if (!isMounted) return;

        if (
          videoRef.current &&
          videoRef.current.readyState >= 2 &&
          handsRef.current
        ) {
          await handsRef.current.send({ image: videoRef.current });
        }

        requestAnimationFrame(processFrame);
      };

      processFrame();

    } catch (err) {
      console.error("Camera init error:", err);
    }
  };

  initCamera();

  return () => {
    isMounted = false;

    handsRef.current?.close();
    handsRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
  }
};
}, [kameraAktif]);
  /* ================= UI ================= */
  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2>Penerjemahan Bahasa Isyarat SIBI</h2>
      </div>

      <div className="content edu-wrapper">
        <div className="card">
          <div className="card-header">

            <button className="btn-edu" onClick={() => setShowEdu(!showEdu)}>
              <BookOpen size={18}/>
            </button>
          </div>

          <div className="video-wrapper">
            <video
              ref={videoRef}
              className="video"
              muted
              playsInline
              autoPlay
            />
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
            <button onClick={() => setHasilTeks(p => p + " ")}>Spasi</button>
            <button onClick={() => setHasilTeks(p => p.slice(0, -1))}>Hapus</button>
            <button onClick={() => setHasilTeks("")}>Reset</button>
          </div>

          <button
            className="btn-success"
            onClick={() => onFinish(hasilTeks)}
            disabled={!hasilTeks}
          >
            <CheckCircle size={16} /> Selesai
          </button>
        </div>

        {showEdu && (
          <div className="edu-panel">
            <img src="abjadsibi.jpg" alt="Edukasi SIBI" />
          </div>
        )}
      </div>
    </div>
  );
}