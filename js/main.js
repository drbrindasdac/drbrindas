/* ---------------------------------------------------------------
   Dr. Brinda's Dental — site behaviour
   Change CAL_LINK to the real cal.com link once the account exists.
---------------------------------------------------------------- */
const CAL_LINK = "brindasclinic/consultation"; // cal.com/<this>

/* nav: solid on scroll + mobile menu */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const onScroll = () => nav.classList.toggle("solid", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
document.getElementById("navLinks").addEventListener("click", e => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});

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

/* cal.com inline embed */
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal, ar = arguments;
    if (!cal.loaded) {
      cal.ns = {}; cal.q = cal.q || [];
      d.head.appendChild(d.createElement("script")).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const ns = ar[1];
      api.q = api.q || [];
      typeof ns === "string" ? (cal.ns[ns] = cal.ns[ns] || api) && p(cal.ns[ns], ar) && p(cal, ["initNamespace", ns]) : p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

Cal("init", { origin: "https://app.cal.com" });
Cal("inline", {
  elementOrSelector: "#cal-inline",
  calLink: CAL_LINK,
  config: { layout: "month_view" }
});
Cal("ui", {
  theme: "light",
  cssVarsPerTheme: { light: { "cal-brand": "#C9A227" } },
  hideEventTypeDetails: false,
  layout: "month_view"
});

/* if the Cal embed never renders (bad link / blocked / offline), show a fallback
   so the booking section is never a blank white box */
setTimeout(() => {
  const shell = document.getElementById("cal-inline");
  if (!shell || shell.querySelector("iframe")) return;
  shell.innerHTML =
    '<div style="padding:44px;text-align:center;font-family:var(--sans)">' +
    '<h3 style="margin-bottom:12px">Book by phone or WhatsApp</h3>' +
    '<p style="color:var(--muted);font-size:.95rem">Online booking is being set up. ' +
    'Reach us directly &mdash; we reply during clinic hours.</p>' +
    '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px">' +
    '<a class="btn btn-gold" href="tel:+918217317171">Call 8217 317 171</a>' +
    '<a class="btn btn-ghost" href="https://wa.me/918217317171" target="_blank" rel="noopener">WhatsApp</a>' +
    '</div></div>';
  shell.style.minHeight = "auto";
  shell.style.display = "grid";
  shell.style.placeItems = "center";
}, 5000);

document.getElementById("yr").textContent = new Date().getFullYear();
