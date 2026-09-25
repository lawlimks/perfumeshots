const app = document.querySelector("#app");
let data = { launches: [], brands: [], stores: [] };

const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
const slug = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const href = (type, name) => `#/${type}/${encodeURIComponent(slug(name))}`;
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
  return `<article class="card">
    ${item.image ? `<img src="${esc(item.image)}" alt="${esc(name)} ${esc(item.perfume)}" loading="lazy">` : ""}
    <h2><a href="${href("brands", name)}">${esc(name)}</a> — ${esc(item.perfume)}</h2>
    <p>${stores.length ? `Available at ${stores.map((storeName, i) => `${i ? ", " : ""}<a href="${href("stores", storeName)}">${esc(storeName)}</a>`).join("")}` : "Singapore availability to be confirmed."}</p>
    ${productUrl ? `<p><a href="${productUrl}" target="_blank" rel="noopener noreferrer">View at retailer</a></p>` : ""}
  </article>`;
}
function empty(message) { return `<p class="notice">${esc(message)}</p>`; }

function render() {
  const parts = decodeURIComponent(location.hash.slice(1) || "/").split("/").filter(Boolean);
  const [section, id] = parts;
  if (!section) return renderLaunches();
  if (section === "brands") return id ? renderBrand(id) : renderBrands();
  if (section === "stores") return id ? renderStore(id) : renderStores();
  app.innerHTML = `<h1>Page not found</h1><p><a href="#/">Back to new launches</a></p>`;
}
function renderLaunches() {
  const sorted = [...data.launches].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
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
  if (!brand) { app.innerHTML = `<h1>Brand not found</h1><p><a href="#/brands">Browse all brands</a></p>`; return; }
  const launches = data.launches.filter(item => item.brandId === brand.id);
  const stores = data.stores.filter(store => (store.brands || []).includes(brand.id));
  const brandUrl = safeExternalUrl(brand.url);
  app.innerHTML = `<p><a href="#/brands">All brands</a></p><h1>${esc(brand.name)}</h1>
    ${brandUrl ? `<p><a href="${brandUrl}" target="_blank" rel="noopener noreferrer">View brand collection</a></p>` : ""}
    <h2>Stores carrying this brand</h2>${stores.length ? `<ul>${stores.map(store => `<li><a href="${href("stores", store.name)}">${esc(store.name)}</a></li>`).join("")}</ul>` : empty("No stores are listed for this brand yet.")}
    <h2>Recent launches</h2><section class="grid">${launches.length ? launches.map(launchCard).join("") : empty("No recent launches are listed for this brand yet.")}</section>`;
}
function renderStores() {
  const stores = [...data.stores].sort((a, b) => a.name.localeCompare(b.name));
  app.innerHTML = `<h1>Stores</h1><p>Find Singapore stores and the brands they carry.</p>${stores.length ? `<ul>${stores.map(store => `<li><a href="${href("stores", store.name)}">${esc(store.name)}</a></li>`).join("")}</ul>` : empty("Store listings will appear here as they are added.")}`;
}
function renderStore(id) {
  const store = findBySlug(data.stores, "name", id);
  if (!store) { app.innerHTML = `<h1>Store not found</h1><p><a href="#/stores">Browse all stores</a></p>`; return; }
  const brands = (store.brands || []).map(id => data.brands.find(brand => brand.id === id)).filter(Boolean);
  const launches = data.launches.filter(item => (item.stockists || []).includes(store.id));
  const storeUrl = safeExternalUrl(store.url);
  app.innerHTML = `<p><a href="#/stores">All stores</a></p><h1>${esc(store.name)}</h1>
    ${storeUrl ? `<p><a href="${storeUrl}" target="_blank" rel="noopener noreferrer">Visit store website</a></p>` : ""}
    <h2>Brands carried</h2>${brands.length ? `<ul>${brands.map(brand => `<li><a href="${href("brands", brand.name)}">${esc(brand.name)}</a></li>`).join("")}</ul>` : empty("No brands are listed for this store yet.")}
    <h2>Recent launches</h2><section class="grid">${launches.length ? launches.map(launchCard).join("") : empty("No recent launches are listed for this store yet.")}</section>`;
}

window.addEventListener("hashchange", render);
fetch("./data.json", { cache: "no-cache" }).then(response => {
  if (!response.ok) throw new Error("Unable to load site data");
  return response.json();
}).then(siteData => { data = siteData; render(); }).catch(() => {
  app.innerHTML = "<h1>Site data could not be loaded</h1><p>Please refresh the page later.</p>";
});
