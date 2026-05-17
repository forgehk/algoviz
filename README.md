# algoviz

> 3D visualizations of sorting algorithms in the browser. Bars dance to bubble sort, merge sort, quicksort, and heapsort — narrated by the code that's actually running them.

[![Three.js](https://img.shields.io/badge/three.js-r128-000000.svg)]() [![No build step](https://img.shields.io/badge/build-none-success.svg)]() [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it does

Open `index.html` in a browser. You get a 3D scene of bars representing array values. Pick an algorithm, hit play, and watch the bars swap, compare, and settle into sorted order — with a small overlay showing the active line of pseudocode.

Algorithms shipped today:

- **Bubble sort** — classic, with adjacent-comparison highlights
- **Merge sort** — divide-and-conquer with a colour-coded merge buffer
- **Quicksort** (Lomuto partition) — pivot chosen, partition walk shown
- **Heapsort** — heapify phase + sortdown phase, both visible
- **Insertion sort** — best case for nearly-sorted arrays

Controls:

- `Space` — play / pause
- `→` — step one operation
- `R` — reshuffle
- `1`–`5` — pick algorithm
- `+` / `-` — adjust array size (32, 64, 128, 256)
- mouse drag — rotate the scene

---

## Why this exists

Sort algorithms make perfect sense on paper and slip away the moment you stop thinking about them. A live visualization keeps the intuition alive: you *see* why merge sort is O(n log n) — the recursion tree is right there — and why quicksort is so fast in practice — the partition walk takes one pass per level.

It's also a visual project that screenshots well, which makes it a recruiter-eye-magnet on a portfolio.

---

## Stack

- **Plain HTML + JS**, no build step. Open the file, it runs.
- **Three.js r128** loaded from CDN.
- **dat.GUI** for the control panel.
- Each algorithm is a small generator function that `yield`s `{type, indices}` events the scene reads to animate.

The whole thing is under 500 LOC.

---

## Run

```bash
# clone
git clone https://github.com/forgehk/algoviz
cd algoviz

# serve (or just open index.html)
python3 -m http.server 8000
open http://localhost:8000
```

GitHub Pages deployment works zero-config — the repo's `main` branch is the deployable site.

---

## How a new algorithm plugs in

Each algorithm is a generator yielding events. The scene listens for `compare`, `swap`, `set`, and `mark` and animates accordingly:

```js
function* bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { type: 'swap', indices: [j, j + 1] };
      }
    }
    yield { type: 'mark', indices: [arr.length - i - 1], color: 'sorted' };
  }
}
```

Add a new file, register it in `ALGOS`, you're done.

---

## Roadmap

- [x] 3D bar scene + animation loop
- [x] Bubble / merge / quick / heap / insertion sorts
- [x] Pseudocode overlay synced to active line
- [x] Step / play / reshuffle controls
- [ ] BFS / DFS / Dijkstra over a 3D graph
- [ ] A* over a maze
- [ ] Pathfinding races (multiple algorithms running side by side)
- [ ] Audio: each comparison plays a note proportional to the value (sortophone)

---

## License

[MIT](LICENSE)

---

*Built by [@forgehk](https://github.com/forgehk) — [DarkForge AI](https://darkforgeai.com)*
