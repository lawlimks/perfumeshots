const search = document.querySelector("#collection-search");
const filters = document.querySelector("#letter-filters");
const results = document.querySelector("#collection-results");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
let entries = [];
let selectedLetter = "all";

function entryText(entry) {
  const text = String(entry.text || "");
  // The legacy lowercase x means a fragrance is no longer owned.
  return text.replace(/^x(?=[A-Z])/, "");
}

function isNoLongerOwned(entry) {
  return entry.status === "used" || /^x(?=[A-Z])/.test(String(entry.text || ""));
}

function renderFilters() {
  const letters = ["all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  filters.replaceChildren(...letters.map(letter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-filter";
    button.dataset.letter = letter;
    button.textContent = letter === "all" ? "All" : letter;
    button.setAttribute("aria-pressed", String(selectedLetter === letter));
    button.addEventListener("click", () => {
      selectedLetter = letter;
      renderFilters();
      renderResults();
    });
    return button;
  }));
}

function renderResults() {
  const query = search.value.trim().toLocaleLowerCase();
  const shown = entries.filter(entry => {
    const text = entryText(entry);
    const letter = String(entry.letter || text.charAt(0)).toUpperCase();
    return (selectedLetter === "all" || letter === selectedLetter) &&
      (!query || text.toLocaleLowerCase().includes(query));
  });
  results.replaceChildren(...shown.map(entry => {
    const item = document.createElement("li");
    item.className = "collection-item";

    const text = document.createElement("span");
    text.className = "collection-text";
    text.textContent = entryText(entry);
    item.append(text);

    if (isNoLongerOwned(entry)) {
      const status = document.createElement("span");
      status.className = "collection-status";
      status.textContent = "No longer owned";
      status.setAttribute("aria-label", "Used up or given away");
      item.append(status);
    }

    return item;
  }));
  count.textContent = `${shown.length} ${shown.length === 1 ? "fragrance" : "fragrances"}`;
  empty.hidden = shown.length !== 0;
}

search.addEventListener("input", renderResults);
renderFilters();
fetch("/collection/api/data", { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error("Collection data could not be loaded.");
    return response.json();
  })
  .then(data => {
    entries = Array.isArray(data.entries) ? data.entries : [];
    renderResults();
  })
  .catch(() => {
    count.textContent = "Collection data could not be loaded.";
    empty.hidden = false;
    empty.textContent = "The private collection file is not available yet.";
  });
