"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./styles";

const quietQuery = "(prefers-reduced-motion: reduce), (max-width: 760px), (max-height: 650px)";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
function subscribeQuiet(callback: () => void) {
  const media = window.matchMedia(quietQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useQuietMotion() {
  return useSyncExternalStore(subscribeQuiet, () => window.matchMedia(quietQuery).matches, () => false);
}

// Read once in a scheduled frame; write directly to the animated elements.
// Manual choices retain their progress when the visitor resumes scrolling.
export function useFilm(count: number, hero = false) {
  const ref = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  const quiet = useQuietMotion();
  const controls = useRef<{ select: (progress: number) => void; play: () => void }>({ select: () => {}, play: () => {} });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const find = (name: keyof typeof s) => Array.from(element.querySelectorAll<HTMLElement | SVGElement>(`.${s[name]}`));
    const parts = {
      rings: find("engineRings"), orbit: find("engineOrbit"), inner: find("engineInner"),
      hearts: Array.from(element.querySelectorAll<SVGElement>(`.${s.engineHeart} > svg`)),
      heroGrid: find("heroGrid"), heroCopy: find("heroCopy"),
      checking: find("checkingLabel"), resolved: find("resolvedLabel"), packet: find("archPacket"),
      storyPacket: find("storyPacket"), memory: find("storyMemory"), coreRing: find("storyCoreRing"),
      agents: find("storyAgent"), readouts: find("storyReadout"), heroSignal: element.querySelector<HTMLElement>(`.${s.heroSignalPath} i`),
    };
    const shared = element.closest(`.${s.opening}`)?.querySelector(`.${s.openingEngine}`);
    shared?.querySelectorAll<SVGElement>(`.${s.engineRings}`).forEach(node => parts.rings.push(node));
    shared?.querySelectorAll<SVGElement>(`.${s.engineInner}`).forEach(node => parts.inner.push(node));
    shared?.querySelectorAll<SVGElement>(`.${s.engineHeart} > svg`).forEach(node => parts.hearts.push(node));
    const diagram = element.querySelector<HTMLElement>(`.${s.architectureDiagram}`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 760px)");
    let active = false, frame = 0, current = 0, target = 0, lastTime = 0, lastScene = -1;
    let needsMeasure = true, scrollProgress = 0, offset = 0;
    let playback: { start: number; duration: number } | null = null;
    const paint = () => {
      const pulse = Math.sin(current * Math.PI);
      const resolved = clamp((current - .72) / .2);
      parts.rings.forEach(node => { node.style.transform = `rotate(${-16 * current}deg) scale(${1 + pulse * .025})`; });
      parts.orbit.forEach(node => { node.style.transform = `rotate(${65 * current}deg)`; });
      parts.inner.forEach(node => {
        node.style.transform = `scale(${1 + pulse * .14})`;
        node.style.opacity = String(.6 + pulse * .4);
      });
      parts.hearts.forEach(node => { node.style.transform = `scale(${1 + pulse * .07})`; });
      // Preserve the original hero depth without inherited per-frame variables.
      parts.heroGrid.forEach(node => { node.style.transform = `perspective(500px) rotateX(65deg) translateY(${quiet ? 0 : current * 30}px)`; });
      parts.heroCopy.forEach(node => { node.style.transform = `translateY(${quiet ? 0 : current * -16}px)`; });
      parts.checking.forEach(node => { node.style.opacity = String(1 - resolved); });
      parts.resolved.forEach(node => { node.style.opacity = String(resolved); });
      if (parts.heroSignal) {
        parts.heroSignal.style.transform = `translateX(${current * 100}cqw)`;
        parts.heroSignal.style.opacity = String(1 - resolved);
      }
      const decision = diagram?.dataset.decision ?? "ALLOW";
      const travel = Math.min(current, decision === "REVIEW" ? .5 : decision === "BLOCK" ? .34 : 1);
      parts.packet.forEach(node => {
        node.style.transform = `${mobile.matches ? `translateY(${travel * 295}px)` : `translate(${travel * 76}cqw, -50%)`} scale(${decision === "BLOCK" ? 1 - resolved * .8 : 1})`;
        node.style.opacity = String(decision === "BLOCK" ? 1 - resolved : 1);
      });
      const position = current * (count - 1);
      if (count === 8) {
        const next = clamp((position - 5.3) / .5);
        const memory = clamp((current - .48) * 5);
        parts.storyPacket.forEach(node => {
          node.style.transform = `translateY(${position < 5.3 ? Math.min(position, 1) * 160 : clamp((position - 5.3) / 1.7) * 110}px)`;
          node.style.opacity = String(position < 5.3 ? 1 - clamp(position - 1) : next);
        });
        parts.agents.forEach((node, i) => { node.style.opacity = String(i ? next : 1 - next); });
        parts.memory.forEach(node => { node.style.opacity = String(memory); node.style.transform = `translateX(${(1 - memory) * 12}px)`; });
        parts.coreRing.forEach(node => {
          node.style.transform = `scale(${1 + memory * .2})`;
          // Only the outer dashed ring rotates, as in the original scene.
          node.style.setProperty("--progress", String(current));
        });
        // Fade out before the next phrase enters, avoiding overlapping words.
        parts.readouts.forEach((node, i) => {
          const weight = clamp((.48 - Math.abs(position - i)) * 5);
          node.style.opacity = String(weight);
          node.style.transform = `translateY(${(1 - weight) * 6}px)`;
        });
      }
      const nextScene = Math.round(position);
      if (nextScene !== lastScene) { lastScene = nextScene; setScene(nextScene); }
    };
    const measure = () => {
      needsMeasure = false;
      if (quiet) return;
      const rect = element.getBoundingClientRect();
      scrollProgress = hero ? clamp(-rect.top / Math.max(1, rect.height * .8)) : clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
      if (!playback) target = clamp(scrollProgress + offset);
    };
    const tick = (time: number) => {
      frame = 0;
      if (!active || document.hidden) return;
      if (needsMeasure) measure();
      const elapsed = Math.min(time - (lastTime || time - 16), 50);
      lastTime = time;
      if (playback) {
        current = target = clamp((time - playback.start) / playback.duration);
        if (current === 1) { playback = null; offset = 1 - scrollProgress; }
      } else {
        current += (target - current) * (1 - Math.exp(-elapsed / 90));
        if (Math.abs(target - current) < .0002) current = target;
      }
      paint();
      if (playback || current !== target) frame = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!frame && active && !document.hidden) frame = requestAnimationFrame(tick); };
    const onScroll = () => { if (!quiet) { needsMeasure = true; schedule(); } };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else { if (playback) playback.start = performance.now() - current * playback.duration; lastTime = 0; schedule(); }
    };
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) { needsMeasure = true; lastTime = 0; schedule(); }
      else { cancelAnimationFrame(frame); frame = 0; if (playback) { current = target = 1; paint(); } playback = null; offset = 0; }
    });
    observer.observe(element);
    controls.current = {
      select(progress) {
        playback = null; target = clamp(progress); offset = target - scrollProgress;
        if (quiet) { current = target; paint(); } else schedule();
      },
      play() {
        current = target = 0; paint();
        if (reduced.matches) { current = target = 1; offset = 1 - scrollProgress; paint(); }
        else { playback = { start: performance.now(), duration: 2200 }; schedule(); }
      },
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [count, hero, quiet]);
  return { ref, scene, select: (progress: number) => controls.current.select(progress), play: () => controls.current.play() };
}

