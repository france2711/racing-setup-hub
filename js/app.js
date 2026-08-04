const searchInput = document.querySelector("#dashboardSearch");
const clearSearch = document.querySelector("#clearSearch");
const cards = [...document.querySelectorAll(".game-card")];
const emptyState = document.querySelector("#emptyState");
const resultText = document.querySelector("#resultText");
const notes = document.querySelector("#dashboardNotes");
const saveStatus = document.querySelector("#saveStatus");

function renderSearch() {
  const query = searchInput.value.toLowerCase().trim();
  let visible = 0;

  cards.forEach(card => {
    const matches = !query || card.dataset.search.includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });

  emptyState.hidden = visible > 0;
  resultText.textContent = `${visible} ${visible === 1 ? "Bereich" : "Bereiche"}`;
}

function updateStats() {
  let favorites = 0;
  let savedNotes = 0;

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key) continue;

    if (key.includes("favorite")) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(value)) favorites += value.length;
      } catch {}
    }

    if (key.includes("note") && localStorage.getItem(key)?.trim()) {
      savedNotes++;
    }
  }

  document.querySelector("#favoriteCount").textContent = favorites;
  document.querySelector("#noteCount").textContent = savedNotes;
}

searchInput.addEventListener("input", renderSearch);

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderSearch();
  searchInput.focus();
});

document.querySelector("#scrollGames").addEventListener("click", () => {
  document.querySelector("#gamesSection").scrollIntoView({behavior:"smooth"});
});

notes.value = localStorage.getItem("rsh-dashboard-notes") || "";

document.querySelector("#saveDashboardNotes").addEventListener("click", () => {
  localStorage.setItem("rsh-dashboard-notes", notes.value);
  saveStatus.textContent = "Notizen gespeichert.";
  updateStats();
  setTimeout(() => saveStatus.textContent = "", 1700);
});

document.querySelector("#refreshStats").addEventListener("click", updateStats);

const savedTheme = localStorage.getItem("rsh-theme");
if (savedTheme === "light") document.body.classList.add("light-mode");

document.querySelector("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "rsh-theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});

renderSearch();
updateStats();
