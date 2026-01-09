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

  // ===== SESSION & STABILITAS =====
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

  /* ================= AKTIFKAN KAMERA ================= */
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

  /* ================= MEDIAPIPE ================= */
  useEffect(() => {
    if (!kameraAktif || !videoRef.current) return;

    const Hands = (window as any).Hands;
    const CameraUtil = (window as any).Camera;

    if (!Hands || !CameraUtil) {
      console.error("❌ MediaPipe Hands belum tersedia");
      return;
    }

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
      if (!video || !canvas || video.videoWidth === 0) return;

      const lm = results.multiHandLandmarks[0];
      if (!lm || lm.length !== 21) return;

      /* ===== DRAW LANDMARK ===== */
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
        ctx.stroke();
      });

      ctx.fillStyle = "#ff0000";
      lm.forEach((p: any) => {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ===== KIRIM KE API ===== */
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
          if (!data || !data.status) return;

          if (data.status === "BUSY" || data.status === "HOLD") return;

          if (data.status === "UNSURE" || data.status === "SEARCHING") {
            neutralDetectedRef.current = true;
            return;
          }

          if (data.status !== "FINAL") return;

          const nowFinal = Date.now();

          const hurufBaru = data.huruf !== lastHurufRef.current;

          const bolehUlangHurufSama =
            data.huruf === lastHurufRef.current &&
            neutralDetectedRef.current &&
            nowFinal - lastFinalTimeRef.current > REPEAT_DELAY;

          if (hurufBaru || bolehUlangHurufSama) {
            lastHurufRef.current = data.huruf;
            lastFinalTimeRef.current = nowFinal;
            neutralDetectedRef.current = false;
            setHurufSaatIni(data.huruf);
          }
        })
        .catch(err => console.error("Fetch error:", err));
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

    return () => {
      cameraRef.current?.stop();
      hands.close && hands.close();
    };
  }, [kameraAktif]);

  /* ================= TOMBOL ================= */
  const tambahHuruf = () => {
    if (hurufSaatIni !== "-") {
      setHasilTeks(prev => prev + hurufSaatIni);
    }
  };

  const tambahSpasi = () => setHasilTeks(prev => prev + " ");
  const hapusHuruf = () => setHasilTeks(prev => prev.slice(0, -1));

  const resetTeks = () => {
    setHasilTeks("");
    setHurufSaatIni("-");
    lastHurufRef.current = "-";
    lastFinalTimeRef.current = 0;
    neutralDetectedRef.current = true;
  };

  /* ================= UI ================= */
  return (
    <div className="page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2>Penerjemahan Bahasa Isyarat SIBI</h2>
      </div>

      <div className="content">
        <div className="card">
          <h4><Camera size={18} /> Kamera</h4>

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
            <CheckCircle size={16} /> Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
