import { useState, useEffect } from "react";
import { createSyncChannel, MSG } from "@/lib/progressSync";
import ORFStudentView from "../components/tools/progressMonitor/ORFStudentView";
import MAZEStudentView from "../components/tools/progressMonitor/MAZEStudentView";

export default function StudentScreen() {
  const [session, setSession] = useState(null); // { mode, grade, passage, mazeItems }
  const [mazeItems, setMazeItems] = useState(null);
  const [timerState, setTimerState] = useState({ elapsed: 0, running: false });

  useEffect(() => {
    const ch = createSyncChannel();

    ch.onmessage = (ev) => {
      const { type, payload } = ev.data;
      if (type === MSG.PASSAGE_UPDATE) {
        setSession(payload);
        setMazeItems(payload.mazeItems || null);
        setTimerState({ elapsed: 0, running: false });
      } else if (type === MSG.MAZE_SELECT) {
        setMazeItems(prev =>
          prev ? prev.map((t, i) => i === payload.tokenIdx ? { ...t, selected: payload.choice } : t) : prev
        );
      } else if (type === MSG.TIMER_UPDATE) {
        setTimerState({ elapsed: payload.elapsed, running: payload.running });
      } else if (type === MSG.RESET) {
        setSession(null);
        setMazeItems(null);
        setTimerState({ elapsed: 0, running: false });
      }
    };

    return () => ch.close();
  }, []);

  const pct = Math.min(100, (timerState.elapsed / 60) * 100);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFBF0" }}>
      {/* Timer progress bar — subtle, non-distracting */}
      {(timerState.running || timerState.elapsed > 0) && session?.mode === "ORF" && (
        <div className="h-1.5 w-full bg-amber-100 fixed top-0 left-0 z-50">
          <div
            className="h-full bg-[#D6006E]/60 transition-all duration-1000 ease-linear rounded-r-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!session ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D6006E]/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[#D6006E] flex items-center justify-center">
                <span className="font-bold text-white text-sm">N</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-stone-700 mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Newton Learning
            </h2>
            <p className="text-stone-400 text-sm" style={{ fontFamily: "Georgia, serif" }}>
              Waiting for your teacher to start the assessment…
            </p>
          </div>
        ) : session.mode === "ORF" ? (
          <ORFStudentView passage={session.passage} grade={session.grade} />
        ) : (
          <MAZEStudentView
            passage={session.passage}
            mazeItems={mazeItems || session.mazeItems}
            onSelect={(tokenIdx, choice) => {
              // Update local state immediately
              setMazeItems(prev =>
                prev ? prev.map((t, i) => i === tokenIdx ? { ...t, selected: choice } : t) : prev
              );
              // Broadcast back to teacher
              const ch = createSyncChannel();
              ch.postMessage({ type: MSG.MAZE_SELECT, payload: { tokenIdx, choice } });
              ch.close();
            }}
          />
        )}
      </div>
    </div>
  );
}