/* ---------------------------------------------------------------------------
   A single dental implant, product-lit. One large object rather than many
   small ones - that is what makes this read as a render instead of clip art.
   Lazily loaded; the section is designed to look complete without it.
--------------------------------------------------------------------------- */
(function () {
  const stage = document.getElementById("implant-stage");
  if (!stage) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
  } catch (e) { return; }

  const src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js";
  new Promise((res, rej) => {
    if (window.THREE) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  }).then(() => {
    const THREE = window.THREE;
    const W = () => stage.clientWidth, H = () => stage.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
    renderer.setSize(W(), H());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = "implant-canvas";
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 100);

    /* ---- studio environment, built in a canvas ---- */
    (function () {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 256;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.00, "#ffffff");
      g.addColorStop(0.34, "#b9c6d6");
      g.addColorStop(0.50, "#2c3a4c");
      g.addColorStop(1.00, "#0a1523");
      x.fillStyle = g; x.fillRect(0, 0, 512, 256);
      x.filter = "blur(16px)"; x.fillStyle = "#fff";
      x.fillRect(60, 14, 150, 60);        // key strip
      x.fillRect(330, 22, 110, 44);       // secondary strip
      x.filter = "blur(30px)"; x.globalAlpha = 0.75;
      x.fillStyle = "#e8c55a"; x.fillRect(150, 110, 280, 60);   // warm bounce
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const p = new THREE.PMREMGenerator(renderer);
      scene.environment = p.fromEquirectangular(tex).texture;
      p.dispose(); tex.dispose();
    })();

    scene.add(new THREE.HemisphereLight(0xcfe0f2, 0x0a1523, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(4, 7, 6); scene.add(key);
    const gold = new THREE.DirectionalLight(0xe8b93c, 4.2); gold.position.set(-6, 2, -3); scene.add(gold);
    const cool = new THREE.DirectionalLight(0x8fb6e0, 1.4); cool.position.set(6, -2, -4); scene.add(cool);

    /* ---- materials ---- */
    const titanium = new THREE.MeshPhysicalMaterial({
      color: 0xd9ae4a, metalness: 1.0, roughness: 0.23,
      envMapIntensity: 1.9, clearcoat: 0.4, clearcoatRoughness: 0.25
    });
    const enamel = new THREE.MeshPhysicalMaterial({
      color: 0xfbf6ec, roughness: 0.2, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.06,
      sheen: 0.6, sheenColor: new THREE.Color(0xffeccf),
      envMapIntensity: 1.0
    });

    const implant = new THREE.Group();

    /* ---- crown: a molar, cusped ---- */
    (function crown() {
      const pts = [];
      const P = (x, y) => pts.push(new THREE.Vector2(x, y));
      P(0.00, 0.00); P(0.52, 0.02); P(0.70, 0.14); P(0.80, 0.38);
      P(0.84, 0.66); P(0.82, 0.95); P(0.72, 1.16); P(0.52, 1.30);
      P(0.28, 1.37); P(0.00, 1.39);
      const g = new THREE.LatheGeometry(pts, 64);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > 0.9) {                        // occlusal cusps
          const x = p.getX(i), z = p.getZ(i);
          const k = (y - 0.9) / 0.5;
          p.setY(i, y - Math.cos(x * 3.1) * Math.cos(z * 3.1) * 0.30 * k);
        }
      }
      p.needsUpdate = true; g.computeVertexNormals();
      const m = new THREE.Mesh(g, enamel);
      m.position.y = 0.50;
      implant.add(m);
    })();

    /* ---- abutment: the collar between crown and screw ---- */
    (function abutment() {
      const pts = [];
      const P = (x, y) => pts.push(new THREE.Vector2(x, y));
      P(0.00, 0.00); P(0.46, 0.00); P(0.50, 0.10);
      P(0.46, 0.34); P(0.40, 0.52); P(0.00, 0.54);
      const g = new THREE.LatheGeometry(pts, 64);
      const m = new THREE.Mesh(g, titanium);
      m.position.y = 0.02;
      implant.add(m);
    })();

    /* ---- screw body: tapered core ---- */
    const L = 2.55, RT = 0.40, RB = 0.11;
    const taper = v => RB + (RT - RB) * Math.pow(v, 0.72);   // v: 0 tip -> 1 top
    (function core() {
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const v = i / 26;
        pts.push(new THREE.Vector2(taper(v) * 0.90, -L + v * L));
      }
      pts.unshift(new THREE.Vector2(0, -L - 0.10));
      pts.push(new THREE.Vector2(0, 0.02));
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), titanium);
      implant.add(m);
    })();

    /* ---- screw threads: a tube swept along a helix that follows the taper ---- */
    (function threads() {
      const TURNS = 16, SEG = 760;
      class Helix extends THREE.Curve {
        getPoint(t, target = new THREE.Vector3()) {
          const v = 0.06 + t * 0.92;
          const a = t * Math.PI * 2 * TURNS;
          const r = taper(v) * 1.01;
          return target.set(Math.cos(a) * r, -L + v * L, Math.sin(a) * r);
        }
      }
      const g = new THREE.TubeGeometry(new Helix(), SEG, 0.085, 10, false);
      implant.add(new THREE.Mesh(g, titanium));
    })();

    implant.position.y = -0.15;
    scene.add(implant);

    /* ---- frame it from its own bounds ---- */
    const LOOK = new THREE.Vector3(), HOME = new THREE.Vector3();
    const DIR = new THREE.Vector3(0.10, 0.16, 1).normalize();
    function fit() {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      const sph = new THREE.Box3().setFromObject(implant).getBoundingSphere(new THREE.Sphere());
      LOOK.copy(sph.center);
      const vf = THREE.MathUtils.degToRad(camera.fov);
      const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      const d = sph.radius / Math.sin(Math.min(vf, hf) / 2) * 0.95;
      HOME.copy(LOOK).addScaledVector(DIR, d);
      camera.position.copy(HOME);
      camera.lookAt(LOOK);
    }

    let tx = 0, ty = 0, cx = 0, cy = 0;
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener("pointerleave", () => { tx = 0; ty = 0; });

    let visible = true, raf = 0;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; tick(); }, { threshold: 0.01 }).observe(stage);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; tick(); });

    const t0 = performance.now();
    function frame(now) {
      raf = 0;
      const t = (now - t0) / 1000;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;

      implant.rotation.y = t * 0.30 + cx * 0.5;
      implant.rotation.z = Math.sin(t * 0.5) * 0.035 - cx * 0.06;
      implant.position.y = -0.15 + Math.sin(t * 0.7) * 0.075;

      camera.position.set(HOME.x + cx * 0.7, HOME.y - cy * 0.9, HOME.z);
      camera.lookAt(LOOK);

      renderer.render(scene, camera);
      tick();
    }
    function tick() { if (visible && !raf) raf = requestAnimationFrame(frame); }

    addEventListener("resize", () => { renderer.setSize(W(), H()); fit(); });
    fit();
    stage.classList.add("implant-live");
    tick();
  }).catch(() => {});
})();
