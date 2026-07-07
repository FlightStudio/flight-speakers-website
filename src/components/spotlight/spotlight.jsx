import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

/* ============================================================
   SPOTLIGHT
   A soft light source built from one circle rendered in N
   stacked layers. Each layer is masked to a vertical band and
   blurred progressively more toward the emission side, so the
   left edge stays crisp while the right edge dissolves.

   - Fully transparent background (drop it on anything)
   - `color` transitions smoothly (solid fills, not gradients)
   - `alive` drives an organic breathing of the blurred side
   - `angle` rotates the emission direction
   - <SpotlightParticles/> is the ambient-particle variant
   ============================================================ */

const LAYER_COUNT = 8;

// Mask stops are computed in px against an oversized wrapper (bleed
// padding on all sides), so the mask never clips the blur spill —
// clipped spill is what shows up as hard vertical seams.
function buildLayers(blurMin, blurMax, W, pad) {
  const px = (p) => pad + (p / 100) * W; // content-percent -> wrapper px
  return Array.from({ length: LAYER_COUNT }, (_, i) => {
    const t = i / (LAYER_COUNT - 1);
    const center = 4 + t * 92;
    const half = 14;
    const feather = 30; // wide, soft crossfade between blur levels
    const a = px(center - half - feather);
    const b = px(center - half);
    const c = px(center + half);
    const d = px(center + half + feather);
    // eased mid-stops approximate a smoothstep ramp instead of a linear one
    const mask =
      i === 0
        ? `linear-gradient(90deg, black 0px, black ${c}px, rgba(0,0,0,0.5) ${(c + d) / 2}px, transparent ${d}px)`
        : i === LAYER_COUNT - 1
        ? `linear-gradient(90deg, transparent ${a}px, rgba(0,0,0,0.5) ${(a + b) / 2}px, black ${b}px, black 100%)`
        : `linear-gradient(90deg, transparent ${a}px, rgba(0,0,0,0.5) ${(a + b) / 2}px, black ${b}px, black ${c}px, rgba(0,0,0,0.5) ${(c + d) / 2}px, transparent ${d}px)`;
    const blur = blurMin + (blurMax - blurMin) * Math.pow(t, 1.5);
    return { t, mask, blur };
  });
}

