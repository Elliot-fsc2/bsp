"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Video, Square, Upload } from "lucide-react";
import { uploadFile } from "@/components/MediaUploader";

export function VideoRecorder({ onUploaded }: { onUploaded: (url: string, type: "video") => void }) {
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    setBlob(null);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveRef.current) liveRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "video/webm" });
        setBlob(recorded);
        setPreview(URL.createObjectURL(recorded));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Camera and microphone are not available. You can upload a video file instead.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function uploadRecording() {
    if (!blob) return;
    setBusy(true);
    setError(null);
    try {
      const isMp4 = blob.type.includes("mp4");
      const file = new File([blob], `recording.${isMp4 ? "mp4" : "webm"}`, { type: isMp4 ? "video/mp4" : "video/webm" });
      const result = await uploadFile(file);
      onUploaded(result.url, "video");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--line)] p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-extrabold">
        <Video size={16} /> Record a video
      </p>
      {preview ? (
        <video src={preview} controls className="w-full rounded-xl" />
      ) : (
        <video ref={liveRef} autoPlay muted playsInline className={`w-full rounded-xl bg-black/80 ${recording ? "" : "hidden"}`} />
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {!recording && !blob ? (
          <button type="button" className="bloom-btn" onClick={startRecording} disabled={busy}>
            <Video size={16} /> Start recording
          </button>
        ) : null}
        {recording ? (
          <button type="button" className="bloom-btn" style={{ background: "#c1121f" }} onClick={stopRecording}>
            <Square size={16} /> Stop
          </button>
        ) : null}
        {blob ? (
          <button type="button" className="bloom-btn" onClick={uploadRecording} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            {busy ? "Uploading…" : "Use this recording"}
          </button>
        ) : null}
        {blob ? (
          <button type="button" className="bloom-btn ghost" onClick={startRecording} disabled={busy || recording}>
            Record again
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm font-bold text-[#c9184a]">{error}</p> : null}
    </div>
  );
}
