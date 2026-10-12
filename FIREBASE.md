# Turning the cloud on

Six things in the Firebase console, once. The game already has the code; until you do these
it just runs offline and hides the leaderboard button.

Project: **cube-7fecc**

---

## 1. Authentication

**Build → Authentication → Get started.**

Enable two providers:

- **Anonymous** — so anyone can play straight away without a sign-up wall. They show on the
  boards as a guest until they sign in.
- **Google** — pick your support email when it asks. This is what gives people a real name,
  and it is how the game knows you are you.

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

## 6. Publish the game

Push the files and open the page. If it worked you get **Leaderboard** on the menu, and
signing in with `corrodedfridge@gmail.com` adds **Admin** next to it.

---

## What the admin panel does

**Players** — everyone who has ever opened the game, newest first, searchable by name, email
or uid. Open one and you can:

- set their shards to a figure, or add/subtract an amount
- set any upgrade to any level, or max all eight
- give one award, or all 152
- give one skin, or all 15
- set their rebirth count
- unlock absolutely everything (and 250,000 shards with it)
- wipe their save back to a brand-new game
- ban them, which stops their scores reaching the boards

**Boards** — every entry on any of the nine boards, with a Delete on each and a wipe for the
whole board. This is how you deal with a fake score.

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
rows, and the leaderboard caches for two minutes, so opening the menu and flicking between
tabs costs nothing. You will not get close.
