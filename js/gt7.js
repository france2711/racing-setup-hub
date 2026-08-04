let gt7Setups = [];

const gt7State = {
  selectedClass: "all",
  selectedTrack: "all",
  searchText: "",
  onlyFavorites: false,
  favorites: new Set(JSON.parse(localStorage.getItem("gt7-favorites") || "[]"))
};

const carList = document.querySelector("#carList");
const searchInput = document.querySelector("#gt7Search");
const trackFilter = document.querySelector("#trackFilter");
const noResults = document.querySelector("#noResults");
const favoriteFilter = document.querySelector("#favoriteFilter");
const resultSummary = document.querySelector("#resultSummary");

async function loadGT7Data() {
  try {
    const response = await fetch("../data/gt7-data.json");
    if (!response.ok) throw new Error("GT7-Daten konnten nicht geladen werden.");
    gt7Setups = await response.json();
    createTrackOptions();
    renderGT7Setups();
  } catch (error) {
    console.error(error);
    noResults.style.display = "block";
    noResults.textContent = "Die GT7-Daten konnten nicht geladen werden.";
  }
}

function createTrackOptions() {
  trackFilter.innerHTML = '<option value="all">Alle Strecken</option>';
  [...new Set(gt7Setups.map(setup => setup.track))]
    .sort((a,b) => a.localeCompare(b))
    .forEach(track => {
      const option = document.createElement("option");
      option.value = track;
      option.textContent = track;
      trackFilter.appendChild(option);
    });
}

function getFilteredSetups() {
  const search = gt7State.searchText.toLowerCase().trim();
  return gt7Setups.filter(setup => {
    const matchesClass = gt7State.selectedClass === "all" || setup.class === gt7State.selectedClass;
    const matchesTrack = gt7State.selectedTrack === "all" || setup.track === gt7State.selectedTrack;
    const searchableText = `${setup.class} ${setup.manufacturer} ${setup.car} ${setup.track}`.toLowerCase();
    const matchesSearch = search === "" || searchableText.includes(search);
    const matchesFavorite = !gt7State.onlyFavorites || gt7State.favorites.has(setup.id);
    return matchesClass && matchesTrack && matchesSearch && matchesFavorite;
  });
}

function renderGT7Setups() {
  carList.innerHTML = "";
  const filteredSetups = getFilteredSetups();

  resultSummary.textContent = `${filteredSetups.length} von ${gt7Setups.length} Setups angezeigt`;
  noResults.style.display = filteredSetups.length === 0 ? "block" : "none";

  filteredSetups.forEach(setup => {
    const card = document.createElement("article");
    card.className = "car-card";
    const isFavorite = gt7State.favorites.has(setup.id);
    const noteKey = `gt7-note-${setup.id}`;
    const savedNote = localStorage.getItem(noteKey) || "";

    card.innerHTML = `
      <span class="mini-badge">${setup.class}</span>
      <h3>${setup.car}</h3>
      <p class="meta">${setup.manufacturer} · ${setup.track}</p>
      <div class="setup-box">
        <div><strong>Bremsbalance:</strong> ${setup.brakeBalance}</div>
        <div><strong>TKS:</strong> ${setup.tcs}</div>
        <div><strong>Reifen:</strong> ${setup.tires}</div>
      </div>
      <p class="tip">${setup.tip}</p>
      <button class="favorite-button" data-id="${setup.id}">
        ${isFavorite ? "★ Favorit" : "☆ Favorit hinzufügen"}
      </button>
      <textarea class="note-box" data-note-id="${setup.id}" placeholder="Eigene Notiz zu diesem Setup …">${savedNote}</textarea>
      <button class="save-note-button" data-note-id="${setup.id}">Notiz speichern</button>
      <p class="note-status" data-status-id="${setup.id}"></p>
    `;
    carList.appendChild(card);
  });

  activateFavoriteButtons();
  activateNoteButtons();
}

function activateFavoriteButtons() {
  document.querySelectorAll(".favorite-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      gt7State.favorites.has(id) ? gt7State.favorites.delete(id) : gt7State.favorites.add(id);
      localStorage.setItem("gt7-favorites", JSON.stringify([...gt7State.favorites]));
      renderGT7Setups();
    });
  });
}

function activateNoteButtons() {
  document.querySelectorAll(".save-note-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.noteId;
      const textarea = document.querySelector(`textarea[data-note-id="${id}"]`);
      const status = document.querySelector(`[data-status-id="${id}"]`);
      localStorage.setItem(`gt7-note-${id}`, textarea.value);
      status.textContent = "Notiz gespeichert.";
      setTimeout(() => status.textContent = "", 1600);
    });
  });
}

searchInput.addEventListener("input", e => {
  gt7State.searchText = e.target.value;
  renderGT7Setups();
});

trackFilter.addEventListener("change", e => {
  gt7State.selectedTrack = e.target.value;
  renderGT7Setups();
});

document.querySelectorAll(".class-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".class-button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    gt7State.selectedClass = button.dataset.class;
    renderGT7Setups();
  });
});

favoriteFilter.addEventListener("click", () => {
  gt7State.onlyFavorites = !gt7State.onlyFavorites;
  favoriteFilter.classList.toggle("active", gt7State.onlyFavorites);
  favoriteFilter.textContent = gt7State.onlyFavorites ? "★ Alle anzeigen" : "☆ Nur Favoriten";
  renderGT7Setups();
});

loadGT7Data();
