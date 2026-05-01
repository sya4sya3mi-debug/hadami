"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ─── MotionReveal — drop-in replacement for the legacy Reveal ─── */
export function MotionReveal({
  children,
  delay = 0,
  y = 28,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: "blur(2px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.7,
        ease: EASE,
        delay: delay / 1000,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── SplitText — char/word stagger reveal ─── */
export function SplitText({
  text,
  by = "char",
  delay = 0,
  stagger = 0.04,
  duration = 0.7,
  style,
  className,
  as: Tag = "span",
}: {
  text: string;
  by?: "char" | "word";
  delay?: number;
  stagger?: number;
  duration?: number;
  style?: CSSProperties;
  className?: string;
  as?: "span" | "div";
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <Tag className={className} style={style}>
        {text}
      </Tag>
    );
  }

  const tokens = by === "word" ? text.split(/(\s+)/) : Array.from(text);

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
  const item: Variants = {
    hidden: { y: "0.6em", opacity: 0, filter: "blur(4px)" },
    show: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration, ease: EASE },
    },
  };

  return (
    <motion.span
      className={className}
      style={{ display: "inline-block", ...style }}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      aria-label={text}
    >
      {tokens.map((t, i) =>
        t === " " || t === "\n" || /^\s+$/.test(t) ? (
          <span key={i} aria-hidden style={{ whiteSpace: "pre" }}>
            {t}
          </span>
        ) : (
          <motion.span
            key={i}
            variants={item}
            aria-hidden
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {t}
          </motion.span>
        ),
      )}
    </motion.span>
  );
}