export function Spotlight({
  size = 380,          // circle diameter, px
  color = "#ffffff",
  blurMin = 3,         // crisp side
  blurMax = 90,        // emission side
  alive = true,        // organic breathing of the blurred side
  intensity = 1,       // overall opacity 0..1
  angle = 0,           // rotate emission direction, degrees
  speed = 1,           // breathing speed multiplier
}) {
  const rootRef = useRef(null);
  const blobRefs = useRef([]);

  // container leaves room for the light to spill right
  const W = size * 2.05;
  const H = size * 1.35;
  // bleed padding around every layer so blur can spill freely
  const pad = Math.max(blurMax * 2.2, size * 0.5);

  // the bright core's center — rotation pivots here, not the box center,
  // so changing `angle` swings the beam instead of orbiting the light
  const coreX = size * 0.12 + size / 2;

  const layers = useMemo(
    () => buildLayers(blurMin, blurMax, W, pad),
    [blurMin, blurMax, W, pad]
  );

  // Perf notes:
  // - blur is set ONCE and never animated; re-rasterizing an animated
  //   filter every frame is what melts CPUs
  // - blobs render at half size with half blur, then scale(2) — 4x
  //   fewer pixels for the blur pass, identical visual result
  // - the loop only touches transform + opacity (compositor-only),
  //   is throttled to 30fps, and pauses when offscreen
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const setStatic = () => {
      layers.forEach((l, i) => {
        const el = blobRefs.current[i];
        if (el) {
          el.style.transform = "scale(2)";
          el.style.opacity = "1";
        }
      });
    };
    if (!alive || reduced) {
      setStatic();
      return;
    }

    let raf = null;
    let last = 0;
    const FRAME = 1000 / 30;
    const t0 = performance.now();

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME) return;
      last = now;
      const t = ((now - t0) / 1000) * speed;
      // layered sines -> non-repeating organic pulse in 0..1
      const pulse =
        0.5 +
        0.5 * (0.55 * Math.sin(t * 0.9) + 0.3 * Math.sin(t * 2.3 + 1.7) + 0.15 * Math.sin(t * 4.1 + 0.6));
      layers.forEach((l, i) => {
        const el = blobRefs.current[i];
        if (!el) return;
        // only the blurred side breathes; crisp side stays anchored
        const w = Math.pow(l.t, 2);
        const push = w * pulse * size * 0.045;
        const stretch = 1 + w * pulse * 0.07;
        el.style.transform = `translateX(${push}px) scale(2) scaleX(${stretch})`;
        el.style.opacity = String(1 - w * 0.3 * (1 - pulse));
      });
    };

    const start = () => {
      if (raf == null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf != null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    let io;
    if (rootRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? start() : stop();
      });
      io.observe(rootRef.current);
    } else {
      start();
    }

    return () => {
      stop();
      io?.disconnect();
    };
  }, [alive, layers, size, speed]);

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: W,
        height: H,
        transform: `rotate(${angle}deg)`,
        transformOrigin: `${coreX}px ${H / 2}px`,
        opacity: intensity,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {layers.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -pad,
            top: -pad,
            width: W + pad * 2,
            height: H + pad * 2,
            WebkitMaskImage: l.mask,
            maskImage: l.mask,
            overflow: "visible",
          }}
        >
          <div
            ref={(el) => (blobRefs.current[i] = el)}
            style={{
              position: "absolute",
              width: size / 2,
              height: size / 2,
              left: pad + size * 0.12,
              top: pad + H / 2 - size / 4,
              borderRadius: "50%",
              backgroundColor: color,
              transition: "background-color 700ms ease",
              filter: `blur(${l.blur / 2}px)`,
              transform: "scale(2)",
              transformOrigin: "left center",
              willChange: "transform, opacity",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SPOTLIGHT + PARTICLES
   Same spotlight, plus a canvas overlay that emits tiny motes
   from the dissolved side. Additive blending keeps them glowy
   on dark backgrounds while staying transparent underneath.
   ============================================================ */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function SpotlightParticles({
  rate = 26,       // particles per second
  spread = 0.5,    // 0..1, how wide the emission cone is
  velocity = 1,    // drift speed multiplier
  angle = 0,
  ...props
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  // live-updating refs: tuning these doesn't restart the particle system
  const colorRef = useRef(props.color || "#ffffff");
  colorRef.current = props.color || "#ffffff";
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const spreadRef = useRef(spread);
  spreadRef.current = spread;
  const velRef = useRef(velocity);
  velRef.current = velocity;
  // mirror Spotlight's geometry so rotation pivots the bright core
  const s = props.size ?? 380;
  const coreX = s * 0.12 + s / 2;
  const coreY = (s * 1.35) / 2;

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // capped: motes don't need retina

    const fit = () => {
      // offsetWidth/Height = layout size, unaffected by the wrapper's
      // rotation. getBoundingClientRect() returns the rotated bounding
      // box (width/height swap at ±90°), which misplaced the canvas.
      const w = wrap.offsetWidth;
      const h = wrap.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    };
    fit();

    let parts = [];
    let raf = null;
    let last = performance.now();
    let lastDraw = 0;
    let spawnDebt = 0;
    const FRAME = 1000 / 30;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME) return;
      lastDraw = now;
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // spawn from the dissolved region (right of the core)
      spawnDebt += rateRef.current * dt;
      const sp = spreadRef.current;
      const vel = velRef.current;
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        const gy = (Math.random() + Math.random() + Math.random()) / 3 - 0.5; // center-weighted, -0.5..0.5
        parts.push({
          x: w * (0.42 + Math.random() * (0.16 + sp * 0.24)),
          y: h * 0.5 + gy * h * (0.25 + sp * 0.65),
          vx: (18 + Math.random() * 42) * vel * dpr,
          vy: (Math.random() - 0.5) * (8 + sp * 55) * vel * dpr,
          life: 0,
          ttl: 2.2 + Math.random() * 2.6,
          r: (0.6 + Math.random() * 1.5) * dpr,
        });
      }

      const [cr, cg, cb] = hexToRgb(colorRef.current);
      ctx.globalCompositeOperation = "lighter";
      parts = parts.filter((p) => {
        p.life += dt;
        if (p.life > p.ttl) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt + Math.sin(p.life * 3 + p.x) * 6 * vel * dpr * dt;
        p.vx *= 1 - 0.15 * dt;
        const k = p.life / p.ttl;
        const alpha = Math.sin(Math.PI * k) * 0.8; // fade in, fade out
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.arc(p.x, p.y, p.r * (1 - k * 0.4), 0, Math.PI * 2);
        ctx.fill();
        return p.x < w + 20;
      });
    };

    const start = () => {
      if (raf == null) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf != null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? start() : stop();
      });
      io.observe(wrap);
    } else {
      start();
    }

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => {
      stop();
      io?.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-block",
        transform: `rotate(${angle}deg)`,
        transformOrigin: `${coreX}px ${coreY}px`,
        pointerEvents: "none",
      }}
    >
      <Spotlight {...props} angle={0} />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}

