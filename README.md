# CUBE

Dodge the red cubes. Open `index.html` — no server, no build, no dependencies.

```
index.html    the page: head, markup, two tags
style.css     everything visual
script.js     the whole game
assets/       the sprites and the music, as real files
```

`script.js` is one file but it is written in sections — every module starts with a banner
saying what it is (`===== 10-cubes.js`, `===== 23-knight.js`, and so on), so you can find
things by searching for the banner.

Add `?debug` to the URL to summon a boss: **B** the Roaring Knight, **F** the floor collapse,
**G** the Gravity Bridge, **X** Matthew.

Canvas 2D, no engine. Progress lives in `localStorage`. Installs as an app from the browser
menu, and works offline once it has.