/* ─── Typewriter — char-by-char typing with hairline cursor ─── */
export function Typewriter({
  lines,
  speed = 55,
  startDelay = 0,
  cursor = true,
  cursorColor = "currentColor",
  style,
  className,
}: {
  lines: string[];
  speed?: number;
  startDelay?: number;
  cursor?: boolean;
  cursorColor?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const [text, setText] = useState<string[]>(lines.map(() => ""));

  // Hero 直下用なので useInView は使わない（margin:"-10%" + 短い viewport で
  // 永遠に false になり tick が発火しないケースを回避）。マウント直後から開始する。
  useEffect(() => {
    if (reduced) {
      setText(lines);
      setDone(true);
      return;
    }
    let cancelled = false;
    const flat = lines.join("\n");
    let idx = 0;
    const timer: { id: number | null } = { id: null };

    const tick = () => {
      if (cancelled) return;
      idx += 1;
      const partial = flat.slice(0, idx);
      const split = partial.split("\n");
      const padded = lines.map((_, i) => split[i] ?? "");
      setText(padded);
      if (idx < flat.length) {
        timer.id = window.setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    };

    timer.id = window.setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      if (timer.id != null) clearTimeout(timer.id);
    };
  }, [reduced, speed, startDelay, lines]);

  return (
    <span className={className} style={style}>
      {text.map((l, i) => (
        <span key={i}>
          {l}
          {i < text.length - 1 ? <br /> : null}
        </span>
      ))}
      {cursor && !done && !reduced && (
        <motion.span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.5px",
            height: "1em",
            background: cursorColor,
            marginLeft: 2,
            verticalAlign: "-0.12em",
          }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </span>
  );
}

/* ─── GradientSweep — periodic light-streak across text ─── */
export function GradientSweep({
  children,
  baseColor = "currentColor",
  glintColor = "oklch(0.62 0.06 150)",
  duration = 2.4,
  intervalSec = 6,
  pinLastChar = false,
  style,
  className,
}: {
  children: ReactNode;
  baseColor?: string;
  glintColor?: string;
  duration?: number;
  intervalSec?: number;
  pinLastChar?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const cycleDuration = Math.max(duration, intervalSec);

  if (reduced) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  if (pinLastChar && typeof children === "string" && children.length > 1) {
    const chars = Array.from(children);
    const lastChar = chars.pop() ?? "";
    const leadingText = chars.join("");
    const revealStart = Math.max(0.04, (duration * 0.72) / cycleDuration);
    const revealEnd = Math.min(0.88, (duration * 0.98) / cycleDuration);
    const holdEnd = Math.min(0.92, revealEnd + 0.1);
    const fadeEnd = Math.min(0.98, holdEnd + 0.08);

    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          ...style,
        }}
      >
        <motion.span
          style={{
            display: "inline-block",
            backgroundImage: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 40%, ${glintColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
            backgroundSize: "300% 100%",
            backgroundRepeat: "no-repeat",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
          animate={{ backgroundPosition: ["100% 0%", "0% 0%"] }}
          transition={{
            duration,
            repeat: Infinity,
            repeatDelay: Math.max(0, intervalSec - duration),
            ease: "easeInOut",
          }}
        >
          {leadingText}
        </motion.span>
        <span
          style={{
            position: "relative",
            display: "inline-block",
            color: baseColor,
          }}
        >
          {lastChar}
          <motion.span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              color: glintColor,
              textShadow: `0 0 10px ${glintColor}`,
              pointerEvents: "none",
            }}
            animate={{
              opacity: [0, 0, 0.85, 1, 1, 1, 0],
              clipPath: [
                "inset(0 100% 0 0)",
                "inset(0 100% 0 0)",
                "inset(0 36% 0 0)",
                "inset(0 0% 0 0)",
                "inset(0 0% 0 0)",
                "inset(0 0% 0 100%)",
                "inset(0 100% 0 0)",
              ],
            }}
            transition={{
              duration: cycleDuration,
              repeat: Infinity,
              ease: "linear",
              times: [
                0,
                Math.max(0, revealStart - 0.05),
                revealStart,
                revealEnd,
                holdEnd,
                fadeEnd,
                1,
              ],
            }}
          >
            {lastChar}
          </motion.span>
        </span>
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        backgroundImage: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 40%, ${glintColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
        backgroundSize: "300% 100%",
        backgroundRepeat: "no-repeat",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        ...style,
      }}
      animate={{ backgroundPosition: ["100% 0%", "0% 0%"] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatDelay: Math.max(0, intervalSec - duration),
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}

/* ─── ScrollScene — pinned section driven by scroll progress ─── */
export function ScrollScene({
  steps,
  height,
  children,
  enabled = true,
  style,
  className,
}: {
  steps: number;
  height?: string;
  enabled?: boolean;
  children: (ctx: {
    progress: MotionValue<number>;
    stepIndex: MotionValue<number>;
  }) => ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const stepIndex = useTransform(scrollYProgress, (p) =>
    Math.min(steps - 1, Math.floor(p * steps)),
  );

  if (!enabled || reduced) {
    return (
      <div className={className} style={style}>
        {children({
          progress: scrollYProgress,
          stepIndex,
        })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        height: height ?? `${steps * 100}vh`,
        ...style,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          willChange: "transform",
        }}
      >
        {children({
          progress: scrollYProgress,
          stepIndex,
        })}
      </div>
    </div>
  );
}

/* ─── useStepFromMV — subscribe to a MotionValue<number> as React state ─── */
export function useStepFromMV(mv: MotionValue<number>) {
  const [v, setV] = useState<number>(() => mv.get());
  useEffect(() => {
    const unsub = mv.on("change", (latest) => setV(Math.round(latest)));
    return unsub;
  }, [mv]);
  return v;
}

/* ─── Magnetic — gentle cursor-pull wrapper for CTAs ─── */
export function Magnetic({
  children,
  strength = 0.08,
  max = 4,
  disabled = false,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18 });
  const sy = useSpring(y, { stiffness: 180, damping: 18 });
  const ref = useRef<HTMLDivElement>(null);

  const off = reduced || disabled;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (off) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    x.set(Math.max(-max, Math.min(max, dx)));
    y.set(Math.max(-max, Math.min(max, dy)));
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (off) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ display: "inline-block", x: sx, y: sy, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

/* ─── HairlineDivider — animated SVG line that draws in on view ─── */
export function HairlineDivider({
  ink = "#1a1a16",
  opacity = 0.13,
  duration = 1.4,
  style,
  className,
}: {
  ink?: string;
  opacity?: number;
  duration?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      className={className}
      width="100%"
      height="0.5"
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      <motion.line
        x1="0"
        y1="0.25"
        x2="100%"
        y2="0.25"
        stroke={ink}
        strokeOpacity={opacity}
        strokeWidth="0.5"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: reduced ? 0 : duration, ease: EASE }}
      />
    </motion.svg>
  );
}
