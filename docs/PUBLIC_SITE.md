# IMMUNE public website — final refinement

## Scope

This pass uses the installed `frontend-design` and `improve-animations` skills. The user explicitly requested implementation after the audits, so the motion audit was carried through to code rather than stopping at plans.

The public homepage remains `/`; the real demo remains `/dashboard`. Verification covers desktop and phone only, following the latest instruction. No package changes or deployment.

## 1. Design audit

The baseline had a strong orbital visual, but the Geist/mono pairing, tiny system labels, repeated green second lines, repeated eyebrows, and hexagonal inner mark weakened its identity. The hero omitted a plain product description. New visitors were not told how to connect their existing agents. Learning and other sections were framed as separate bordered panels.

The revised palette uses Obsidian `#080b09`, Forest `#101c14`, Chalk `#eff1e9`, Neutral `#9fa9a2`, Emerald `#82c79a`, and Amber `#d3ba88`. Large, left-aligned editorial type introduces each idea; centered geometry explains action flow. The memorable object remains the membrane. On review, extra accent headlines and decorative metadata were removed so the palette supports actual product states.

## 2. Motion audit and fixes

| Priority | Baseline location | Evidence | Change |
| --- | --- | --- | --- |
| High | `motion.ts`, `useFilm` | Each scroll event measured layout; frame variables were inherited across the entire scene | Scroll events schedule a frame; layout reads precede writes; transforms and opacity update animated elements directly |
| Medium | `motion.ts`, manual selection | Scrolling cleared manual choices and snapped back to the scroll position | Manual progress is retained as an offset when scrolling resumes |
| Medium | `site.tsx`, `Industries` | Keyed content restarted its entry animation on every selection, including arrow keys | Persistent layers use short transitions; keyboard selection is immediate |
| Medium | `site.css`, learning readouts | Adjacent phrases crossfaded at the same position | The outgoing phrase clears before the incoming phrase becomes visible |
| Medium | `site.tsx`, `FireDrill` | A repeated signal pulse and rotating line did not explain the result | Each stage moves or stops the signal; a visible protection boundary forms before retesting |
| Low | Public interaction styles | Inconsistent durations and limited press feedback | Shared easing/duration tokens; 140ms press feedback and 220ms UI transitions |
| Low | Intro and section headings | Similar fade-up treatment and disconnected scene geometry | Arc construction, masked hero lines with 60ms stagger, restrained focus reveals, one shared opening membrane |

The strongest additive opportunities were the same logo becoming the hero, a visible connection explanation, and a safeguard boundary appearing during Fire Drill. These are implemented. No bounce, custom cursor, perpetual animation, or heavy motion library was added.

## 3. Logo

Removed the hexagon and satellite dots. The SVG uses a protected central node, three outer incomplete arcs, and one inner arc, with consistent strokes and deliberate rotational gaps. The header, scene cores, footer, and favicon share the geometry. The uppercase wordmark has tighter proportions and refined tracking.

## 4. Opening animation

A 2.4-second first-session sequence draws arcs, forms the node, aligns the membrane, sends one pulse around it, and resolves the wordmark through opacity, a small blur, tracking, and scale. The actual opening engine moves from the viewport center into the hero while its orbital geometry expands. It is not a separate logo that gets replaced. Reloads in the same tab skip construction; scrolling, resizing, and reduced motion finish it immediately.

## 5. Fonts

- **Space Grotesk**: headlines, body, navigation, and wordmark. Its geometric proportions give the large statements more character.
- **IBM Plex Sans Condensed**: decisions, agent labels, and system states. The condensed sans is readable at larger sizes without a terminal-style appearance.

