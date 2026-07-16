import React, { useRef, useCallback } from "react";

// Wraps a card so it tilts toward the cursor in true 3D (perspective +
// rotateX/rotateY on a preserve-3d element), and drives a rim-light overlay
// via CSS custom properties so the highlight follows the pointer.
export default function TiltCard({
  personaId,
  isActive,
  isDimmed,
  onClick,
  onEnter,
  onLeave,
  children,
  style,
  floatDelay = 0,
}) {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 16;
    const rx = (0.5 - py) * 12;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0px)";
    onLeave?.();
  }, [onLeave]);

  return (
    <div
      className="persona-scene persona-card3d-float"
      style={{ animationDelay: `${floatDelay}s` }}
    >
      <div
        ref={ref}
        data-persona={personaId}
        className={`persona-card3d${isActive ? " is-active" : ""}${isDimmed ? " is-dimmed" : ""}`}
        onMouseEnter={onEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick}
        style={style}
      >
        <div className="persona-card3d-rim" />
        {children}
      </div>
    </div>
  );
}
