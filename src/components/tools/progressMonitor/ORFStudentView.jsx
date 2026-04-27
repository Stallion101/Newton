import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { createSyncChannel, MSG } from "@/lib/progressSync";

export default function ORFStudentView({ passage, grade, dyslexicFont = false }) {
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);
  const uttRef = useRef(null);

  function handleFinished() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setDone(true);
    const ch = createSyncChannel();
    ch.postMessage({ type: MSG.STUDENT_DONE, payload: {} });
    ch.close();
  }

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleReadAloud() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(passage.text);
    utt.rate = 0.9;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  }

  const fontStyle = dyslexicFont
    ? { fontFamily: "'OpenDyslexic', 'Comic Sans MS', Arial, sans-serif", letterSpacing: "0.05em", wordSpacing: "0.1em" }
    : { fontFamily: "Georgia, 'Times New Roman', serif" };

  return (
    <div
      className="min-h-[70vh] rounded-2xl p-8 sm:p-12 border"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
    >
      {/* Newton Header */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1A2B3C" }} aria-hidden="true">
            <span className="font-sans font-bold text-white text-sm">N</span>
          </div>
          <div>
            <p className="font-sans font-bold text-sm" style={{ color: "#1A2B3C" }}>NEWTON Learning</p>
            <p className="font-sans text-xs text-stone-500">Reading Fluency Assessment · {grade}</p>
          </div>
        </div>

        {/* Read Aloud toggle */}
        <button
          onClick={toggleReadAloud}
          aria-label={speaking ? "Stop reading aloud" : "Read passage aloud"}
          aria-pressed={speaking}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            speaking
              ? "text-white shadow-md"
              : "bg-white text-stone-700"
          }`}
          style={speaking
            ? { backgroundColor: "#5B9BD5", borderColor: "#5B9BD5" }
            : { borderColor: "#5B9BD5", color: "#5B9BD5" }}
        >
          {speaking ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{speaking ? "Stop" : "Read Aloud"}</span>
        </button>
      </div>

      <h2
        className="font-bold text-2xl sm:text-3xl text-stone-800 mb-6 text-center"
        style={{ ...fontStyle, color: "#1A2B3C" }}
      >
        {passage.title}
      </h2>

      <p
        className="text-xl sm:text-2xl text-stone-900 text-center max-w-3xl mx-auto"
        style={{ ...fontStyle, lineHeight: "4.0rem" }}
      >
        {passage.text}
      </p>

      <div className="mt-12 text-center">
        <p className="font-sans text-xs text-stone-500 mb-6">Read as many words as you can clearly. Your teacher will track your progress.</p>

        {!done ? (
          <button
            onClick={handleFinished}
            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-xl shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: "#1A2B3C", minWidth: "260px", fontSize: "1.25rem" }}
          >
            ✅ I'm Finished
          </button>
        ) : (
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg" style={{ backgroundColor: "#4CAF50" }}>
            ✅ Great job! Your teacher has been notified.
          </div>
        )}
      </div>
    </div>
  );
}