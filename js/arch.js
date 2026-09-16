/* ---------------------------------------------------------------------------
   Hero: an interactive 3D dental arch.

   Loaded lazily by main.js, and only when the device can actually do it well.
   Every bail-out path leaves the hero photo in place, so this file can fail
   completely without breaking the page.
--------------------------------------------------------------------------- */
(function () {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;                       // photo stands

  // cheap WebGL probe - some older Androids advertise the context then fail
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
  } catch (e) { return; }

  const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js";

  const load = () => new Promise((res, rej) => {
    if (window.THREE) return res();
    const s = document.createElement("script");
    s.src = THREE_SRC;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  /* ---- one tooth -------------------------------------------------------
     Lathed profile from root tip up to the crown, then squashed per tooth
     type. Anatomically loose, but at arch scale it reads correctly and it
     costs no model download.                                            */
  function toothGeometry(THREE, type) {
    const pts = [];
    const push = (x, y) => pts.push(new THREE.Vector2(x, y));

    // crowns only - exposed roots read as anatomy, not as a brand mark
    push(0.00, -0.60);
    push(0.19, -0.58);
    push(0.30, -0.47);
    push(0.36, -0.24);
    push(0.40,  0.02);
    push(0.41,  0.24);
    push(0.39,  0.43);
    push(0.31,  0.56);
    push(0.17,  0.63);
    push(0.00,  0.65);

    const g = new THREE.LatheGeometry(pts, 44);
    g.computeVertexNormals();

    const s = { incisor: [1.06, 1.12, 0.42], canine: [0.82, 1.20, 0.66], molar: [1.26, 0.80, 1.20] }[type];
    g.scale(s[0], s[1], s[2]);

    // cusps: dimple the occlusal surface of the back teeth
    if (type === "molar") {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > 0.34) {
          const x = p.getX(i), z = p.getZ(i);
          p.setY(i, y - Math.cos(x * 5.2) * Math.cos(z * 5.2) * 0.16 * (y - 0.34));
        }
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
    }
    if (type === "incisor") {                   // square off the incisal edge
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (p.getY(i) > 0.45) p.setY(i, 0.45 + (p.getY(i) - 0.45) * 0.35);
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
    }
    if (type === "canine") {                    // point the tip
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (p.getY(i) > 0.55) p.setY(i, p.getY(i) + 0.13);
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
    }
    return g;
  }

  load().then(() => {
    const THREE = window.THREE;
    const W = () => stage.clientWidth, H = () => stage.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    stage.appendChild(renderer.domElement);
    renderer.domElement.className = "stage-canvas";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.1, 100);
    // framed from above and in front, so the U of the arch actually reads
    // Framing is computed from the arch's own bounds rather than hand-tuned,
    // so it survives any hero aspect ratio.
    const VIEW_DIR = new THREE.Vector3(0, 0.60, 0.80).normalize();
    const HOME = new THREE.Vector3();
    const LOOK = new THREE.Vector3();

    function fit() {
      camera.aspect = W() / H();
      camera.fov = 38;
      camera.updateProjectionMatrix();

      const box = new THREE.Box3().setFromObject(arch);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      LOOK.copy(sphere.center);

      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const dist = sphere.radius / Math.sin(Math.min(vFov, hFov) / 2) * 0.92;

      HOME.copy(LOOK).addScaledVector(VIEW_DIR, dist);
      camera.position.copy(HOME);
      camera.lookAt(LOOK);
    }

    /* ---- lighting: soft studio, warm gold rim ---- */
    scene.add(new THREE.HemisphereLight(0xdce8f5, 0x0b1828, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3.2, 6.5, 4.5);
    scene.add(key);
    const goldRim = new THREE.DirectionalLight(0xc9a227, 3.4);
    goldRim.position.set(-5.5, 1.2, -4);
    scene.add(goldRim);
    const coolRim = new THREE.DirectionalLight(0x9fc4e8, 1.5);
    coolRim.position.set(5, -1, -4);
    scene.add(coolRim);
    const fill = new THREE.DirectionalLight(0xffe9c9, 0.55);
    fill.position.set(-1.5, -4, 3.5);
    scene.add(fill);

    /* ---- procedural studio environment ---- */
    (function environment() {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 256;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.00, "#ffffff");
      g.addColorStop(0.38, "#cfd8e2");
      g.addColorStop(0.52, "#3d4a5c");
      g.addColorStop(1.00, "#0b1828");
      x.fillStyle = g; x.fillRect(0, 0, 512, 256);
      // two soft overhead strips: these become the highlights along the enamel
      x.globalAlpha = 0.95; x.fillStyle = "#fff";
      x.filter = "blur(14px)";
      x.fillRect(40, 18, 180, 52);
      x.fillRect(300, 10, 150, 44);
      x.filter = "blur(26px)"; x.globalAlpha = 0.5;
      x.fillStyle = "#c9a227"; x.fillRect(180, 120, 260, 40);

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose(); tex.dispose();
    })();

    /* ---- enamel ---- */
    const enamel = new THREE.MeshPhysicalMaterial({
      color: 0xfbf7ef, roughness: 0.24, metalness: 0.0,
      clearcoat: 1.0, clearcoatRoughness: 0.08,
      sheen: 0.6, sheenColor: new THREE.Color(0xffeccf), sheenRoughness: 0.45,
      envMapIntensity: 0.9,
      transmission: 0.03, thickness: 0.8, ior: 1.62
    });

    /* ---- the arch ---- */
    const arch = new THREE.Group();
    // 7 per side, mirrored: central -> lateral -> canine -> 2 premolars -> 2 molars
    const kinds = ["incisor", "incisor", "canine", "molar", "molar", "molar", "molar"];
    const widths = [0.50, 0.42, 0.44, 0.52, 0.55, 0.62, 0.62];
    const geoCache = {};

    let angle = 0;
    const A = 3.05, B = 2.45;               // ellipse semi-axes of the arch
    for (let side of [-1, 1]) {
      let t = 0.10;                          // start just off the midline
      for (let i = 0; i < kinds.length; i++) {
        const kind = kinds[i];
        geoCache[kind] = geoCache[kind] || toothGeometry(THREE, kind);
        const m = new THREE.Mesh(geoCache[kind], enamel);

        t += widths[i] * 0.265;
        const x = side * A * Math.sin(t);
        const z = B * Math.cos(t);           // incisors nearest, molars sweeping away
        m.position.set(x, 0, z);
        m.rotation.y = side * t + (side < 0 ? Math.PI : 0) * 0;
        m.rotation.x = -0.06 + i * 0.010;    // slight lingual tilt
        m.rotation.z = -side * 0.05;
        const sc = 0.92 + i * 0.045;
        m.scale.setScalar(sc);
        m.userData.baseY = 0;
        m.userData.delay = i * 0.09 + (side < 0 ? 0.045 : 0);
        arch.add(m);
        t += widths[i] * 0.265;
      }
    }
    arch.position.y = 0.15;
    arch.scale.setScalar(1.0);
    scene.add(arch);

    /* ---- Aesthalign shell: a clear aligner that seats onto the arch on a
           loop. This is the point of the whole scene - it shows the clinic's
           flagship treatment rather than just spinning a model. ---- */
    // Not `transmission` (it ignores `opacity`, so a fading shell goes grey)
    // and not additive (it clips to white over the lit enamel). A plain
    // low-opacity clearcoat film reads correctly in both states.
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcecff, roughness: 0.05, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.02,
      envMapIntensity: 1.7, specularIntensity: 1.2,
      transparent: true, opacity: 0, depthWrite: false,
      side: THREE.DoubleSide
    });
    // The shell never floats: it stays seated and sweeps on front-to-back, so
    // each piece needs its own material to carry its own opacity.
    const shell = new THREE.Group();
    const shellMats = [];
    arch.children.forEach((tooth, idx) => {
      const mat = shellMat.clone();
      const s2 = new THREE.Mesh(tooth.geometry, mat);
      s2.position.copy(tooth.position);
      s2.rotation.copy(tooth.rotation);
      s2.scale.copy(tooth.scale).multiplyScalar(1.042);
      s2.renderOrder = 2;
      // idx runs front-to-back down one side then the other
      s2.userData.order = idx % 7;
      shellMats.push(mat);
      shell.add(s2);
    });
    arch.add(shell);

    /* ---- gold ring, echoing the clinic's monogram ---- */
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.6, 0.022, 14, 180),
      new THREE.MeshStandardMaterial({ color: 0xd8b23c, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.05, 1.55);
    scene.add(ring);

    const ring2 = ring.clone();
    ring2.scale.setScalar(0.82);
    ring2.position.set(0, -0.98, 1.55);
    scene.add(ring2);

    /* ---- motes of gold, very sparse ---- */
    const N = 90, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 3 + Math.random() * 3.4, a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.4) * 5;
      pos[i * 3 + 2] = Math.sin(a) * r - 1;
    }
    const motes = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ color: 0xc9a227, size: 0.055, transparent: true, opacity: 0.8, depthWrite: false })
    );
    scene.add(motes);

    /* ---- interaction: pointer parallax, gentle spring ---- */
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = e => {
      const r = stage.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      tx = ((p.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((p.clientY - r.top) / r.height - 0.5) * 2;
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", () => { tx = 0; ty = 0; });

    /* ---- render loop, paused when off-screen or tab hidden ---- */
    let visible = true, raf = 0;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; tick(); }, { threshold: 0.01 }).observe(stage);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; tick(); });

    const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const t0 = performance.now();
    function frame(now) {
      raf = 0;
      const t = (now - t0) / 1000;

      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      arch.rotation.y = Math.sin(t * 0.22) * 0.30 + cx * 0.40;
      arch.rotation.x = cy * 0.10 + Math.sin(t * 0.31) * 0.025;
      arch.position.y = 0.15 + Math.sin(t * 0.6) * 0.06;

      // each tooth breathes into place on a stagger
      arch.children.forEach(m => {
        m.position.y = Math.sin(t * 1.1 - m.userData.delay * 3) * 0.035;
      });

      /* aligner: sweeps on front-to-back, holds, sweeps off, pauses */
      const CYCLE = 10.5, u = t % CYCLE;
      const SPAN = 0.75;                    // stagger across the 7 positions
      shell.children.forEach(piece => {
        const d = piece.userData.order * (SPAN / 6);
        let op;
        if (u < 1.2 + SPAN)      op = clamp01((u - d) / 1.2);
        else if (u < 6.8)        op = 1;
        else if (u < 8.2 + SPAN) op = 1 - clamp01((u - 6.8 - (SPAN - d)) / 1.2);
        else                     op = 0;
        piece.material.opacity = op * 0.34;
        piece.visible = op > 0.01;
      });

      ring.rotation.z = t * 0.12;
      ring2.rotation.z = -t * 0.17;
      motes.rotation.y = t * 0.03;

      camera.position.set(HOME.x + cx * 0.9, HOME.y - cy * 1.1, HOME.z);
      camera.lookAt(LOOK);

      renderer.render(scene, camera);
      tick();
    }
    function tick() { if (visible && !raf) raf = requestAnimationFrame(frame); }

    addEventListener("resize", () => { renderer.setSize(W(), H()); fit(); });
    fit();

    stage.classList.add("stage-live");   // fades the photo out, canvas in
    tick();
  }).catch(() => { /* three.js unreachable - photo stands */ });
})();
