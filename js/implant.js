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

    /* ---- crown: a real molar ------------------------------------------
       Built as a grid, not from a sphere. A sphere puts a pole exactly where
       the occlusal table belongs, which is what turned the last attempt into
       a mushroom. Here the walls rise to a flat table, and the table carries
       four cusps around a central fossa.                                 */
    (function crown() {
      const NU = 96;          // around
      const JW = 40;          // rings up the wall
      const JC = 16;          // rings across the table
      const RX = 0.80, RZ = 0.68, HH = 0.92;
      const CUSP = 0.21, FOSSA = 0.11;

      // rounded-square cross-section - molars are not circular
      const squish = th => {
        const c = Math.abs(Math.cos(th)), s2 = Math.abs(Math.sin(th));
        return 1 / Math.pow(Math.pow(c, 3.4) + Math.pow(s2, 3.4), 1 / 3.4);
      };
      // silhouette: narrow cervix, bulge at the waist, slight taper to the table
      const profile = w => 0.74 + 0.26 * Math.sin(Math.PI * (0.15 + 0.75 * w));
      const lobe = th => 0.5 - 0.5 * Math.cos(4 * th);          // four cusps
      const ridge = q => Math.exp(-Math.pow((q - 0.76) / 0.30, 2));
      const edgeLift = th => CUSP * lobe(th) * ridge(1);
      const smooth = (a, b, x) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };

      const pos = [], idx = [];
      const ring = (th, r, y) => pos.push(Math.cos(th) * r * RX, y, Math.sin(th) * r * RZ);

      // walls
      for (let j = 0; j <= JW; j++) {
        const w = j / JW;
        for (let i = 0; i <= NU; i++) {
          const th = (i / NU) * Math.PI * 2;
          ring(th, profile(w) * squish(th), HH * w + edgeLift(th) * smooth(0.70, 1, w));
        }
      }
      // occlusal table, edge inward
      for (let j = 1; j <= JC; j++) {
        const q = 1 - j / JC;
        for (let i = 0; i <= NU; i++) {
          const th = (i / NU) * Math.PI * 2;
          const y = HH + CUSP * lobe(th) * ridge(q) - FOSSA * Math.pow(1 - q, 2.2);
          ring(th, profile(1) * squish(th) * q, y);
        }
      }
      // flat base, so it seats on the abutment
      const baseStart = pos.length / 3;
      for (let i = 0; i <= NU; i++) {
        const th = (i / NU) * Math.PI * 2;
        ring(th, profile(0) * squish(th) * 0.92, -0.02);
      }
      pos.push(0, -0.02, 0);
      const centre = pos.length / 3 - 1;

      const rows = JW + JC + 1;
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < NU; i++) {
          const a = j * (NU + 1) + i, b = a + NU + 1;
          idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      for (let i = 0; i < NU; i++) idx.push(centre, baseStart + i + 1, baseStart + i);

      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();

      const m = new THREE.Mesh(g, enamel);
      m.position.y = 0.46;
      m.rotation.y = Math.PI / 7;      // cusps read better off-axis
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
