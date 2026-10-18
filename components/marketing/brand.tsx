import s from "./styles";

export function Symbol({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={s.symbolArcs}>
      <path pathLength="100" d="M12.08 20.5A23 23 0 0 1 45.19 13.16" />
      <path pathLength="100" d="M53.61 24.13A23 23 0 0 1 39.87 53.61" />
      <path pathLength="100" d="M26.05 54.22A23 23 0 0 1 9.35 36" />
      <path pathLength="100" d="M20.51 41.64A15 15 0 1 1 46.1 26.87" />
    </g>
    <circle className={s.symbolNode} cx="32" cy="32" r="4" fill="currentColor" />
    <circle className={s.symbolSignal} cx="32" cy="32" r="23" pathLength="100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 95" />
  </svg>;
}

export function Brand() {
  return <span className={s.brand}><Symbol /><span className="immune-wordmark">IMMUNE</span></span>;
}
