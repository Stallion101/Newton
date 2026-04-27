import { useState, useEffect, useRef } from "react";
import { Play, Square, RotateCcw, Clock, Target, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HT_NORMS } from "@/lib/passageData";
import { createSyncChannel, MSG } from "@/lib/progressSync";

export default function ORFTeacherView({ passage, grade, onReset }) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [errors, setErrors] = useState(new Set()); // word indices
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);
  const syncChannelRef = useRef(null);

  const words = passage.text.split(/\s+/);
  const totalWords = words.length;

  // Initialize sync channel listener for STUDENT_DONE
  useEffect(() => {
    syncChannelRef.current = createSyncChannel();
    const ch = syncChannelRef.current;

    ch.onmessage = (ev) => {
      const { type, payload } = ev.data;
      if (type === MSG.STUDENT_DONE) {
        // Student finished reading
        setTimerRunning(false);
        setFinished(true);
      }
    };

    return () => ch.close();
  }, []);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e >= 60 ? 60 : e + 1;
          
          // Broadcast timer update to StudentScreen
          if (syncChannelRef.current) {
            syncChannelRef.current.postMessage({
              type: MSG.TIMER_UPDATE,
              payload: { elapsed: next, running: true }
            });
          }
          
          if (next >= 60) {
            setTimerRunning(false);
            setFinished(true);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  function toggleError(idx) {
    if (finished) return;
    setErrors((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") handleReset();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleStop() {
    setTimerRunning(false);
    setFinished(true);
  }

  function handleReset() {
    setTimerRunning(false);
    setElapsed(0);
    setErrors(new Set());
    setFinished(false);
    clearInterval(intervalRef.current);
    onReset?.();
  }

  const errorCount = errors.size;
  const cwpm = finished && elapsed > 0 ? Math.round(((totalWords - errorCount) / elapsed) * 60) : 0;
  const accuracy = finished && totalWords > 0 ? Math.round(((totalWords - errorCount) / totalWords) * 100) : 0;
  const timerColor = elapsed >= 55 ? "text-red-500" : elapsed >= 45 ? "text-orange-500" : "text-newton-green";

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-border/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${timerColor}`} />
          <span className={`font-display font-bold text-2xl tabular-nums ${timerColor}`}>{mins}:{secs}</span>
          <span className="text-xs text-muted-foreground">/ 1:00</span>
        </div>

        <div className="h-6 w-px bg-border/50" />

        {finished && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-newton-green" />
              <span className="text-sm font-semibold">{cwpm} CWPM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-newton-cyan" />
              <span className="text-sm font-semibold">{accuracy}% Accuracy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold">{errorCount} errors</span>
            </div>
            <div className="h-6 w-px bg-border/50" />
          </>
        )}

        <div className="ml-auto flex gap-2">
          {!timerRunning && !finished && (
            <Button
              onClick={() => setTimerRunning(true)}
              variant="outline"
              className="rounded-full gap-2 border-newton-pink text-newton-pink hover:bg-newton-pink/10 px-5"
            >
              <Play className="w-4 h-4" /> Start Assessment
            </Button>
          )}
          {timerRunning && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="rounded-full gap-2 border-red-300 text-red-500 hover:bg-red-50"
            >
              <Square className="w-4 h-4 fill-red-500" /> Stop
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            className="rounded-full gap-2 border-border/60"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>

      {!timerRunning && !finished && (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Instructions:</span> Click any word to mark it as an error. When ready, click <strong>Start Assessment</strong> to begin the 60-second timer.
          </p>
        </div>
      )}

      {/* Passage */}
      <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-newton-pink flex items-center justify-center">
              <span className="font-display font-bold text-white text-xs">N</span>
            </div>
            <span className="font-display font-semibold text-sm text-muted-foreground">Newton Learning · ORF Probe</span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Grade: <strong className="text-foreground">{grade}</strong></span>
            <span>Words: <strong className="text-foreground">{totalWords}</strong></span>
          </div>
        </div>

        <h3 className="font-display font-bold text-lg mb-1">{passage.title}</h3>
        <div className="flex gap-4 text-xs text-muted-foreground mb-5">
          <span>Name: <span className="border-b border-foreground/30 inline-block w-32">&nbsp;</span></span>
          <span>Date: <span className="border-b border-foreground/30 inline-block w-24">&nbsp;</span></span>
        </div>

        <p className="text-base leading-loose select-none">
          {words.map((word, i) => {
            const isError = errors.has(i);
            const canClick = !finished;
            return (
              <span key={i}>
                <span
                  onClick={() => toggleError(i)}
                  className={`rounded px-0.5 transition-all duration-100 ${
                    canClick ? "cursor-pointer hover:bg-secondary" : "cursor-default"
                  } ${
                    isError
                      ? "line-through text-red-500 bg-red-50 font-medium"
                      : ""
                  }`}
                >
                  {word}
                </span>
                {" "}
              </span>
            );
          })}
        </p>
      </div>

      {finished && (
        <BenchmarkPanel cwpm={cwpm} grade={grade} accuracy={accuracy} errorCount={errorCount} />
      )}
    </div>
  );
}

function BenchmarkPanel({ cwpm, grade, accuracy, errorCount }) {
  const norm = HT_NORMS[grade];
  let band = "Intensive";
  let bandColor = "text-red-500";
  let bandBg = "bg-red-50 border-red-200";
  let bandDesc = "Student is significantly below grade-level benchmarks. Consider intensive intervention.";

  if (norm) {
    if (cwpm >= norm.benchmark) {
      band = "Benchmark";
      bandColor = "text-newton-green";
      bandBg = "bg-green-50 border-green-200";
      bandDesc = "Student is meeting or exceeding grade-level fluency benchmarks. Continue monitoring.";
    } else if (cwpm >= norm.strategic) {
      band = "Strategic";
      bandColor = "text-orange-500";
      bandBg = "bg-orange-50 border-orange-200";
      bandDesc = "Student is approaching but below benchmark. Consider targeted small-group support.";
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm">
      <h4 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-newton-green" /> Assessment Results
      </h4>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-4 bg-secondary/50 rounded-xl">
          <p className="text-3xl font-display font-bold text-newton-pink">{cwpm}</p>
          <p className="text-xs text-muted-foreground mt-1">CWPM</p>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-xl">
          <p className="text-3xl font-display font-bold text-newton-cyan">{accuracy}%</p>
          <p className="text-xs text-muted-foreground mt-1">Accuracy</p>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-xl">
          <p className="text-3xl font-display font-bold text-red-500">{errorCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Errors</p>
        </div>
      </div>

      {norm && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>0</span>
            <span className="text-red-400">Intensive &lt;{norm.strategic}</span>
            <span className="text-orange-400">Strategic {norm.strategic}–{norm.benchmark - 1}</span>
            <span className="text-green-500">Benchmark ≥{norm.benchmark}</span>
          </div>
          <div className="h-4 bg-gradient-to-r from-red-200 via-orange-200 to-green-200 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full w-1 bg-foreground rounded-full transition-all duration-700"
              style={{ left: `${Math.min(98, (cwpm / (norm.benchmark * 1.4)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className={`p-3 rounded-xl border ${bandBg} flex items-start gap-3`}>
        <span className={`font-display font-bold text-sm ${bandColor}`}>{band}</span>
        <p className="text-xs text-muted-foreground">{bandDesc}</p>
      </div>
    </div>
  );
}