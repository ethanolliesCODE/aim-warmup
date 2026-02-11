import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ───
const DRILLS = ["reaction", "click", "follow"];
const DRILL_NAMES = { reaction: "REACTION", click: "CLICK", follow: "TRACKING" };

// ─── Utility ───
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }

// ─── Main App ───
export default function App() {
  const [screen, setScreen] = useState("home");
  const [duration, setDuration] = useState(null);
  const [currentDrill, setCurrentDrill] = useState(0);
  const [drillResults, setDrillResults] = useState([]);

  const startFlow = () => { setScreen("durationSelect"); };

  const selectDuration = (d) => { setDuration(d); setCurrentDrill(0); setDrillResults([]); setScreen("drill"); };

  const onDrillComplete = useCallback((result) => {
    setDrillResults(prev => [...prev, result]);
    setCurrentDrill(prev => {
      if (prev < DRILLS.length - 1) {
        return prev + 1;
      } else {
        setTimeout(() => setScreen("results"), 0);
        return prev;
      }
    });
  }, []);

  const restart = () => { setCurrentDrill(0); setDrillResults([]); setScreen("home"); };

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>
      {screen === "home" && <HomeScreen onStart={startFlow} />}
      {screen === "durationSelect" && <DurationScreen onSelect={selectDuration} />}
      {screen === "drill" && (
        <DrillRouter
          drill={DRILLS[currentDrill]}
          drillIndex={currentDrill}
          duration={duration}
          onComplete={onDrillComplete}
        />
      )}
      {screen === "results" && (
        <ResultsScreen results={drillResults} onRestart={restart} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════
function HomeScreen({ onStart }) {
  const [show, setShow] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);

  return (
    <div style={{ ...styles.center, opacity: show ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <div style={styles.logoMark}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#00ff88" strokeWidth="2" fill="none" opacity="0.3" />
          <circle cx="24" cy="24" r="12" stroke="#00ff88" strokeWidth="2" fill="none" opacity="0.5" />
          <circle cx="24" cy="24" r="4" fill="#00ff88" />
          <line x1="24" y1="0" x2="24" y2="10" stroke="#00ff88" strokeWidth="1.5" opacity="0.4" />
          <line x1="24" y1="38" x2="24" y2="48" stroke="#00ff88" strokeWidth="1.5" opacity="0.4" />
          <line x1="0" y1="24" x2="10" y2="24" stroke="#00ff88" strokeWidth="1.5" opacity="0.4" />
          <line x1="38" y1="24" x2="48" y2="24" stroke="#00ff88" strokeWidth="1.5" opacity="0.4" />
        </svg>
      </div>
      <h1 style={styles.title}>AIM<span style={{ color: "#00ff88" }}>-WARMUP</span></h1>
      <p style={styles.subtitle}>Browser aim trainer for competitive FPS — no install, no DM, just reps.</p>
      <button style={styles.btnPrimary} onClick={onStart} className="btn-hover">
        START WARMUP
      </button>
      <p style={styles.hint}>Ready in seconds. Train while your game loads.</p>
    </div>
  );
}

// ═══════════════════════════════════════
// DURATION SELECT
// ═══════════════════════════════════════
function DurationScreen({ onSelect }) {
  return (
    <div style={styles.center}>
      <h2 style={styles.heading}>How long?</h2>
      <p style={styles.subtitleSmall}>Pick your warmup length.</p>
      <div style={{ display: "flex", gap: 20, marginTop: 32 }}>
        <button style={styles.durationCard} onClick={() => onSelect(5)} className="btn-hover">
          <span style={styles.durationNum}>5</span>
          <span style={styles.durationUnit}>min</span>
          <span style={styles.durationDesc}>Quick — before a match</span>
        </button>
        <button style={styles.durationCard} onClick={() => onSelect(10)} className="btn-hover">
          <span style={styles.durationNum}>10</span>
          <span style={styles.durationUnit}>min</span>
          <span style={styles.durationDesc}>Full — proper warmup</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DRILL ROUTER
// ═══════════════════════════════════════
function DrillRouter({ drill, drillIndex, duration, onComplete }) {
  const drillDuration = drill === "reaction" ? 30 : (duration === 5 ? 80 : 150);

  return (
    <div style={styles.drillContainer}>
      <div style={styles.drillHeader}>
        <span style={styles.drillTag}>{DRILL_NAMES[drill]}</span>
        <span style={styles.drillProgress}>{drillIndex + 1} / {DRILLS.length}</span>
      </div>
      {drill === "reaction" && <ReactionDrill duration={drillDuration} onComplete={onComplete} />}
      {drill === "click" && <ClickDrill duration={drillDuration} onComplete={onComplete} />}
      {drill === "follow" && <FollowDrill duration={drillDuration} onComplete={onComplete} />}
    </div>
  );
}

// ═══════════════════════════════════════
// DRILL 1: REACTION TEST
// ═══════════════════════════════════════
function ReactionDrill({ duration, onComplete }) {
  const [phase, setPhase] = useState("waiting");
  const [times, setTimes] = useState([]);
  const [falseClicks, setFalseClicks] = useState(0);
  const [currentTime, setCurrentTime] = useState(null);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const greenAtRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const timesRef = useRef([]);
  const falseClicksRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { clearInterval(countdownRef.current); clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !doneRef.current) {
      doneRef.current = true;
      clearTimeout(timerRef.current);
      const t = timesRef.current;
      const avg = t.length > 0 ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) : 0;
      const best = t.length > 0 ? Math.min(...t) : 0;
      onComplete({ drill: "reaction", avgReaction: avg, bestReaction: best, rounds: t.length, falseClicks: falseClicksRef.current, times: t });
    }
  }, [timeLeft, onComplete]);

  const startRound = () => {
    setPhase("red");
    const delay = rand(1500, 4000);
    timerRef.current = setTimeout(() => {
      greenAtRef.current = performance.now();
      setPhase("green");
    }, delay);
  };

  const handleClick = () => {
    if (doneRef.current) return;
    if (phase === "waiting") {
      startRound();
    } else if (phase === "red") {
      falseClicksRef.current += 1;
      setFalseClicks(f => f + 1);
      clearTimeout(timerRef.current);
      setPhase("tooSoon");
      setTimeout(() => { if (!doneRef.current) setPhase("waiting"); }, 1200);
    } else if (phase === "green") {
      const rt = Math.round(performance.now() - greenAtRef.current);
      setCurrentTime(rt);
      timesRef.current.push(rt);
      setTimes([...timesRef.current]);
      setRound(r => r + 1);
      setPhase("result");
      setTimeout(() => { if (!doneRef.current) setPhase("waiting"); }, 1500);
    }
  };

  const bgColor = phase === "red" ? "#cc2200" : phase === "green" ? "#00aa44" : phase === "tooSoon" ? "#cc6600" : "#0a0a0f";

  return (
    <div style={{ ...styles.drillArea, background: bgColor, cursor: "default", transition: "background 0.15s" }} onClick={handleClick}>
      <div style={styles.timerBadge}>{timeLeft}s</div>
      {phase === "waiting" && (
        <div style={styles.drillMsg}>
          <p style={styles.drillBigText}>Click to start round {round + 1}</p>
          <p style={styles.drillSmallText}>Wait for green, then click.</p>
        </div>
      )}
      {phase === "red" && (
        <div style={styles.drillMsg}>
          <p style={{ ...styles.drillBigText, fontSize: 36 }}>WAIT...</p>
        </div>
      )}
      {phase === "green" && (
        <div style={styles.drillMsg}>
          <p style={{ ...styles.drillBigText, fontSize: 48 }}>CLICK!</p>
        </div>
      )}
      {phase === "tooSoon" && (
        <div style={styles.drillMsg}>
          <p style={{ ...styles.drillBigText, color: "#fff" }}>Too soon.</p>
          <p style={styles.drillSmallText}>Wait for green.</p>
        </div>
      )}
      {phase === "result" && (
        <div style={styles.drillMsg}>
          <p style={{ ...styles.drillBigText, color: "#00ff88" }}>{currentTime} ms</p>
          <p style={styles.drillSmallText}>
            Avg: {Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms // Round {round}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// DRILL 2: CLICK TARGETS
// ═══════════════════════════════════════
function ClickDrill({ duration, onComplete }) {
  const areaRef = useRef(null);
  const [targets, setTargets] = useState([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hitTimes, setHitTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [started, setStarted] = useState(false);
  const lastSpawnRef = useRef(performance.now());
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const hitTimesRef = useRef([]);
  const doneRef = useRef(false);
  const TARGET_COUNT = 10;
  const TARGET_SIZE = 48;

  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [started]);

  useEffect(() => {
    if (timeLeft === 0 && started && !doneRef.current) {
      doneRef.current = true;
      const t = hitTimesRef.current;
      const avgTime = t.length > 0 ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) : 0;
      onComplete({ drill: "click", hits: hitsRef.current, misses: missesRef.current, avgHitTime: avgTime, hitTimes: t });
    }
  }, [timeLeft, started, onComplete]);

  const spawnTargets = useCallback(() => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const pad = 20;
    const newTargets = [];
    for (let i = 0; i < TARGET_COUNT; i++) {
      let x, y, overlap;
      let attempts = 0;
      do {
        x = rand(pad, rect.width - TARGET_SIZE - pad);
        y = rand(pad, rect.height - TARGET_SIZE - pad);
        overlap = newTargets.some(t => Math.hypot(t.x - x, t.y - y) < TARGET_SIZE + 10);
        attempts++;
      } while (overlap && attempts < 50);
      newTargets.push({ id: i, x, y, hit: false });
    }
    lastSpawnRef.current = performance.now();
    setTargets(newTargets);
  }, []);

  const hasSpawnedRef = useRef(false);
  useEffect(() => {
    if (started && areaRef.current && !hasSpawnedRef.current) {
      hasSpawnedRef.current = true;
      spawnTargets();
    }
  }, [started, spawnTargets]);

  const begin = () => { setStarted(true); };

  const handleTargetClick = (e, id) => {
    e.stopPropagation();
    if (doneRef.current) return;
    const now = performance.now();
    const elapsed = now - lastSpawnRef.current;
    hitTimesRef.current.push(Math.round(elapsed));
    setHitTimes([...hitTimesRef.current]);
    hitsRef.current += 1;
    setHits(hitsRef.current);

    setTargets(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, hit: true } : t);
      const allHit = updated.every(t => t.hit);
      if (allHit) setTimeout(spawnTargets, 300);
      return updated;
    });
  };

  const handleMiss = () => {
    if (started && !doneRef.current) { missesRef.current += 1; setMisses(missesRef.current); }
  };

  if (!started) {
    return (
      <div style={{ ...styles.drillArea, cursor: "default" }} onClick={begin}>
        <div style={styles.drillMsg}>
          <p style={styles.drillBigText}>Click Targets</p>
          <p style={styles.drillSmallText}>Hit all 10 targets. Click to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={areaRef} style={{ ...styles.drillArea, background: "#f0f0f0", cursor: "crosshair", position: "relative" }} onClick={handleMiss}>
      <div style={{ ...styles.timerBadge, color: "#0a0a0f", background: "rgba(0,0,0,0.06)", padding: "4px 10px", borderRadius: 6 }}>{timeLeft}s</div>
      <div style={{ position: "absolute", top: 12, left: 16, color: "#333", fontFamily: FONT, fontSize: 13 }}>
        Hits: {hits} | Misses: {misses}
      </div>
      {targets.map(t => (
        <div
          key={t.id}
          onClick={(e) => !t.hit && handleTargetClick(e, t.id)}
          style={{
            position: "absolute",
            left: t.x,
            top: t.y,
            width: TARGET_SIZE,
            height: TARGET_SIZE,
            borderRadius: "50%",
            background: t.hit ? "#00cc55" : "#cc2200",
            border: t.hit ? "3px solid #00ff88" : "3px solid #ff4444",
            cursor: "crosshair",
            transition: "background 0.15s, transform 0.15s, border-color 0.15s",
            transform: t.hit ? "scale(0.85)" : "scale(1)",
            boxShadow: t.hit ? "0 0 12px rgba(0,255,136,0.4)" : "0 2px 8px rgba(204,34,0,0.3)",
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// DRILL 3: FOLLOW THE DOT
// ═══════════════════════════════════════
function FollowDrill({ duration, onComplete }) {
  const areaRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [dotPos, setDotPos] = useState({ x: 200, y: 200 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const dotSize = 32;
  const samplesRef = useRef([]);
  const frameRef = useRef(null);
  const dotVelRef = useRef({ vx: 2.5, vy: 1.8 });
  const dotPosRef = useRef({ x: 200, y: 200 });
  const doneRef = useRef(false);

  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [started]);

  useEffect(() => {
    if (timeLeft === 0 && started && !doneRef.current) {
      doneRef.current = true;
      cancelAnimationFrame(frameRef.current);
      const samples = samplesRef.current;
      const onTarget = samples.filter(s => s.dist <= dotSize).length;
      const pct = samples.length > 0 ? Math.round((onTarget / samples.length) * 100) : 0;
      const avgDist = samples.length > 0 ? Math.round(samples.reduce((a, s) => a + s.dist, 0) / samples.length) : 0;
      onComplete({ drill: "follow", percentOnTarget: pct, avgDistance: avgDist, samples: samples.length });
    }
  }, [timeLeft, started, onComplete]);

  useEffect(() => {
    if (!started || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();

    const animate = () => {
      const dp = dotPosRef.current;
      const dv = dotVelRef.current;
      let nx = dp.x + dv.vx;
      let ny = dp.y + dv.vy;

      if (nx < dotSize || nx > rect.width - dotSize) { dv.vx *= -1; nx = clamp(nx, dotSize, rect.width - dotSize); }
      if (ny < dotSize || ny > rect.height - dotSize) { dv.vy *= -1; ny = clamp(ny, dotSize, rect.height - dotSize); }

      dv.vx += rand(-0.08, 0.08);
      dv.vy += rand(-0.08, 0.08);
      dv.vx = clamp(dv.vx, -4, 4);
      dv.vy = clamp(dv.vy, -4, 4);

      dotPosRef.current = { x: nx, y: ny };
      setDotPos({ x: nx, y: ny });

      const mp = mousePosRef.current;
      const dist = Math.hypot(mp.x - nx, mp.y - ny);
      samplesRef.current.push({ dist });

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started]);

  const handleMouseMove = (e) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    mousePosRef.current = pos;
    setMousePos(pos);
  };

  if (!started) {
    return (
      <div style={{ ...styles.drillArea, cursor: "default" }} onClick={() => setStarted(true)}>
        <div style={styles.drillMsg}>
          <p style={styles.drillBigText}>Track the Dot</p>
          <p style={styles.drillSmallText}>Keep your cursor on the dot. Click to begin.</p>
        </div>
      </div>
    );
  }

  const dist = Math.hypot(mousePos.x - dotPos.x, mousePos.y - dotPos.y);
  const isOnTarget = dist <= dotSize;

  return (
    <div
      ref={areaRef}
      style={{ ...styles.drillArea, background: "#0a0a0f", cursor: "none", position: "relative" }}
      onMouseMove={handleMouseMove}
    >
      <div style={styles.timerBadge}>{timeLeft}s</div>
      <div style={{
        position: "absolute",
        left: dotPos.x - dotSize / 2,
        top: dotPos.y - dotSize / 2,
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: isOnTarget ? "#00ff88" : "#00cc66",
        boxShadow: isOnTarget ? "0 0 20px rgba(0,255,136,0.6)" : "0 0 10px rgba(0,204,102,0.3)",
        transition: "box-shadow 0.1s",
        pointerEvents: "none",
      }} />
      {/* Custom crosshair cursor */}
      <svg style={{ position: "absolute", left: mousePos.x - 12, top: mousePos.y - 12, width: 24, height: 24, pointerEvents: "none", opacity: 0.85 }} viewBox="0 0 24 24">
        <line x1="12" y1="2" x2="12" y2="10" stroke="#fff" strokeWidth="1.5" />
        <line x1="12" y1="14" x2="12" y2="22" stroke="#fff" strokeWidth="1.5" />
        <line x1="2" y1="12" x2="10" y2="12" stroke="#fff" strokeWidth="1.5" />
        <line x1="14" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" fill="#fff" />
      </svg>
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: isOnTarget ? "#00ff88" : "#555", fontFamily: FONT, fontSize: 13, transition: "color 0.15s" }}>
        {isOnTarget ? "ON TARGET" : "off target"} // {Math.round(dist)}px
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════
function ResultsScreen({ results, onRestart }) {
  const reaction = results.find(r => r.drill === "reaction");
  const click = results.find(r => r.drill === "click");
  const follow = results.find(r => r.drill === "follow");

  const getReactionGrade = (ms) => ms < 200 ? "S" : ms < 250 ? "A" : ms < 300 ? "B" : ms < 400 ? "C" : "D";
  const getAccuracyGrade = (h, m) => { const pct = h / (h + m) * 100; return pct > 95 ? "S" : pct > 85 ? "A" : pct > 70 ? "B" : pct > 50 ? "C" : "D"; };
  const getTrackGrade = (pct) => pct > 80 ? "S" : pct > 60 ? "A" : pct > 40 ? "B" : pct > 20 ? "C" : "D";
  const gradeColor = (g) => g === "S" ? "#00ff88" : g === "A" ? "#66ff99" : g === "B" ? "#ffcc00" : g === "C" ? "#ff8800" : "#ff4444";

  return (
    <div style={{ ...styles.center, gap: 24 }}>
      <h2 style={{ ...styles.heading, marginBottom: 0 }}>WARMUP COMPLETE</h2>
      <p style={styles.subtitleSmall}>You're ready to queue.</p>

      <div style={styles.resultsGrid}>
        {reaction && (() => {
          const grade = getReactionGrade(reaction.avgReaction);
          return (
            <div style={styles.resultCard}>
              <div style={styles.resultCardHeader}>
                <span>REACTION</span>
                <span style={{ ...styles.grade, color: gradeColor(grade) }}>{grade}</span>
              </div>
              <div style={styles.statRow}><span style={styles.statLabel}>Avg</span><span style={styles.statVal}>{reaction.avgReaction} ms</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Best</span><span style={styles.statVal}>{reaction.bestReaction} ms</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Rounds</span><span style={styles.statVal}>{reaction.rounds}</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>False clicks</span><span style={styles.statVal}>{reaction.falseClicks}</span></div>
            </div>
          );
        })()}

        {click && (() => {
          const grade = getAccuracyGrade(click.hits, click.misses);
          return (
            <div style={styles.resultCard}>
              <div style={styles.resultCardHeader}>
                <span>CLICK</span>
                <span style={{ ...styles.grade, color: gradeColor(grade) }}>{grade}</span>
              </div>
              <div style={styles.statRow}><span style={styles.statLabel}>Hits</span><span style={styles.statVal}>{click.hits}</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Misses</span><span style={styles.statVal}>{click.misses}</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Avg time</span><span style={styles.statVal}>{click.avgHitTime} ms</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Accuracy</span><span style={styles.statVal}>{click.hits + click.misses > 0 ? Math.round(click.hits / (click.hits + click.misses) * 100) : 0}%</span></div>
            </div>
          );
        })()}

        {follow && (() => {
          const grade = getTrackGrade(follow.percentOnTarget);
          return (
            <div style={styles.resultCard}>
              <div style={styles.resultCardHeader}>
                <span>TRACKING</span>
                <span style={{ ...styles.grade, color: gradeColor(grade) }}>{grade}</span>
              </div>
              <div style={styles.statRow}><span style={styles.statLabel}>On target</span><span style={styles.statVal}>{follow.percentOnTarget}%</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Avg distance</span><span style={styles.statVal}>{follow.avgDistance}px</span></div>
              <div style={styles.statRow}><span style={styles.statLabel}>Samples</span><span style={styles.statVal}>{follow.samples}</span></div>
            </div>
          );
        })()}
      </div>

      <button style={styles.btnPrimary} onClick={onRestart} className="btn-hover">TRAIN AGAIN</button>

      <p style={styles.reminder}>Your warmup is done — go queue up.</p>
    </div>
  );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const FONT = "Consolas, 'Courier New', monospace";

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .btn-hover { transition: transform 0.15s ease, box-shadow 0.15s ease !important; }
  .btn-hover:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 24px rgba(0,255,136,0.15) !important; }
  .btn-hover:active { transform: translateY(0) !important; }

  ::selection { background: rgba(0,255,136,0.3); }
`;

const styles = {
  app: {
    width: "100vw", height: "100vh", background: "#0a0a0f", color: "#e0e0e0",
    fontFamily: FONT, overflow: "hidden", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  center: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    height: "100%", width: "100%", gap: 16,
  },
  logoMark: { marginBottom: 8, opacity: 0.9 },
  title: { fontSize: 48, fontWeight: 700, letterSpacing: 4, color: "#fff", fontFamily: FONT },
  subtitle: { color: "#888", fontSize: 15, maxWidth: 400, textAlign: "center", lineHeight: 1.5, fontFamily: FONT },
  subtitleSmall: { color: "#666", fontSize: 13, fontFamily: FONT },
  hint: { color: "#444", fontSize: 12, marginTop: 8, fontFamily: FONT },
  heading: { fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: 2, fontFamily: FONT },
  btnPrimary: {
    background: "#00ff88", color: "#0a0a0f", border: "none", borderRadius: 12,
    padding: "16px 48px", fontSize: 15, fontWeight: 700, cursor: "pointer",
    fontFamily: FONT, letterSpacing: 2, marginTop: 16,
  },
  durationCard: {
    background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "28px 40px", cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 6, color: "#fff", fontFamily: FONT,
  },
  durationNum: { fontSize: 42, fontWeight: 700, color: "#00ff88" },
  durationUnit: { fontSize: 14, color: "#888", letterSpacing: 1 },
  durationDesc: { fontSize: 12, color: "#555", marginTop: 4 },
  drillContainer: { width: "100%", height: "100%", display: "flex", flexDirection: "column" },
  drillHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  drillTag: { fontSize: 14, fontWeight: 600, color: "#00ff88", fontFamily: FONT, letterSpacing: 2 },
  drillProgress: { fontSize: 13, color: "#555", fontFamily: FONT },
  drillArea: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", userSelect: "none",
  },
  drillMsg: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  drillBigText: { fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: FONT, letterSpacing: 1 },
  drillSmallText: { fontSize: 13, color: "#888", fontFamily: FONT },
  timerBadge: {
    position: "absolute", top: 12, right: 16, fontSize: 18, fontWeight: 700,
    color: "#00ff88", fontFamily: FONT,
  },
  resultsGrid: { display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 8 },
  resultCard: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 24, width: 220, display: "flex", flexDirection: "column", gap: 10,
  },
  resultCardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 13, fontWeight: 600, color: "#aaa", fontFamily: FONT, letterSpacing: 2,
    paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  grade: { fontSize: 28, fontWeight: 700 },
  statRow: { display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: FONT },
  statLabel: { color: "#666" },
  statVal: { color: "#ddd", fontFamily: FONT, fontWeight: 600 },
  reminder: { color: "#555", fontSize: 13, fontFamily: FONT, marginTop: 8, fontStyle: "italic" },
};