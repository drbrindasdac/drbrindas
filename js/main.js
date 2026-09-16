/* ---------------------------------------------------------------
   Dr. Brinda's Dental - site behaviour
---------------------------------------------------------------- */

/* nav: solid on scroll + mobile menu */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("solid", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* scroll reveal */
const io = new IntersectionObserver((entries, obs) => {
  entries.forEach((en, i) => {
    if (!en.isIntersecting) return;
    en.target.style.transitionDelay = (i * 70) + "ms";
    en.target.classList.add("in");
    obs.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* stat count-up */
const countIO = new IntersectionObserver((entries, obs) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    obs.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach(el => countIO.observe(el));

/* ---- Google reviews ----------------------------------------------------
   assets/reviews.json is refreshed weekly by .github/workflows/reviews.yml.
   The markup already in index.html is the fallback, so a failed fetch or a
   stale cache still leaves a populated rail.
------------------------------------------------------------------------ */
fetch("assets/reviews.json", { cache: "no-cache" })
  .then(r => r.ok ? r.json() : Promise.reject(r.status))
  .then(data => {
    const rail = document.querySelector(".rail");
    if (!rail || !data.reviews || !data.reviews.length) return;

    const esc = t => { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; };

    rail.innerHTML = data.reviews.map(r => {
      const stars = "\u2605".repeat(Math.round(r.rating));
      const avatar = r.photo
        ? `<img class="avatar" src="${esc(r.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="avatar">${esc(r.author.trim()[0] || "G")}</span>`;
      const name = r.url
        ? `<a href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(r.author)}</b></a>`
        : `<b>${esc(r.author)}</b>`;
      return `<figure class="quote in">
        <div class="stars">${stars}</div>
        <p>&ldquo;${esc(r.text)}&rdquo;</p>
        <figcaption class="who">${avatar}<span>${name}<small>${esc(r.when)} &middot; Google</small></span></figcaption>
      </figure>`;
    }).join("");
    rail.scrollLeft = 0;   // innerHTML swap can leave the rail snapped mid-scroll

    // headline + "read all" link follow whatever Google currently says
    const h = document.querySelector("#reviews h2");
    if (h && data.rating) h.textContent = `${data.rating.toFixed(1)} on Google, earned one visit at a time.`;
    const more = document.querySelector('#reviews a.btn');
    if (more && data.url) {
      more.href = data.url;
      if (data.count) more.textContent = `Read all ${data.count} reviews on Google`;
    }
  })
  .catch(() => { /* static markup in index.html stands in */ });

/* implant render - one object, cheap enough for phones too, and fetched only
   when its section is actually approaching */
{
  const st = document.getElementById("implant-stage");
  if (st) {
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      const el = document.createElement("script");
      el.src = "js/implant.js"; el.type = "module";
      document.body.appendChild(el);
    }, { rootMargin: "400px" }).observe(st);
  }
}

document.getElementById("yr").textContent = new Date().getFullYear();
