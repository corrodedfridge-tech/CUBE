# Turning the cloud on

Six things in the Firebase console, once. The game already has the code; until you do these
it just runs offline and hides the leaderboard button.

Project: **cube-7fecc**

---

## 1. Authentication

**Build → Authentication → Get started.**

Enable two providers:

- **Anonymous** — this is the important one. It is what lets somebody type a name into the
  leaderboard and be on the boards with no account at all.
- **Google** — pick your support email when it asks. Optional for players; it is how a name
  and a save follow somebody between devices. It is **not** optional for you: it is how the
  game knows you are the admin.

## 2. Authorized domains

**Authentication → Settings → Authorized domains → Add domain.**

Add wherever the game is served from:

```
corrodedfridge-tech.github.io
```

`localhost` is already on the list. Sign-in fails with `auth/unauthorized-domain` until the
domain is on it — that is the single most common thing to forget.

## 3. Firestore

**Build → Firestore Database → Create database.**

Start in **production mode** (the rules below replace whatever it starts with), region
`nam5 (us-central)`.

## 4. The rules

**Firestore Database → Rules.** Delete what's there, paste the whole of
[`firestore.rules`](firestore.rules), press **Publish**.

This is the part that matters. The config in `index.html` is public and always will be — it
names the project, it does not unlock it. These rules are the lock. They say:

- anyone signed in can read the boards
- you can write exactly one row per board per window, for yourself, only upward, and only
  with a number inside believable limits
- you can write your own profile but not the two fields that would let you cheat
- `corrodedfridge@gmail.com` can do anything

Your admin rights come from the email on your Google token. Nothing to set up, nothing to
paste, no key anywhere. Sign in with that address and the Admin button is there.

## 5. The index

The boards sort by value inside a board and a window, which needs one composite index.

Easiest way: open the leaderboard once after everything else is done. It will fail, and the
browser console will print a long `https://console.firebase.google.com/...` link that
creates exactly the right index. Click it, press Create, wait about a minute.

Or do it up front — **Firestore → Indexes → Add index**:

| Collection | Fields | Scope |
|---|---|---|
| `scores` | `kind` ↑, `period` ↑, `v` ↓ | Collection |
| `users` | `seen` ↓ | Collection |

(Both are in [`firestore.indexes.json`](firestore.indexes.json) if you ever use the CLI.)

## If it doesn't work

Open the leaderboard and **press Q**. The game runs the whole chain in order — SDK loaded,
signed in, profile saved, board read — and tells you which link broke and which button to go
and press. It opens by itself the first time a board fails.

The two that catch everyone:

- **"Nobody is signed in"** → step 1 was skipped. Authentication → Sign-in method → turn on
  **Anonymous**. Nothing works until that is on, not even for you.
- **"The board has no index yet"** → step 5. The panel prints the exact link; open it, press
  Create, wait a minute, press **R**.

## 6. Publish the game

Push the files and open the page. If it worked you get **Leaderboard** on the menu, and
signing in with `corrodedfridge@gmail.com` adds **Admin** next to it.

---

## Getting on the boards

Opening the game signs you in silently as a guest and gives you a handle like `Guest-ZON69`,
the same one every time. On the leaderboard there is a box: type a name, press Save, and that
is you. No account, no password, no email, nothing for a nine-year-old to get stuck on.
Renaming rewrites the rows already up there, so a board never shows a name somebody stopped
using.

**Sign in with Google** stays next to it, and it is worth it for one thing: a guest is tied
to that browser on that device, and clearing site data loses them. A Google account follows
you to a phone, and keeps the shards a guest had already banked when you link it.

## What the admin panel does

**Players** — everyone who has ever opened the game, guests included, newest first, with
**ONLINE** next to anybody playing in the last five minutes and how long ago the rest were.
Searchable by name, email or uid. Open one and you can:

- set their shards to a figure, or add/subtract an amount
- set any upgrade to any level, or max all eight
- give one award, or all 152
- give one skin, or all 15
- set their rebirth count
- unlock absolutely everything (and 250,000 shards with it)

and under **Take it away**, undo any of it one piece at a time:

- lock every award back, or just one
- take every skin back, or just one
- remove every rebirth, or knock one off
- strip the upgrades back to level one
- reset their best score, take every shard, clear their counters

and finally:

- wipe their save back to a brand-new game
- ban them, which stops their scores reaching the boards

Above the list there is **Give to these N**, which hands out shards to everyone the search is
currently showing — so you can filter to a word and pay out the lot in one go.

**Boards** — every entry on any of the nine boards, with a Delete on each and a wipe for the
whole board. This is how you deal with a fake score.

**Everybody** — one parcel aimed at the entire game: shards each, every award, every skin, or
unlock the lot. This is the one that reaches people the Players tab cannot, because it does
not need them to have an account row:

- guests who have never signed in with Google
- anybody offline right now — it is waiting for them when they come back
- anybody who installs the game for the first time next month

Each player applies it once and never again, so it is safe to leave sitting there. **Stop the
current one** prevents it reaching anyone new; it does not take it back from anyone who has
already had it.

**Notice** — a line of text that appears under the logo on everyone's title screen until you
take it down.

### How a grant reaches somebody

Their save lives in their browser, not in your database, so nothing here edits it directly.
An admin action leaves a small parcel on their account; their game picks it up the next time
they open it and applies it then, with a banner saying what arrived. Each parcel has an id
and is applied once, so a reload never doubles anything, and sending the same thing twice
genuinely sends it twice.

That is also why a grant works for somebody who is offline right now — it is waiting for
them.

---

## What this does not do

A player's score is computed in their own browser, so somebody determined can type a number
into the console and submit it. The rules reject the impossible (over 2,000,000 points, over
24 hours, over 500 rebirths) and every entry carries the version and difficulty it was set
on, so nonsense stands out. Past that, the Delete button in **Boards** is the answer.

Making it actually unforgeable means running the game on a server, which is a different and
much larger project. For a board you share with Mathias and his friends, catching it
afterwards is enough.

## Cost

The free Spark plan gives 50,000 reads and 20,000 writes a day. A run writes at most nine
rows, the leaderboard caches for two minutes, and the game sends one small heartbeat every
two and a half minutes — only while the tab is actually in front, so a game left open behind
something else goes quiet. Even ten people playing all day lands nowhere near the ceiling.
