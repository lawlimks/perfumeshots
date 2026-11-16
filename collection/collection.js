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

function entryStatus(entry) {
  if (entry.status === "backup") return { label: "Backup", description: "Backup bottle" };
  if (entry.status === "used" || /^x(?=[A-Z])/.test(String(entry.text || ""))) {
    return { label: "No longer owned", description: "Used up or given away" };
  }
  return null;
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
    const state = entryStatus(entry);
    const format = String(entry.format || "");
    const searchableText = [text, state?.label || "", state?.description || "", format].join(" ").toLocaleLowerCase();
    return (selectedLetter === "all" || letter === selectedLetter) &&
      (!query || searchableText.includes(query));
  });
  results.replaceChildren(...shown.map(entry => {
    const item = document.createElement("li");
    item.className = "collection-item";

    const text = document.createElement("span");
    text.className = "collection-text";
    text.textContent = entryText(entry);
    item.append(text);

    const labels = [];
    const entryState = entryStatus(entry);
    if (entryState) labels.push({ label: entryState.label, description: entryState.description });
    if (entry.format) {
      const format = String(entry.format);
      labels.push({
        label: format.replace(/\\b\\w/g, character => character.toUpperCase()),
        description: format
      });
    }
    labels.forEach(entryLabel => {
      const badge = document.createElement("span");
      badge.className = "collection-status";
      badge.textContent = entryLabel.label;
      badge.setAttribute("aria-label", entryLabel.description);
      item.append(badge);
    });

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
