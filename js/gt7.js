let gt7Setups = [];

const gt7State = {
  selectedClass: "all",
  selectedTrack: "all",
  searchText: "",
  favorites: new Set(
    JSON.parse(localStorage.getItem("gt7-favorites") || "[]")
  )
};

const carList = document.querySelector("#carList");
const searchInput = document.querySelector("#gt7Search");
const trackFilter = document.querySelector("#trackFilter");
const noResults = document.querySelector("#noResults");

async function loadGT7Data() {
  try {
    const response = await fetch("../data/gt7-data.json");

    if (!response.ok) {
      throw new Error("GT7-Daten konnten nicht geladen werden.");
    }

    gt7Setups = await response.json();

    createTrackOptions();
    renderGT7Setups();
  } catch (error) {
    console.error(error);

    noResults.style.display = "block";
    noResults.textContent =
      "Die GT7-Daten konnten nicht geladen werden.";
  }
}

function createTrackOptions() {
  const tracks = [...new Set(gt7Setups.map(setup => setup.track))]
    .sort((a, b) => a.localeCompare(b));

  tracks.forEach(track => {
    const option = document.createElement("option");

    option.value = track;
    option.textContent = track;

    trackFilter.appendChild(option);
  });
}

function renderGT7Setups() {
  carList.innerHTML = "";

  const search = gt7State.searchText.toLowerCase().trim();

  const filteredSetups = gt7Setups.filter(setup => {
    const matchesClass =
      gt7State.selectedClass === "all" ||
      setup.class === gt7State.selectedClass;

    const matchesTrack =
      gt7State.selectedTrack === "all" ||
      setup.track === gt7State.selectedTrack;

    const searchableText = `
      ${setup.class}
      ${setup.manufacturer}
      ${setup.car}
      ${setup.track}
    `.toLowerCase();

    const matchesSearch =
      search === "" || searchableText.includes(search);

    return matchesClass && matchesTrack && matchesSearch;
  });

  noResults.style.display =
    filteredSetups.length === 0 ? "block" : "none";

  filteredSetups.forEach(setup => {
    const card = document.createElement("article");

    card.className = "car-card";

    const isFavorite = gt7State.favorites.has(setup.id);

    card.innerHTML = `
      <span class="mini-badge">
        ${setup.class}
      </span>

      <h3>${setup.car}</h3>

      <p>
        ${setup.manufacturer} · ${setup.track}
      </p>

      <div class="setup-box">
        <div>
          <strong>Bremsbalance:</strong>
          ${setup.brakeBalance}
        </div>

        <div>
          <strong>TKS:</strong>
          ${setup.tcs}
        </div>

        <div>
          <strong>Reifen:</strong>
          ${setup.tires}
        </div>
      </div>

      <p>
        ${setup.tip}
      </p>

      <button
        class="favorite-button"
        data-id="${setup.id}"
      >
        ${isFavorite ? "★ Favorit" : "☆ Favorit hinzufügen"}
      </button>
    `;

    carList.appendChild(card);
  });

  activateFavoriteButtons();
}

function activateFavoriteButtons() {
  document
    .querySelectorAll(".favorite-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        const setupId = button.dataset.id;

        if (gt7State.favorites.has(setupId)) {
          gt7State.favorites.delete(setupId);
        } else {
          gt7State.favorites.add(setupId);
        }

        localStorage.setItem(
          "gt7-favorites",
          JSON.stringify([...gt7State.favorites])
        );

        renderGT7Setups();
      });
    });
}

searchInput.addEventListener("input", event => {
  gt7State.searchText = event.target.value;

  renderGT7Setups();
});

trackFilter.addEventListener("change", event => {
  gt7State.selectedTrack = event.target.value;

  renderGT7Setups();
});

document
  .querySelectorAll(".class-button")
  .forEach(button => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".class-button")
        .forEach(item => item.classList.remove("active"));

      button.classList.add("active");

      gt7State.selectedClass = button.dataset.class;

      renderGT7Setups();
    });
  });

loadGT7Data();