Both are free SIL Open Font License fonts: [Space Grotesk license](https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt), [IBM Plex Sans Condensed license](https://github.com/google/fonts/blob/main/ofl/ibmplexsanscondensed/OFL.txt). License copies are included in `public/font-licenses/`. Next's existing font system self-hosts them. Their variables are scoped to the public page; the dashboard font setup is unchanged.

## 6. Copy

The hero now explains where IMMUNE sits and what ALLOW, REVIEW, and BLOCK mean. Control explains that the agent proposes and IMMUNE decides. Learning uses one stable sentence about turning an incident into protection for other agents. Fire Drill explains attack, weakness, safeguard, and retest. Plan descriptions are shorter. Brand language remains “AI mistakes are inevitable. Repeating them isn't.”

## 7. Sections

Eight sections: Hero → How IMMUNE works → Control → Learning → Fire Drill → Use cases → Pricing → Final CTA. The new explanation is short; Control and Learning scroll lengths were reduced from 175/250svh to 150/205svh. Capabilities remain expandable under Use cases. No new card wall or redundant standalone section.

## 8. Interactions

Three connection steps change the visible flow. ALLOW passes, REVIEW pauses, and BLOCK dissolves the action signal. Learning retains four visible controls: ACTION, FAILURE, LEARN, PROTECT. Industry selection supports click/tap and arrow/Home/End keys. Pricing and the existing enterprise enquiry dialog remain functional. Fine-pointer response is limited to four pixels.

## 9. Scroll continuity

Desktop uses one real SVG membrane positioned between three anchors: Hero, How It Works, and Control. Its scale, position, and orbit change as the visitor scrolls. A restrained signal line leads toward Learning; circular geometry returns there and in the final CTA. Section borders were reduced. Mobile uses inline geometry and normal vertical flow.

## 10. Fire Drill

The bounded sequence is SCENARIO INJECTED → AGENT RESPONSE → IMMUNE SCAN → RISK FOUND → SAFEGUARD GENERATED → RETESTING → PROTECTED. The incoming signal, risk target, new boundary, status, progress, and replay control live in the same visual. Timers pause offscreen and in hidden tabs. Refund and Records remain selectable simulations. No backend records are created by this public illustration.

## 11. How It Works

“It’s simple” shows how to connect existing agents and place IMMUNE between them and real systems. The three selectable steps cover connection, important action checks, and learning from incidents. Labels change from Agents → IMMUNE → Systems to Incident → Safeguard → Protected agents.

## 12. Use cases

Six industries remain. Financial services now explains why a $14,200 refund requires REVIEW. Airlines shows “Change passenger identity” with BLOCK and a verification reason. Each industry occupies the same large scenario panel. Persistent layers prevent restart flicker; keyboard changes skip animation.

## 13. Files changed in this pass

- `app/page.tsx` — public font imports and scope.
- `components/marketing/brand.tsx` — membrane SVG and central node.
- `components/marketing/content.ts` — scenario and plan copy.
- `components/marketing/site.tsx` — How It Works, shared opening scene, revised copy and interaction markup.
- `components/marketing/motion.ts` — frame scheduling, direct element updates, retained selections, shared membrane positioning, and text reveals.
- `components/marketing/site.css` — type, layout, intro, transitions, scene feedback, phone adjustments, and reduced motion.
- `components/marketing/styles.ts` — explicit class-name map for the existing CSS loader.
- `public/immune-symbol.svg` — matching favicon geometry.
- `public/font-licenses/space-grotesk.txt` and `ibm-plex-sans-condensed.txt` — font licenses.
- `docs/PUBLIC_SITE.md` — this report.

The temporary responsive test page was removed. Next's automatically appended instruction block was restored to its pre-task state. Existing uncommitted work was preserved.

## 14. Dependencies

None added. Package manifest and lockfile are unchanged. This remains React, SVG, CSS, IntersectionObserver, and requestAnimationFrame.

## 15. Phone behavior

At 390px, measured document width equals viewport width: no horizontal overflow. The hero links fit together, connection steps stack, Control is vertical, learning stages respond to taps, and pricing becomes one column. Desktop sticky scenes and the shared traveling membrane are replaced by simpler inline visuals. Phone testing used a real 390×844 same-origin iframe viewport because the browser's resize control did not apply its requested dimensions. Tablet testing was removed from scope at the user's request.

## 16. Reduced motion

The preference skips construction, pointer movement, traveling geometry, and sticky scenes. Control and Learning show their selected outcome immediately. Industry and Fire Drill status changes retain brief opacity feedback; moving radar/signal effects are hidden. This behavior was reviewed in source; OS preference emulation was not available in the browser tooling.

## 17. Performance

Scroll listeners schedule work instead of measuring on every event. Reads are batched before writes, selectors are cached for action scenes, and frame updates write directly to the animated elements rather than inherited CSS variables. React updates only when the semantic scene changes. Offscreen and hidden-tab work is paused. No WebGL, canvas, extra animation package, or continuous idle loop. Performance changes were inspected and exercised; no frame-rate benchmark is claimed.

## Verification

- TypeScript, lint, and production build: passed.
- Desktop at 1280×720: hero, connection steps, Control decisions, learning selection, Fire Drill completion, industry click/keyboard selection, annual prices, and enterprise dialog checked.
- Phone at 390×844: hero, connection explanation, vertical Control, REVIEW outcome, and PROTECT/Agent B learning state checked; no horizontal overflow.
- Browser console during desktop checks: no captured errors or warnings.
- Seventeen protected files were compared with pre-edit SHA-256 fingerprints: unchanged. This covers dashboard code, all API routes, evaluator/storage/shared code, root fonts/styles, environment file, and dependency files.
- Real production dashboard flow passed on an isolated local server: Agent A ALLOW → incident saved → Gemini safeguard saved → Agent B BLOCK.
- Saved incident: `inc_d1bae1ae-8a5a-4fc7-9604-67b56b54c853`.
- Gemini's safeguard: “Prevent Unauthorized Refund Destination Changes”, `change_refund_destination`, BLOCK, HIGH, linked to that exact incident.
- Agent B matched `sg_learned_inc_d1bae1ae-8a5a-4fc7-9604-67b56b54c853`.
- Test production server and temporary responsive server were stopped after verification. No deployment or payment integration.

## Local retest

1. Run `npm run dev` in the IMMUNE repo and open `http://localhost:3000`.
2. Open a fresh browser tab for the intro; reload to confirm it skips in that tab.
3. Scroll through the connection, Control, and Learning scenes. Try each control.
4. Run and replay Fire Drill; switch industries with mouse/tap and arrow keys; check pricing.
5. Check a phone-width window and your device's reduced-motion setting.
6. Open `/dashboard`: Check Agent A → Report as incident → Learn safeguard → Test Agent B.

The backend uses in-memory demo state. A fresh server process is needed to repeat the initial ALLOW if an existing safeguard already matches; the dashboard's Reset demo button does not clear backend safeguards.

In this environment, the default development watcher failed to start. `WATCHPACK_POLLING=true npm run dev -- --webpack --hostname 127.0.0.1` provided a working preview without changing project configuration. The normal Turbopack production build passed.
