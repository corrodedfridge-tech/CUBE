# CUBE

A browser arcade game. Dodge the red cubes, shoot back when the meter fills, survive the
things that turn up to stop you.

**Play it:** open [`index.html`](index.html). That is the whole game in one file — no server,
no network, no install. It also installs as an app on a phone or desktop if you want it to.

---

## What is in here

```
index.html              the built game, one file, ~6 MB. This is what you play.
build.py                makes index.html out of everything below
src/
  _shell.head.html      <head>: metas, title, manifest link
  _shell.body.html      the markup — canvas, HUD, every screen
  css/                  the stylesheet, in five pieces
  js/                   the game, in 34 pieces, concatenated in manifest order
  index.html            the same game as loose files, for working on it
assets/
  knight/               the Roaring Knight's sprites and music
  lava/                 the floor-collapse texture and loop
  matthew/              Matthew's sprites, faces and audio
  ui/                   the hand-drawn menu art and the font, as drawn
  css/                  the processed versions the stylesheet actually uses
tools/
  templates/            the asset modules, with @@file@@ where each asset goes
  mkui.py               re-processes assets/ui → assets/css
dev/                    Playwright harnesses used to tune and check the game
```

## Building

```sh
python3 build.py
```

Reads `src/css/manifest.json` and `src/js/manifest.json`, inlines every asset as a data URI,
and writes `index.html`. Nothing else is needed — no npm, no bundler, no dependencies.

To work on the game instead of just playing it:

```sh
python3 build.py --dev
```

That also writes `build/gen/` and `src/index.html`, which loads the stylesheet and all 34
JS files separately. Open it straight from the file system; a stack trace will name the file
the error came from instead of pointing at line 40,000 of one giant page. When you are done,
run `build.py` again to fold it back into `index.html`.

`build/` is generated. It is in `.gitignore` and it is safe to delete.

### Adding a file

Put it in `src/js/`, add its name to `src/js/manifest.json` in the position you want it to
run. Order matters: the files are concatenated into one scope, so anything used at load time
has to be declared above the thing using it. That is the only build rule.

## How it works

Canvas 2D, no engine, no dependencies. Audio is generated in the browser with Web Audio
except for the Knight's and Matthew's music, which are real files decoded into buffers.
Matthew's explosion is 20 frames sliced out of a video into one sprite sheet at build time, so
it can be drawn anywhere, any number of times, with no decoding. Progress — shards, upgrades,
skins, settings, awards, the daily — lives in `localStorage`.

The frame loop reschedules before it does any work, so one bad frame can never freeze the
game. It honours `prefers-reduced-motion`. Touch controls appear on their own on a phone.

## The run

Cubes arrive in patterns that get faster and denser on a curve. Grazing one fills TP; TP is
the ammunition. Set pieces interrupt: a floor collapse, a laser storm, a barrage, the Roaring
Knight, the Gravity Bridge, and at five minutes, Matthew. Killing a boss offers you the pot —
take what the run has earned at the current multiplier and stop, or keep it riding and find
out. Dying still pays the pot, just without the multiplier.

Shards buy permanent upgrades and fourteen looks for the cube. The upgrades push back: every
level you own nudges enemy speed, spawn density and boss health up with it.

There are 149 awards. Hard mode exists and is not a nudge. The daily cube draws its run from
the date, so every attempt that day is the same gauntlet.

## Adding your own cube skin

Drop the picture in `assets/skins/` and add one row to the `SKINS` table near the top of the
skins section in `script.js`:

```js
['mycube', 'My Cube', 250, 'picture', 'assets/skins/mycube.png'],
```

`id`, the name on the card, the price in shards, a one-word note, and the path. Any square-ish
png or jpg works — it gets cropped to a square, rounded off and outlined to match the others.
Give it a price of `0` if you just want to wear it.
