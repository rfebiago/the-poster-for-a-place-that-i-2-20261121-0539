# REBUILD_NOTES — AURHAVEN (the-poster-for-a-place-that-i-2-20261121-0539)

Current entry: `main.ts` → 1024×1024 PNG, 398,519 bytes, variant A (name-only).
Head `978b8c6` (fix round 2026-11-21 ~13:15 WIB, on top of `ec65352`).
Dev/local check status at build time: kit `check` needs the transcripts bundle
(parent's job); local runs verified PNG validity, size, dimensions, runtime
(~1.6 s, no network, Node stdlib only, byte-identical across two runs).

## Fix round applied (REVIEW.md weaknesses #1–#4, #6 — all addressed)
- Landmark ×1.3: tower 136→177 px tall, base half-width 40→52; rock widened
  273→354 px; cottage enlarged with 14×22 px windows (was 10×16); lamp
  raised to y~362; aurora re-routed to the new lamp point. Name untouched.
- Lower sea: 3 soft teal bands (alpha 0.04–0.05) at y≈718/812/908; dark rock
  reflection under the horizon (squashed 0.5×, fading); 26 spray dots at the
  waterline; gold reflection column widened 52→64 px at the horizon.
- Aurora: tip tapered 24→~8 px; second fainter strand diverging downward
  from mid-ribbon; core alpha now breathes along the length + fades at the tip.
- Warmth: window glow spill onto the rock, warm spill at the tower base,
  horizon dusk glow 0.10→0.12. No second landmark, no boat, no extra copy.
- Grain 6→4: PNG 418,235 → 398,519 bytes (now under the 400 KB target).
- Visual verdict (fix agent, fresh runs): name still instantly readable at
  1024 and 512; landmark reads bigger/warmer; sea no longer a dead expanse;
  aurora tip tapered with a visible second strand.

## Variant test result
- (a) Name-only — SHIPPED. Clean, brief-safe, name unmissable.
- (b) Name + "THE LIGHT IS LIT AT DUSK" small caps — REJECTED. The line lands
  on top of the aurora ribbon (low contrast where it crosses the beam) and
  risks the brief's "no other copy" ban. No dev-rate evidence favours it.
  Keep name-only unless a rebuild moves the line somewhere it cannot collide
  (e.g. below the horizon, over the dark sea — untested, low value).

## Known weaknesses (from visual review of the render)
1. ~~Lower half is mostly empty dark sea~~ — FIXED in fix round (bands,
   rock reflection, spray, wider gold column). Still the quietest part of
   the poster by design; the bands are deliberately very faint.
2. ~~Aurora ribbon's left tip is blunt/rounded~~ — FIXED (tapered to ~8 px,
   second strand, breathing alpha). At 512 the two strands read as separate
   wisps — acceptable, aurora-like.
3. The rock is a flat black silhouette — fine as a poster shape, but it has no
   texture; spray dots added at the waterline; the horizon line is dead
   straight.
4. ~~The lighthouse is small relative to the name~~ — FIXED (tower ×1.3,
   now 177 px tall vs 140 px cap height). It still does not outshine the
   name, which is correct — the name is the strongest asset.
5. No moon / second light source; the sky's upper-left quadrant is empty
   except for sparse stars. Deliberate minimalism, but a faint distant
   glow could balance the composition — risky (clutter), test only if time.
6. ~~PNG is 418 KB (target was <400 KB)~~ — FIXED (398,519 bytes after
   grain 6→4).
7. NEW (minor, fix agent's own observation): the cottage's right window is
   half-hidden behind the tower at 512; the rock reflection reads as a
   second dark dome under the horizon — subtle, but if a rebuild touches
   the sea again, soften the reflection's top edge. Neither is worth a
   rebuild on its own before the 15:39 WIB deadline.

## Concrete rebuild ideas (in priority order)
1. ~~**Bigger lighthouse + cottage**~~ — DONE in fix round.
2. ~~**Wispy aurora tip**~~ — DONE in fix round.
3. ~~**Waterline life**~~ — DONE in fix round (spray + rock reflection).
4. ~~**Sea interest without clutter**~~ — DONE in fix round (teal bands).
5. ~~**File-size trim**~~ — DONE (398,519 bytes).
6. **Name glow, done right**: the first attempt (warm halo, alpha 0.16) read
   as a dark outline and was removed. If retried, use a WIDE (strokeW ~48),
   very low-alpha (0.08) warm pass so it reads as light, not an edge.
7. **If the dev rate is weak**: soften the rock reflection's top edge; give
   the cottage its own clear gap from the tower so both windows read at 512;
   a faint distant glow upper-left (REVIEW weakness #5) — clutter risk,
   test only with time to spare.

## Fallback rebuild concept — AERTHOLM
Stone arch bridge between two floating grass-topped islands, morning gold
light, tiny figure with walking stick mid-bridge. Palette #7FB3D5 → #F6D9A0,
#F7F3E8, #C98A4B, #4A3A2E, #3A2A1A. Most distinct concept, but harder
procedurally (bridge arch + floating islands + figure) and risks reading as
fantasy illustration rather than a travel poster. Only rebuild to this if
AURHAVEN's dev rate is clearly weak AND there is time for a full new build
+ review round. Keep the same tech (main.ts, stroke font, PNG encoder) and
the same name treatment (huge caps, rule, no other copy).

## TIDEMERE (prior builder's draft, not built)
Low-tide isle, coral-striped lighthouse on a sea-stack, stepping-stone
causeway, one sailboat, huge low sun. Rejected in favour of AURHAVEN: more
elements competing for attention (sun vs name), higher clutter risk, and the
aurora beam gives AURHAVEN a more specific, single-landmark identity.
