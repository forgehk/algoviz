// algoviz — 3D sorting visualizer in vanilla Three.js.
// No build step. Open index.html directly or `python3 -m http.server`.

(() => {
  // ---------- algorithms as event-generators ----------
  // Each algo yields events of shape { type, indices, label? }.
  // The scene listens for: compare, swap, set, mark.

  function* bubbleSort(a) {
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        yield { type: 'compare', indices: [j, j + 1], line: 2 };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          yield { type: 'swap', indices: [j, j + 1], line: 3 };
        }
      }
      yield { type: 'mark', indices: [a.length - i - 1], color: 0x6ade7c, line: 5 };
    }
  }

  function* insertionSort(a) {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      yield { type: 'compare', indices: [j, j - 1], line: 1 };
      while (j > 0 && a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        yield { type: 'swap', indices: [j - 1, j], line: 2 };
        j--;
        if (j > 0) yield { type: 'compare', indices: [j, j - 1], line: 1 };
      }
    }
    for (let i = 0; i < a.length; i++) yield { type: 'mark', indices: [i], color: 0x6ade7c };
  }

  function* quickSort(a, lo = 0, hi = a.length - 1) {
    if (lo >= hi) {
      if (lo === hi) yield { type: 'mark', indices: [lo], color: 0x6ade7c };
      return;
    }
    const pivot = a[hi];
    yield { type: 'set', indices: [hi], color: 0xffd56a, line: 1 };
    let p = lo;
    for (let i = lo; i < hi; i++) {
      yield { type: 'compare', indices: [i, hi], line: 3 };
      if (a[i] < pivot) {
        if (i !== p) {
          [a[i], a[p]] = [a[p], a[i]];
          yield { type: 'swap', indices: [i, p], line: 4 };
        }
        p++;
      }
    }
    [a[p], a[hi]] = [a[hi], a[p]];
    yield { type: 'swap', indices: [p, hi], line: 5 };
    yield { type: 'mark', indices: [p], color: 0x6ade7c };
    yield* quickSort(a, lo, p - 1);
    yield* quickSort(a, p + 1, hi);
  }

  function* mergeSort(a, lo = 0, hi = a.length - 1) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    yield* mergeSort(a, lo, mid);
    yield* mergeSort(a, mid + 1, hi);
    const buffer = [];
    let i = lo, j = mid + 1;
    while (i <= mid && j <= hi) {
      yield { type: 'compare', indices: [i, j], line: 3 };
      if (a[i] <= a[j]) { buffer.push(a[i++]); } else { buffer.push(a[j++]); }
    }
    while (i <= mid) buffer.push(a[i++]);
    while (j <= hi)  buffer.push(a[j++]);
    for (let k = 0; k < buffer.length; k++) {
      a[lo + k] = buffer[k];
      yield { type: 'set', indices: [lo + k], value: buffer[k], color: 0x7cc4ff, line: 6 };
    }
    if (lo === 0 && hi === a.length - 1) {
      for (let k = 0; k < a.length; k++) yield { type: 'mark', indices: [k], color: 0x6ade7c };
    }
  }

  function* heapSort(a) {
    const n = a.length;
    const siftDown = function*(start, end) {
      let root = start;
      while (2 * root + 1 <= end) {
        let child = 2 * root + 1;
        if (child + 1 <= end) {
          yield { type: 'compare', indices: [child, child + 1] };
          if (a[child] < a[child + 1]) child++;
        }
        yield { type: 'compare', indices: [root, child] };
        if (a[root] < a[child]) {
          [a[root], a[child]] = [a[child], a[root]];
          yield { type: 'swap', indices: [root, child] };
          root = child;
        } else return;
      }
    };
    for (let start = Math.floor((n - 2) / 2); start >= 0; start--) yield* siftDown(start, n - 1);
    for (let end = n - 1; end > 0; end--) {
      [a[0], a[end]] = [a[end], a[0]];
      yield { type: 'swap', indices: [0, end] };
      yield { type: 'mark', indices: [end], color: 0x6ade7c };
      yield* siftDown(0, end - 1);
    }
    yield { type: 'mark', indices: [0], color: 0x6ade7c };
  }

  const ALGOS = {
    1: { name: 'bubble sort',    fn: bubbleSort,
         pseudo: ['for i in 0..n:', '  for j in 0..n-i-1:', '    if a[j] > a[j+1]:', '      swap(a[j], a[j+1])',
                  '  // a[n-i-1] is now in final position'] },
    2: { name: 'insertion sort', fn: insertionSort,
         pseudo: ['while j > 0 and a[j-1] > a[j]:', '  swap(a[j-1], a[j])', '  j--'] },
    3: { name: 'quick sort',     fn: quickSort,
         pseudo: ['pivot = a[hi]', 'p = lo', 'for i in lo..hi-1:',
                  '  if a[i] < pivot: swap to a[p++]', 'swap(a[p], a[hi])',
                  'recurse(lo..p-1); recurse(p+1..hi)'] },
    4: { name: 'merge sort',     fn: mergeSort,
         pseudo: ['mergeSort(lo, mid)', 'mergeSort(mid+1, hi)',
                  'merge:', '  if a[i] <= a[j]: take left', '  else: take right',
                  '  copy buffer back'] },
    5: { name: 'heap sort',      fn: heapSort,
         pseudo: ['build max-heap', 'for end in n-1..1:', '  swap(a[0], a[end])', '  siftDown(0, end-1)'] },
  };

  // ---------- scene ----------
  const container = document.getElementById('scene');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0d11, 30, 80);

  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 18, 32);
  camera.lookAt(0, 4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setClearColor(0x0b0d11);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(10, 20, 12); scene.add(dir);

  const baseColor = new THREE.Color(0x5d8aa8);
  const compareColor = new THREE.Color(0xff7a6b);
  const swapColor = new THREE.Color(0xffd56a);

  let bars = [];
  let arr = [];
  let SIZE = 64;

  function reshuffle() {
    arr = [];
    for (let i = 1; i <= SIZE; i++) arr.push(i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    rebuild();
  }

  function rebuild() {
    bars.forEach(b => scene.remove(b));
    bars = [];
    const spacing = 28 / SIZE;
    const baseW = spacing * 0.85;
    for (let i = 0; i < SIZE; i++) {
      const h = arr[i] * (16 / SIZE);
      const geom = new THREE.BoxGeometry(baseW, h, baseW);
      const mat = new THREE.MeshStandardMaterial({ color: baseColor });
      const m = new THREE.Mesh(geom, mat);
      m.position.set((i - SIZE / 2 + 0.5) * spacing, h / 2, 0);
      m.userData = { value: arr[i] };
      scene.add(m); bars.push(m);
    }
  }

  function setBarValue(idx, value) {
    arr[idx] = value;
    const h = value * (16 / SIZE);
    bars[idx].geometry.dispose();
    bars[idx].geometry = new THREE.BoxGeometry(bars[idx].geometry.parameters?.width || (28/SIZE)*0.85, h, (28/SIZE)*0.85);
    bars[idx].position.y = h / 2;
    bars[idx].userData.value = value;
  }

  function swapBars(i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setBarValue(i, arr[i]); setBarValue(j, arr[j]);
  }

  function flashColor(indices, color) {
    indices.forEach(i => bars[i] && bars[i].material.color.set(color));
  }
  function resetColors() { bars.forEach(b => b.material.color.copy(baseColor)); }

  // ---------- main loop ----------
  let currentAlgo = 1;
  let gen = null;
  let running = false;
  let compares = 0, swaps = 0;
  const stepsPerFrame = 2;

  function newRun() {
    compares = 0; swaps = 0;
    reshuffle();
    gen = ALGOS[currentAlgo].fn([...arr]);  // pass a fresh copy
    document.getElementById('algo-name').textContent = ALGOS[currentAlgo].name;
    renderPseudo();
    updateHUD();
  }

  function renderPseudo(activeLine = -1) {
    const lines = ALGOS[currentAlgo].pseudo;
    const el = document.getElementById('pseudo');
    el.innerHTML = lines.map((l, i) => {
      const cls = i === activeLine ? 'active' : 'dim';
      return `<span class="${cls}">${l.replace(/</g,'&lt;')}</span>`;
    }).join('\n');
  }

  function updateHUD() {
    document.getElementById('stats').textContent =
      `compares: ${compares} · swaps: ${swaps}`;
  }

  function step() {
    if (!gen) return false;
    const { value, done } = gen.next();
    if (done) { resetColors(); return false; }
    const e = value;
    if (e.type === 'compare') { compares++; flashColor(e.indices, compareColor); }
    else if (e.type === 'swap') { swaps++; swapBars(...e.indices); flashColor(e.indices, swapColor); }
    else if (e.type === 'set' && e.value !== undefined) { setBarValue(e.indices[0], e.value); flashColor(e.indices, swapColor); }
    else if (e.type === 'mark') { e.indices.forEach(i => bars[i] && bars[i].material.color.set(e.color)); }
    if (typeof e.line === 'number') renderPseudo(e.line);
    updateHUD();
    return true;
  }

  // ---------- camera drag ----------
  let dragging = false; let lastX = 0; let theta = 0;
  renderer.domElement.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    theta += (e.clientX - lastX) * 0.005;
    lastX = e.clientX;
  });

  // ---------- input ----------
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); running = !running; }
    else if (e.code === 'ArrowRight') { step(); }
    else if (e.code === 'KeyR') { newRun(); running = false; }
    else if (e.code === 'Equal' || e.code === 'NumpadAdd')   { SIZE = Math.min(256, SIZE * 2); newRun(); }
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { SIZE = Math.max(16, SIZE / 2);    newRun(); }
    else if (/^Digit[1-5]$/.test(e.code)) {
      currentAlgo = +e.code.slice(5);
      newRun();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  newRun();

  function loop() {
    requestAnimationFrame(loop);
    if (running) for (let s = 0; s < stepsPerFrame; s++) { if (!step()) { running = false; break; } }
    // gentle reset of compare/swap flash so the field doesn't stay coloured
    bars.forEach(b => {
      if (b.material.color.equals(compareColor) || b.material.color.equals(swapColor)) {
        b.material.color.lerp(baseColor, 0.06);
      }
    });
    // orbit
    camera.position.x = Math.sin(theta) * 32;
    camera.position.z = Math.cos(theta) * 32;
    camera.lookAt(0, 4, 0);
    renderer.render(scene, camera);
  }
  loop();
})();
