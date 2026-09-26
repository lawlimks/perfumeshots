const app = document.querySelector("#app");
let data = { launches: [], brands: [], stores: [], articles: [] };

const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
const slug = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const href = (type, name) => name ? `/${type}/${encodeURIComponent(slug(name))}/` : `/${type}/`;
const findBySlug = (items, key, value) => items.find(item => slug(item[key]) === value);
const stockistNames = launch => (launch.stockists || []).map(id => data.stores.find(store => store.id === id)?.name).filter(Boolean);
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

function launchCard(item) {
  const stores = stockistNames(item);
  const name = brandName(item);
  const productUrl = safeExternalUrl(item.productUrl);
  return `<article class="card launch-card">
    ${item.image ? `<img src="${esc(item.image)}" alt="${esc(name)} ${esc(item.perfume)}" loading="lazy">` : ""}
    <h2><a href="${href("brands", name)}">${esc(name)}</a> — ${esc(item.perfume)}</h2>
    <p>${stores.length ? `Available at ${stores.map((storeName, i) => `${i ? ", " : ""}<a href="${href("stockists", storeName)}">${esc(storeName)}</a>`).join("")}` : "Singapore availability to be confirmed."}</p>
    ${productUrl ? `<p><a href="${productUrl}" target="_blank" rel="noopener noreferrer">View at retailer</a></p>` : ""}
  </article>`;
}
function featuredCard(item, brand) {
  const url = safeExternalUrl(item.url);
  const image = safeExternalUrl(item.image);
  return `<article class="card featured-card">
    ${image ? `<img src="${image}" alt="${esc(item.name)} by ${esc(brand.name)}" loading="lazy">` : ""}
    <h3>${esc(item.name)}</h3>
    ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">View at Amaris</a>` : ""}
  </article>`;
}
function empty(message) { return `<p class="notice">${esc(message)}</p>`; }

function render() {
  const parts = location.pathname.split("/").filter(Boolean);
  const [section, id] = parts;
  if (!section) return renderLaunches();
  if (section === "brands") return id ? renderBrand(id) : renderBrands();
  if (section === "stores" || section === "stockists") return id ? renderStore(id) : renderStores();
  if (section === "articles") return id ? renderArticle(id) : renderArticles();
  app.innerHTML = `<h1>Page not found</h1><p><a href="/">Back to new launches</a></p>`;
}
function renderLaunches() {
  const sorted = [...data.launches];
  app.innerHTML = `<h1>New in Singapore</h1>
    <p>Recent perfume launches and the Singapore stores that carry them.</p>
    <div class="controls"><label>Search launches <input id="search" type="search" placeholder="Brand or perfume name"></label></div>
    <section id="results" class="grid" aria-live="polite"></section>`;
  const input = document.querySelector("#search");
  const results = document.querySelector("#results");
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const matches = sorted.filter(item => `${brandName(item)} ${item.perfume} ${stockistNames(item).join(" ")}`.toLowerCase().includes(query));
    results.innerHTML = matches.length ? matches.map(launchCard).join("") : empty(sorted.length ? "No launches match that search." : "No launches have been added yet.");
  };
  input.addEventListener("input", update);
  update();
}
function renderBrands() {
  const brands = [...data.brands].sort((a, b) => a.name.localeCompare(b.name));
  app.innerHTML = `<h1>Brands</h1><p>Browse brands available in Singapore.</p>${brands.length ? `<ul>${brands.map(brand => `<li><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></li>`).join("")}</ul>` : empty("Brand listings will appear here as they are added.")}`;
}
function renderBrand(id) {
  const brand = findBySlug(data.brands, "name", id);
  if (!brand) { app.innerHTML = `<h1>Brand not found</h1><p><a href="/brands/">Browse all brands</a></p>`; return; }
  const launches = data.launches.filter(item => item.brandId === brand.id);
  const stores = data.stores.filter(store => (store.brands || []).includes(brand.id));
  const brandUrl = safeExternalUrl(brand.url);
  const logo = safeExternalUrl(brand.logoImage);
  const hero = safeExternalUrl(brand.heroImage);
  const featured = brand.featuredPerfumes || [];
  app.innerHTML = `<p><a href="/brands/">All brands</a></p>
    <section class="brand-heading">
      ${logo ? `<img class="brand-logo" src="${logo}" alt="${esc(brand.name)} logo">` : ""}
      <div><h1>${esc(brand.name)}</h1>${brand.description ? `<p class="brand-description">${esc(brand.description)}</p>` : ""}</div>
    </section>
    ${hero ? `<img class="brand-hero" src="${hero}" alt="${esc(brand.name)} campaign image" loading="lazy">` : ""}
    ${brandUrl ? `<p><a href="${brandUrl}" target="_blank" rel="noopener noreferrer">View brand collection at Amaris</a></p>` : ""}
    <h2>Find this brand</h2>${stores.length ? `<ul>${stores.map(store => `<li><a href="${href("stockists", store.name)}">${esc(store.name)}</a></li>`).join("")}</ul>` : empty("No stores are listed for this brand yet.")}
    ${launches.length ? `<h2>Recent launches</h2><section class="grid">${launches.map(launchCard).join("")}</section>` : ""}
    ${featured.length ? `<h2>Featured fragrances</h2><section class="grid">${featured.map(item => featuredCard(item, brand)).join("")}</section>` : ""}
    ${!launches.length && !featured.length ? `<h2>Recent launches</h2>${empty("No recent launches are listed for this brand yet.")}` : ""}`;
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
  const brands = (store.brands || []).map(id => data.brands.find(brand => brand.id === id)).filter(Boolean);
  const launches = data.launches.filter(item => (item.stockists || []).includes(store.id));
  const storeUrl = safeExternalUrl(store.url);
  const locations = store.locations || [];
  app.innerHTML = `<p><a href="/stockists/">All stockists</a></p><h1>${esc(store.name)}</h1>
    ${storeUrl ? `<p><a href="${storeUrl}" target="_blank" rel="noopener noreferrer">Visit stockist website</a></p>` : ""}
    ${locations.length ? `<h2>${locations.length === 1 ? "Address" : "Locations"}</h2><ul>${locations.map(location => `<li>${esc(location)}</li>`).join("")}</ul>` : ""}
    ${store.availabilityNote ? `<p class="notice">${esc(store.availabilityNote)}</p>` : ""}
    <h2>Brands carried</h2>${brands.length ? `<ul>${brands.map(brand => `<li><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></li>`).join("")}</ul>` : empty("No brands are listed for this store yet.")}
    <h2>Recent launches</h2><section class="grid">${launches.length ? launches.map(launchCard).join("") : empty("No recent launches are listed for this store yet.")}</section>`;
}

window.addEventListener("popstate", render);
fetch("/data.json", { cache: "no-cache" }).then(response => {
  if (!response.ok) throw new Error("Unable to load site data");
  return response.json();
}).then(siteData => { data = siteData; render(); }).catch(() => {
  app.innerHTML = "<h1>Site data could not be loaded</h1><p>Please refresh the page later.</p>";
});
