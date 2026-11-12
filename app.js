const app = document.querySelector("#app");
let data = { launches: [], brands: [], stores: [], articles: [] };
const homeHeroImage = "https://pub-437a56093e434d13b968029d18f3bbf8.r2.dev/assets/9a137614-bdac-4c36-8cd7-f5483fcdc6d6.jpg";
const homeHeroLink = "https://escentials.com/products/byredo-future-memories-eau-de-parfum";
const siteHeader = document.querySelector(".site-header");
function updateHeaderOnScroll() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 60);
}
window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
updateHeaderOnScroll();

const footerParallax = document.querySelector(".footer-parallax-banner");
const mobileParallaxQuery = window.matchMedia("(max-width: 48rem)");
let parallaxFrame = 0;
function updateMobileParallax() {
  if (!footerParallax || !mobileParallaxQuery.matches) {
    footerParallax?.style.removeProperty("--parallax-offset");
    return;
  }
  const rect = footerParallax.getBoundingClientRect();
  const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.18;
  footerParallax.style.setProperty("--parallax-offset", `${offset.toFixed(1)}px`);
}
function scheduleMobileParallax() {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(() => {
    updateMobileParallax();
    parallaxFrame = 0;
  });
}
window.addEventListener("scroll", scheduleMobileParallax, { passive: true });
window.addEventListener("resize", scheduleMobileParallax, { passive: true });
updateMobileParallax();

const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
function closeMenu() {
  siteHeader.classList.remove("menu-open");
  document.body.classList.remove("menu-is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
}
menuToggle.addEventListener("click", () => {
  const isOpen = siteHeader.classList.toggle("menu-open");
  document.body.classList.toggle("menu-is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
primaryNavigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) closeMenu();
});

const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
const slug = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const href = (type, name) => name ? `/${type}/${encodeURIComponent(slug(name))}/` : `/${type}/`;
const findBySlug = (items, key, value) => items.find(item => slug(item[key]) === value);
const stockistNames = launch => [...new Set((launch.stockists || []).map(id => data.stores.find(store => store.id === id)).filter(Boolean).map(store => store.id.startsWith("amaris-") ? "Amaris" : store.name))];
function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? esc(url.href) : "";
  } catch {
    return "";
  }
}
function brandName(launch) {
  return data.brands.find(brand => brand.id === launch.brandId)?.name || launch.brand || "";
}

