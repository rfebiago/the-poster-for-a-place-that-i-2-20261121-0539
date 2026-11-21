# AURHAVEN — The Poster for a Place That Isn't There

A travel poster for **Aurhaven**, a place that does not exist: a single white
lighthouse on a black rock at dusk, its lamp beam sweeping left as a ribbon of
aurora over a calm sea, warm windows in the keeper's cottage, and a gold
reflection path on the water toward the viewer.

[![make.fun](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539.svg)](https://make.fun/c/the-poster-for-a-place-that-i-2-20261121-0539)

> NOTE for the submitter: the repo `rank.svg` / `reward.svg` badges from the
> kit's `how_to_submit.readme_template` must be added here once the GitHub
> repository (owner/repo) exists, before submitting.

## How it works

`main.ts` (Node 22, pure stdlib — no dependencies, no network) draws the
poster procedurally into a 1024×1024 RGB buffer and writes
`/output/entry.png` with a hand-rolled PNG encoder (zlib deflate + CRC32):

- sky/sea gradients, deterministic stars and 2×2-block grain (printed feel)
- aurora ribbon: quadratic bézier from the lamp, sine ripple, four translucent
  layers (wide teal wash, teal body, green core, bright core streak)
- lighthouse: tapered tower with smooth warm shading, slim lamp room with a
  lit amber lamp, trapezoid cap; keeper's cottage with warm windows
- gold reflection: tapered column of broken horizontal dashes on the water
- the name **AURHAVEN** in huge cream caps from a hand-drawn stroke vector
  font (custom segment letterforms, antialiased), with a thin cream rule

Run it: `node main.ts` (writes `/output/entry.png`, ~1.5 s, ~418 KB).

## License

MIT — see `LICENSE`.
