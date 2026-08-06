<p align="center">
  <img src="public/icon.svg" alt="Kartela" width="140" />
</p>

<h1 align="center">Kartela</h1>

<p align="center">
  Two movie posters, one question: which one do you keep? 🎬
</p>

<p align="center">
  <a href="https://endika.github.io/kartela/"><b>▶&nbsp; Play Kartela</b></a>
</p>

---

## How to play

Two posters show up. Swipe towards the one you like more — it stays on screen and takes on
the next challenger. Keep going until the deck runs out, and the last poster standing is
your champion. At the end you get the full list of everything you picked along the way.

## Features

- **Pick your studios** — Disney classics, Pixar, DreamWorks, Disney live-action, each one
  a toggle. Sequels have their own switch.
- **Pick your length** — a short 12-poster run, a 24 one, or the whole catalogue.
- **Fully offline & installable** — a PWA that keeps working with no connection after the
  first load, posters included.
- **No accounts, no backend, no ads** — nothing leaves your device.

## Tech

Vanilla TypeScript + [Vite](https://vite.dev), Tailwind for the UI, Vitest for the tests.
The catalogue is generated at build time from Wikipedia and committed to the repo.

```bash
npm install
npm run dev
```

## Credits

Movie posters are the property of their respective studios and are used here as
low-resolution thumbnails. See [NOTICE](NOTICE).
