# CUBE

A browser arcade game. Dodge the red cubes, shoot back when the meter fills, survive the
things that turn up to stop you.

**Play it:** open `index.html`. No server, no install, no network. It also installs as an
app on a phone or a desktop if you want it to.

Current version: **4.3**.

---

## What is in here

```
index.html              the page
style.css               the whole stylesheet
script.js               the whole game
assets/                 every picture, sound and font the game uses
  knight/               the Roaring Knight's sprites and music
  lava/                 the floor-collapse texture and loop
  matthew/              Matthew's sprites, faces and audio
  skins/                the pictures a cube can wear
  ui/                   the menu art and the font
sw.js                   the service worker, so it works offline
manifest.webmanifest    so it installs as an app
icon-*.png              the app icons
firestore.rules         who may read and write what, once the cloud is on
firestore.indexes.json  the two indexes the leaderboards need
FIREBASE.md             how to turn the cloud on
```

That is the whole repository. Drop it at the root of a GitHub repo, turn on Pages, and it
serves itself.

### Where the three files come from

`script.js` and `style.css` are big because the game is big, not because anything is
generated — they are hand-written, and you can edit them directly. They are also kept in
pieces in a working tree (`src/js/`, 39 modules, and `src/css/`, 6 stylesheets) that
`tools/flatten.py` folds back into the three files, with a banner comment marking where each
piece starts. Either way of working is fine; just do not do both at once.

```sh
python3 build.py            # index.html that loads src/ as separate files, for debugging
python3 tools/flatten.py    # dist/flat/ -- the three files, ready to publish
python3 build.py --bundle   # dist/cube.html -- one file, everything inlined, for a USB stick
```

`dev/smoke.py` loads the built game in a headless browser, forces every set piece in turn and
reports anything the console complains about.

## How it works

Canvas 2D. No engine, no framework, no dependencies. Audio is generated in the browser with
Web Audio, except for the Knight's and Matthew's music, which are real files. Matthew's
explosion is twenty frames sliced out of a video into one sprite sheet, so it can be drawn
anywhere, any number of times, with no decoding. Progress — shards, upgrades, skins,
settings, awards, the daily — lives in `localStorage`.

The frame loop reschedules before it does any work, so one bad frame can never freeze the
game. It honours `prefers-reduced-motion`. Touch controls appear on their own on a phone.

## The run

Cubes arrive in patterns that get faster and denser on a curve. Grazing one fills TP; TP is
the ammunition. Set pieces interrupt: a floor collapse, a laser storm, a barrage, spikes out
of the walls, the Roaring Knight, the Gravity Bridge, and at five minutes, Matthew.

Killing a boss offers you the pot — take what the run has earned at the current multiplier
and stop, or keep it riding and find out. Dying still pays the pot, just without the
multiplier.

## Getting stronger

Shards buy eight permanent upgrades and fifteen looks for the cube.

| | what it does |
|---|---|
| **SPEED** | about 8% on your top speed per level |
| **DAMAGE** | every shot lands harder, from the first cube to the last boss |
| **PLATING** | start each run with another shield fitted |
| **CHARGE** | grazing fills TP faster |
| **KINETICS** | the dash comes back sooner and carries you further |
| **EFFICIENCY** | every shot costs less TP, down to a floor |
| **NERVE** | a wider graze ring — you fill TP from further out |
| **ESCORT** | start every run with a shard already circling you |

Fully kitted that is half again as fast, six times the damage, ten shields, a shot that costs
a third of what it used to and three orbiting shards before the first cube arrives.

The arena reads all of it, live — not just what you bought, but the upgrade cards you have
picked up this run and the shields still in your hand — and pushes back by the same amount.
You are not grinding past the game. You are growing into it.

Max all eight out and the shop offers a **rebirth**: hand back every level and every shard
for a level of headroom on all eight, a permanent raise on every payout, and an arena that
answers in kind. There is no last one.

## Difficulty

Three tiers, in Settings.

- **Normal.**
- **Hard** halves your shields, starts the curve at threat 3, gives you a third less warning
  and pays 75% more.
- **Nightmare** is not meant to be fair: two shields ever, the curve starts two thirds of the
  way up, cubes arrive three times as often, the warning is barely a warning and the gun
  barely charges. What it has instead is **a shard every second you stay alive**, compounding
  on top of everything else — four minutes is 240 shards on its own.

Settings also has switches for spawn warnings, blurring the photographs, and turning the
photo-based attacks off entirely (spikes stand in for them).

There are **152 awards**. The daily cube draws its run from the date, so every attempt that
day is the same gauntlet for everybody.

## Accounts, leaderboards, admin

Optional, and entirely additive — see [FIREBASE.md](FIREBASE.md) to switch it on.

Nine boards: **max score**, **longest run** and **rebirths**, each for **this week**, **this
month** and **all time**. One row per player per board, so a board is a list of people
rather than a list of somebody's good afternoon. Weeks and months are counted in UTC so
everybody agrees on which week it is.

**You do not need an account to be on a board.** Opening the game makes you a guest with a
stable handle, and there is a box on the leaderboard: type a name, press Save, that is you.
Renaming rewrites the rows already up there. Google sign-in is still offered, and is worth it
for following your name and your save to another device.

`corrodedfridge@gmail.com` gets an **Admin** screen: every player who has ever opened the
game, guests included, with who is online right now; shards, awards, skins, upgrade levels
and rebirths handed out one at a time, to everyone a search is showing, or to the entire game
at once, and taken back the same way; a wipe; a ban; delete or wipe board entries; and a notice line on everybody's title
screen. A grant lands within a second on anyone with the game open, and waits for anyone who
does not. The **Everybody** parcel reaches players who have never signed in and players who
have not installed it yet. The admin check is on the signed-in token inside the security
rules, not on a hidden button.

**With no connection, or opened straight off a file, none of this exists and nothing else
changes.** Shards, shop, awards and the daily keep running out of `localStorage` exactly as
they always have. It is still a game you can play on a plane.

## Adding your own cube skin

Drop the picture in `assets/skins/` and add one row to the `SKINS` table near the top of the
skins section in `script.js`:

```js
['mycube', 'My Cube', 250, 'picture', 'assets/skins/mycube.png'],
```

`id`, the name on the card, the price in shards, a one-word note, and the path. Any square-ish
png or jpg works — it gets cropped square, rounded off and outlined to match the others. Give
it a price of `0` if you just want to wear it.