// One actual SVG travels between the three opening scenes. Small screens use
// inline geometry instead. All three layout reads happen before any writes.
export function useMembraneJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const quiet = useQuietMotion();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || quiet) return;
    const membrane = root.querySelector<HTMLElement>(`.${s.openingEngine}`);
    const anchors = Array.from(root.querySelectorAll<HTMLElement>("[data-membrane-anchor]"));
    const how = root.querySelector<HTMLElement>("#how-it-works");
    const control = root.querySelector<HTMLElement>("#control-layer");
    if (!membrane || anchors.length !== 3 || !how || !control) return;
    let frame = 0, active = true;
    const paint = () => {
      frame = 0;
      const bounds = anchors.map(node => node.getBoundingClientRect());
      const howTop = how.getBoundingClientRect().top;
      const controlTop = control.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const second = clamp((vh - controlTop) / (vh * .85));
      const first = clamp((vh - howTop) / (vh * .7));
      const from = bounds[second > 0 ? 1 : 0], to = bounds[second > 0 ? 2 : 1];
      const raw = second > 0 ? second : first;
      const t = raw * raw * (3 - 2 * raw);
      const mix = (a: number, b: number) => a + (b - a) * t;
      const size = mix(from.width, to.width);
      const x = mix(from.left + from.width / 2, to.left + to.width / 2) - 350;
      const y = mix(from.top + from.height / 2, to.top + to.height / 2) - 350;
      membrane.style.transform = `translate(${x}px, ${y}px) scale(${size / 700})`;
      membrane.style.opacity = "1";
      const rings = membrane.querySelector<SVGElement>(`.${s.engineOrbit}`);
      if (rings) rings.style.transform = `rotate(${first * 28 + second * 45}deg)`;
    };
    const schedule = () => { if (active && !frame && !document.hidden) frame = requestAnimationFrame(paint); };
    const observer = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) schedule(); else { cancelAnimationFrame(frame); frame = 0; } });
    observer.observe(root); paint();
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, [quiet]);
  return ref;
}

export function useTextReveals(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.revealed = "true"; observer.unobserve(entry.target); }
    }), { threshold: .15 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [ref]);
}

// Fine pointers only; update the visual directly, with no inherited frame vars.
export function useTactile<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const shared = window.matchMedia("(min-width: 761px) and (min-height: 651px)").matches
      ? element.closest(`.${s.opening}`)?.querySelector<HTMLElement>(`.${s.openingEngine} .${s.engine}`) : null;
    const target = shared ?? element.querySelector<HTMLElement>(`.${s.engine}, .${s.radar}`);
    if (!target) return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0, x = 0, y = 0;
    let bounds: DOMRect | null = null;
    const paint = () => { frame = 0; target.style.translate = `${x * 4}px ${y * 4}px`; };
    const enter = () => { if (media.matches) bounds = element.getBoundingClientRect(); };
    const move = (event: PointerEvent) => {
      if (!media.matches || !bounds) return;
      x = clamp((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      y = clamp((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => { bounds = null; x = y = 0; cancelAnimationFrame(frame); paint(); };
    element.addEventListener("pointerenter", enter); element.addEventListener("pointermove", move); element.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", leave, { passive: true }); media.addEventListener("change", leave);
    return () => {
      cancelAnimationFrame(frame); element.removeEventListener("pointerenter", enter); element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", leave); media.removeEventListener("change", leave);
    };
  }, []);
  return ref;
}