/* ============================================================
   DEMO PLAYGROUND
   Dark stage so the white light reads. The component itself
   has no background — toggle the stage to verify transparency.
   ============================================================ */

const SWATCHES = ["#ffffff", "#ffd9a3", "#9ecbff", "#b6f0c1", "#f2a6c8"];

export default function App() {
  const [color, setColor] = useState("#ffffff");
  const [blurMax, setBlurMax] = useState(90);
  const [size, setSize] = useState(340);
  const [alive, setAlive] = useState(true);
  const [particles, setParticles] = useState(false);
  const [pRate, setPRate] = useState(26);
  const [pSpread, setPSpread] = useState(0.5);
  const [pVelocity, setPVelocity] = useState(1);
  const [angle, setAngle] = useState(0);
  const [checker, setChecker] = useState(false);

  const stageBg = checker
    ? {
        backgroundImage:
          "linear-gradient(45deg, #2a2a2e 25%, transparent 25%, transparent 75%, #2a2a2e 75%), linear-gradient(45deg, #2a2a2e 25%, transparent 25%, transparent 75%, #2a2a2e 75%)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
        backgroundColor: "#1c1c20",
      }
    : { backgroundColor: "#0a0a0c" };

  const Comp = particles ? SpotlightParticles : Spotlight;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        ...stageBg,
        transition: "background-color 400ms ease",
      }}
    >
      {/* the core is pinned to stage center: size/angle changes happen
          around a fixed anchor point instead of re-flowing the layout */}
      <div style={{ flex: 1, position: "relative", overflow: "visible" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
          <div
            style={{
              position: "absolute",
              left: -(size * 0.12 + size / 2),
              top: -(size * 1.35) / 2,
            }}
          >
            <Comp
              size={size}
              color={color}
              blurMin={3}
              blurMax={blurMax}
              alive={alive}
              angle={angle}
              {...(particles && { rate: pRate, spread: pSpread, velocity: pVelocity })}
            />
          </div>
        </div>
      </div>

      {/* control rail */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px 32px",
          alignItems: "center",
          padding: "16px 22px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.55)",
          fontSize: 11,
          letterSpacing: "0.08em",
          backgroundColor: "rgba(10,10,12,0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Control label="COLOR">
          <div style={{ display: "flex", gap: 6 }}>
            {SWATCHES.map((s) => (
              <button
                key={s}
                onClick={() => setColor(s)}
                aria-label={`Set color ${s}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: s,
                  border: color === s ? "2px solid rgba(255,255,255,0.9)" : "2px solid transparent",
                  outlineOffset: 2,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </Control>

        <Control label={`EMISSION BLUR ${blurMax}px`}>
          <input type="range" min={20} max={160} value={blurMax} onChange={(e) => setBlurMax(+e.target.value)} />
        </Control>

        <Control label={`SIZE ${size}px`}>
          <input type="range" min={180} max={460} value={size} onChange={(e) => setSize(+e.target.value)} />
        </Control>

        <Control label={`ANGLE ${angle}°`}>
          <input type="range" min={-90} max={90} value={angle} onChange={(e) => setAngle(+e.target.value)} />
        </Control>

        <Toggle label="ALIVE" on={alive} set={setAlive} />
        <Toggle label="PARTICLES" on={particles} set={setParticles} />

        {particles && (
          <>
            <Control label={`QUANTITY ${pRate}/s`}>
              <input type="range" min={4} max={90} value={pRate} onChange={(e) => setPRate(+e.target.value)} />
            </Control>

            <Control label={`SPREAD ${Math.round(pSpread * 100)}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(pSpread * 100)}
                onChange={(e) => setPSpread(+e.target.value / 100)}
              />
            </Control>

            <Control label={`SPEED ${pVelocity.toFixed(1)}x`}>
              <input
                type="range"
                min={2}
                max={30}
                value={Math.round(pVelocity * 10)}
                onChange={(e) => setPVelocity(+e.target.value / 10)}
              />
            </Control>
          </>
        )}
        <Toggle label="CHECK TRANSPARENCY" on={checker} set={setChecker} />
      </div>
    </div>
  );
}

function Control({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, on, set }) {
  return (
    <button
      onClick={() => set(!on)}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 11,
        letterSpacing: "0.08em",
        fontFamily: "inherit",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.18)",
        backgroundColor: on ? "rgba(255,255,255,0.92)" : "transparent",
        color: on ? "#0a0a0c" : "rgba(255,255,255,0.55)",
        transition: "all 200ms ease",
      }}
    >
      {label}
    </button>
  );
}