function launchRow(item) {
  const stores = stockistNames(item);
  const name = brandName(item);
  const brand = data.brands.find(entry => entry.id === item.brandId);
  const date = item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    ? new Date(`${item.date}T00:00:00`)
    : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
    : "Date not recorded";
  return `<li class="launch-row">
    <time class="launch-date"${date ? ` datetime="${esc(item.date)}"` : ""}>${dateLabel}</time>
    <span class="launch-brand">${brand ? `<a href="${href("brands", brand.name)}">${esc(name)}</a>` : esc(name)}</span>
    <span class="launch-name">${esc(item.perfume || "—")}</span>
    <span class="launch-retailer">${stores.length ? stores.map(esc).join(", ") : "To be confirmed"}</span>
  </li>`;
}
function launchHeading() {
  return `<li class="launch-row launch-heading" aria-hidden="true"><span>Date spotted</span><span>Brand</span><span>Name</span><span>Retailer</span></li>`;
}
function featuredCard(item, brand) {
  const url = safeExternalUrl(item.url);
  const image = safeExternalUrl(item.image);
  return `<li class="featured-fragrance">
    ${image ? `<img src="${image}" alt="${esc(item.name)} by ${esc(brand.name)}" loading="lazy">` : ""}
    ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(item.name)}</a>` : esc(item.name)}
  </li>`;
}
function empty(message) { return `<p class="notice">${esc(message)}</p>`; }

function render() {
  const parts = location.pathname.split("/").filter(Boolean);
  const [section, id] = parts;
  document.body.classList.toggle("home", !section);
  if (!section) return renderLaunches();
  if (section === "brands") return id ? renderBrand(id) : renderBrands();
  if (section === "stores" || section === "stockists") return id ? renderStore(id) : renderStores();
  if (section === "articles") return id ? renderArticle(id) : renderArticles();
  app.innerHTML = `<h1>Page not found</h1><p><a href="/">Back to new launches</a></p>`;
}
function renderLaunches() {
  const launches = [...data.launches].sort((a, b) => {
    const dateOrder = (b.date || "").localeCompare(a.date || "");
    if (dateOrder) return dateOrder;
  });
  const rows = launches.map(launchRow);
  app.innerHTML = `<a class="home-hero" href="${homeHeroLink}" target="_blank" rel="noopener noreferrer" aria-label="View BYREDO Future Memories at Escentials">
      <img src="${homeHeroImage}" alt="BYREDO Future Memories campaign image">
    </a>
    <h1>New discoveries in Singapore</h1>
    <p>Perfumes recently spotted, shared or confirmed in Singapore.</p>
    ${rows.length ? `<div class="launch-list-scroll"><ul class="launch-list">${launchHeading()}${rows.map((row, index) => index >= 10 ? row.replace('<li class="launch-row">', '<li class="launch-row" hidden>') : row).join("")}</ul></div>` : empty("No discoveries have been added yet.")}
    ${rows.length > 10 ? `<button class="load-more-launches" type="button">Load more discoveries</button>` : ""}`;
  const moreButton = document.querySelector(".load-more-launches");
  if (moreButton) {
    let visibleCount = 8;
    moreButton.addEventListener("click", () => {
      const wrappers = [...document.querySelectorAll(".launch-list .launch-row[hidden]")];
      wrappers.slice(0, 8).forEach(wrapper => wrapper.hidden = false);
      visibleCount += wrappers.length > 8 ? 8 : wrappers.length;
      if (visibleCount >= rows.length) moreButton.remove();
    });
  }
}
function renderBrands() {
  const brands = [...data.brands].sort((a, b) => a.name.localeCompare(b.name));
  const groups = new Map();
  data.stores.forEach(store => {
    const labels = (Array.isArray(store.directoryGroups) && store.directoryGroups.length ? store.directoryGroups : [store.directoryGroup || store.name]).filter(Boolean);
    const brandIds = store.brands || [];
    if (!brandIds.length) return;
    labels.forEach(label => {
      if (!groups.has(label)) groups.set(label, new Set());
      brandIds.forEach(id => groups.get(label).add(id));
    });
  });
  (data.brandGroups || []).forEach(group => {
    groups.set(group.name, new Set(group.brandIds || []));
  });
  const filters = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  app.innerHTML = `<h1>Fragrance Directory</h1>
    <p>Browse brands available in Singapore.</p>
    ${filters.length ? `<section class="brand-filter-section"><h2>Filter by stockist</h2>
      <div class="brand-filters" role="group" aria-label="Filter brands by stockist">
        <button type="button" class="brand-filter is-active" data-filter="all" aria-pressed="true">All</button>
        ${filters.map(([label]) => `<button type="button" class="brand-filter" data-filter="${esc(label)}" aria-pressed="false">${esc(label)}</button>`).join("")}
      </div>
    </section>` : ""}
    ${brands.length ? `<ul id="brand-results" class="brand-list">${brands.map(brand => `<li data-brand-id="${esc(brand.id)}"><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></li>`).join("")}</ul>` : empty("Brand listings will appear here as they are added.")}`;
  const buttons = [...document.querySelectorAll(".brand-filter")];
  const list = document.querySelector("#brand-results");
  if (!list || !buttons.length) return;
  const setFilter = label => {
    const allowed = label === "all" ? null : groups.get(label);
    list.querySelectorAll("[data-brand-id]").forEach(row => {
      row.hidden = allowed ? !allowed.has(row.dataset.brandId) : false;
    });
    buttons.forEach(button => {
      const active = button.dataset.filter === label;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  buttons.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
}
function renderBrand(id) {
  const brand = findBySlug(data.brands, "name", id);
  if (!brand) { app.innerHTML = `<h1>Brand not found</h1><p><a href="/brands/">Browse all brands</a></p>`; return; }
  const launches = data.launches.filter(item => item.brandId === brand.id);
  const stores = data.stores.filter(store => (store.brands || []).includes(brand.id));
  const brandUrl = safeExternalUrl(brand.url);
  const officialWebsite = safeExternalUrl(brand.website);
  const logo = safeExternalUrl(brand.logoImage);
  const hero = safeExternalUrl(brand.heroImage);
  const featured = brand.featuredPerfumes || [];
  app.innerHTML = `<p><a href="/brands/">All brands</a></p>
    <section class="brand-heading">
      ${logo ? `<img class="brand-logo" src="${logo}" alt="${esc(brand.name)} logo">` : ""}
      <div><h1>${esc(brand.name)}</h1>${brand.description ? `<p class="brand-description">${esc(brand.description)}</p>` : ""}</div>
    </section>
    ${hero ? `<img class="brand-hero" src="${hero}" alt="${esc(brand.name)} campaign image" loading="lazy">` : ""}
    ${officialWebsite ? `<p><a href="${officialWebsite}" target="_blank" rel="noopener noreferrer">Official website</a></p>` : ""}
    ${brandUrl ? `<p><a href="${brandUrl}" target="_blank" rel="noopener noreferrer">View brand collection at Amaris</a></p>` : ""}
    <h2>Find this brand</h2>${stores.length ? `<ul>${stores.map(store => `<li><a href="${href("stockists", store.name)}">${esc(store.name)}</a></li>`).join("")}</ul>` : empty("No stores are listed for this brand yet.")}
    ${launches.length ? `<h2>Recent discoveries</h2><ul class="launch-list brand-launch-list">${launches.map(item => launchRow(item)).join("")}</ul>` : ""}
    ${featured.length ? `<h2>Featured fragrances</h2><ul class="featured-fragrance-list">${featured.map(item => featuredCard(item, brand)).join("")}</ul>` : ""}
    ${!launches.length && !featured.length ? `<h2>Recent discoveries</h2>${empty("No recent discoveries are listed for this brand yet.")}` : ""}`;
}

function renderArticles() {
  const articles = [...(data.articles || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  app.innerHTML = `<h1>Articles</h1>
    <p>Perfume notes, reviews and stories from Singapore.</p>
    ${articles.length ? `<section class="grid">${articles.map(article => {
      const brand = data.brands.find(item => item.id === article.brandId);
      return `<article class="card article-card">
        <h2><a href="${href("articles", article.slug || article.id)}">${esc(article.title)}</a></h2>
        ${article.date ? `<p class="article-date"><time datetime="${esc(article.date)}">${esc(article.date)}</time></p>` : ""}
        <p>${esc(article.excerpt || "")}</p>
        ${brand ? `<p><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></p>` : ""}
      </article>`;
    }).join("")}</section>` : empty("Articles will appear here as they are added.")}`;
}
function renderArticle(slugValue) {
  const article = (data.articles || []).find(item => (item.slug || item.id) === slugValue);
  if (!article) { app.innerHTML = `<h1>Article not found</h1><p><a href="/articles/">Browse articles</a></p>`; return; }
  const brand = data.brands.find(item => item.id === article.brandId);
  const stores = (article.storeIds || []).map(id => data.stores.find(store => store.id === id)).filter(Boolean);
  const productUrl = safeExternalUrl(article.productUrl);
  app.innerHTML = `<p><a href="/articles/">All articles</a></p>
    <article class="article">
      <h1>${esc(article.title)}</h1>
      ${article.date ? `<p class="article-date"><time datetime="${esc(article.date)}">${esc(article.date)}</time></p>` : ""}
      ${brand ? `<p class="article-brand">About <a href="${href("brands", brand.name)}">${esc(brand.name)}</a></p>` : ""}
      <div class="article-body">${(article.body || []).map(paragraph => `<p>${esc(paragraph)}</p>`).join("")}</div>
      ${stores.length ? `<h2>Find it in Singapore</h2><ul>${stores.map(store => `<li><a href="${href("stockists", store.name)}">${esc(store.name)}</a></li>`).join("")}</ul>` : ""}
      ${productUrl ? `<p class="article-retailer"><a href="${productUrl}" target="_blank" rel="noopener noreferrer">View ${esc(article.perfume || "this perfume")} at Amaris</a></p>` : ""}
    </article>`;
}

function renderStores() {
  const stores = [...data.stores].sort((a, b) => a.name.localeCompare(b.name));
  const group = (items, title) => items.length ? `<section class="stockist-group"><h2>${title}</h2><ul>${items.map(store => {
    const locations = store.locations || [];
    return `<li><a href="${href("stockists", store.name)}">${esc(store.name)}</a>${locations.length ? `<ul class="stockist-addresses">${locations.map(location => `<li>${esc(location)}</li>`).join("")}</ul>` : ""}</li>`;
  }).join("")}</ul></section>` : "";
  const boutiques = stores.filter(store => store.type === "brand-boutique");
  const multiBrand = stores.filter(store => store.type !== "brand-boutique");
  app.innerHTML = `<h1>Stockists</h1><p>Find multi-brand retailers and brand boutiques in Singapore.</p>${stores.length ? `${group(multiBrand, "Multi-brand stockists")}${group(boutiques, "Brand boutiques")}` : empty("Stockist listings will appear here as they are added.")}`;
}
function renderStore(id) {
  const store = findBySlug(data.stores, "name", id);
  if (!store) { app.innerHTML = `<h1>Stockist not found</h1><p><a href="/stockists/">Browse all stockists</a></p>`; return; }
  const brands = (store.brands || []).map(id => data.brands.find(brand => brand.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const launches = data.launches.filter(item => (item.stockists || []).includes(store.id));
  const storeUrl = safeExternalUrl(store.url);
  const locations = store.locations || [];
  app.innerHTML = `<p><a href="/stockists/">All stockists</a></p><h1>${esc(store.name)}</h1>
    ${storeUrl ? `<p><a href="${storeUrl}" target="_blank" rel="noopener noreferrer">Visit stockist website</a></p>` : ""}
    ${locations.length ? `<h2>${locations.length === 1 ? "Address" : "Locations"}</h2><ul>${locations.map(location => `<li>${esc(location)}</li>`).join("")}</ul>` : ""}
    ${store.availabilityNote ? `<p class="notice">${esc(store.availabilityNote)}</p>` : ""}
    <h2>Brands carried</h2>${brands.length ? `<ul class="brand-list stockist-brand-list">${brands.map(brand => `<li><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></li>`).join("")}</ul>` : empty("No brands are listed for this store yet.")}
    <h2>Recent discoveries</h2>${launches.length ? `<div class="launch-list-scroll"><ul class="launch-list">${launchHeading()}${launches.map(launchRow).join("")}</ul></div>` : empty("No recent discoveries are listed for this store yet.")}`;
}

window.addEventListener("popstate", render);
fetch("/data.json", { cache: "no-cache" }).then(response => {
  if (!response.ok) throw new Error("Unable to load site data");
  return response.json();
}).then(siteData => { data = siteData; render(); }).catch(() => {
  app.innerHTML = "<h1>Site data could not be loaded</h1><p>Please refresh the page later.</p>";
});
