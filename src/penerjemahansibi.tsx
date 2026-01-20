import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Camera, BookOpen } from "lucide-react";
import "./penerjemahansibi.css";

type Props = {
  onBack: () => void;
  onFinish: (hasil: string) => void;
};

export default function PenerjemahanSibi({ onBack, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);

  const lastSendRef = useRef(0);
  const SEND_INTERVAL = 300;

  const [hurufSaatIni, setHurufSaatIni] = useState("-");
  const [hasilTeks, setHasilTeks] = useState("");
  const [kameraAktif, setKameraAktif] = useState(false);
  const [showEdu, setShowEdu] = useState(false);

  const sessionIdRef = useRef(crypto.randomUUID());

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
  const handsRef = useRef<any>(null);

useEffect(() => {
  if (!kameraAktif || !videoRef.current) return;

  const Hands = (window as any).Hands;
  const CameraUtil = (window as any).Camera;

  if (!Hands || !CameraUtil) return;

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
    if (!results.multiHandLandmarks) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const lm = results.multiHandLandmarks[0];
    if (!lm) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.clearRect(0,0,canvas.width,canvas.height);

    lm.forEach((p:any)=>{
      ctx?.beginPath();
      ctx?.arc(p.x*canvas.width,p.y*canvas.height,4,0,Math.PI*2);
      ctx?.fill();
    });

    const now = Date.now();
    if (now - lastSendRef.current < SEND_INTERVAL) return;
    lastSendRef.current = now;

    const landmark = lm.flatMap((p:any)=>[p.x,p.y,p.z]);

    fetch("https://phialine-unstamped-baylee.ngrok-free.dev/predict",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        session_id: sessionIdRef.current,
        landmark
      })
    })
    .then(r=>r.json())
    .then(d=>{
      if(d?.huruf) setHurufSaatIni(d.huruf);
    })
    .catch(()=>{});
  });

  cameraRef.current = new CameraUtil(videoRef.current,{
    onFrame: async ()=>{
      if(videoRef.current){
        await handsRef.current.send({image:videoRef.current});
      }
    },
    width:640,
    height:480,
    frameRate:20
  });

  cameraRef.current.start();

  return () => {
    cameraRef.current?.stop();
    handsRef.current?.close();

    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t=>t.stop());
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
            <h4><Camera size={18}/> Kamera</h4>
            <button className="btn-edu" onClick={() => setShowEdu(!showEdu)}>
              <BookOpen size={18}/>
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
            <button onClick={() => hurufSaatIni !== "-" && setHasilTeks(p => p + hurufSaatIni)}>Tambah Huruf</button>
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
