const state = {
  data: null,
  selectedClass: "all",
  selectedManufacturer: null,
  selectedCarId: null,
  selectedTrack: null,
  search: ""
};

const classFilters = document.querySelector("#classFilters");
const manufacturerList = document.querySelector("#manufacturerList");
const carList = document.querySelector("#carList");
const details = document.querySelector("#details");
const detailsEmpty = document.querySelector("#detailsEmpty");
const trackTabs = document.querySelector("#trackTabs");
const setupDetails = document.querySelector("#setupDetails");
const setupNote = document.querySelector("#setupNote");
const noteStatus = document.querySelector("#noteStatus");

async function init() {
  const response = await fetch("../data/gt7-data.json");
  state.data = await response.json();
  renderClassFilters();
  syncSelection();
  renderAll();
}

function filteredCars() {
  const q = state.search.trim().toLowerCase();

  return state.data.cars.filter(car => {
    const matchesClass = state.selectedClass === "all" || car.class === state.selectedClass;
    const searchable = `${car.manufacturer} ${car.name} ${car.setups.map(s => s.track).join(" ")}`.toLowerCase();
    return matchesClass && (!q || searchable.includes(q));
  });
}

function syncSelection() {
  const cars = filteredCars();
  const manufacturers = [...new Set(cars.map(c => c.manufacturer))].sort();

  if (!manufacturers.includes(state.selectedManufacturer)) {
    state.selectedManufacturer = manufacturers[0] || null;
  }

  const manufacturerCars = cars.filter(c => c.manufacturer === state.selectedManufacturer);

  if (!manufacturerCars.some(c => c.id === state.selectedCarId)) {
    state.selectedCarId = manufacturerCars[0]?.id || null;
  }

  const car = state.data.cars.find(c => c.id === state.selectedCarId);

  if (!car || !car.setups.some(s => s.track === state.selectedTrack)) {
    state.selectedTrack = car?.setups[0]?.track || null;
  }
}

function renderClassFilters() {
  classFilters.innerHTML = "";

  ["all", ...state.data.classes].forEach(className => {
    const button = document.createElement("button");
    button.className = `filter-btn ${state.selectedClass === className ? "active" : ""}`;
    button.textContent = className === "all" ? "Alle Klassen" : className;

    button.addEventListener("click", () => {
      state.selectedClass = className;
      state.selectedManufacturer = null;
      state.selectedCarId = null;
      state.selectedTrack = null;
      syncSelection();
      renderAll();
    });

    classFilters.appendChild(button);
  });
}

function renderManufacturers() {
  manufacturerList.innerHTML = "";
  const manufacturers = [...new Set(filteredCars().map(c => c.manufacturer))].sort();

  manufacturers.forEach(name => {
    const button = document.createElement("button");
    button.className = `list-btn ${state.selectedManufacturer === name ? "active" : ""}`;
    button.textContent = name;

    button.addEventListener("click", () => {
      state.selectedManufacturer = name;
      state.selectedCarId = null;
      state.selectedTrack = null;
      syncSelection();
      renderAll();
    });

    manufacturerList.appendChild(button);
  });

  if (!manufacturers.length) manufacturerList.textContent = "Keine Hersteller gefunden.";
}

function renderCars() {
  carList.innerHTML = "";
  const cars = filteredCars().filter(c => c.manufacturer === state.selectedManufacturer);

  cars.forEach(car => {
    const button = document.createElement("button");
    button.className = `list-btn ${state.selectedCarId === car.id ? "active" : ""}`;
    button.textContent = car.name;

    button.addEventListener("click", () => {
      state.selectedCarId = car.id;
      state.selectedTrack = car.setups[0]?.track || null;
      renderAll();
    });

    carList.appendChild(button);
  });

  if (!cars.length) carList.textContent = "Keine Fahrzeuge gefunden.";
}

function renderDetails() {
  const car = state.data.cars.find(c => c.id === state.selectedCarId);

  if (!car) {
    details.hidden = true;
    detailsEmpty.hidden = false;
    return;
  }

  details.hidden = false;
  detailsEmpty.hidden = true;

  document.querySelector("#carClass").textContent = car.class;
  document.querySelector("#carName").textContent = car.name;
  document.querySelector("#carManufacturer").textContent = car.manufacturer;

  trackTabs.innerHTML = "";

  car.setups.forEach(setup => {
    const button = document.createElement("button");
    button.className = `track-btn ${state.selectedTrack === setup.track ? "active" : ""}`;
    button.textContent = setup.track;

    button.addEventListener("click", () => {
      state.selectedTrack = setup.track;
      renderDetails();
    });

    trackTabs.appendChild(button);
  });

  const setup = car.setups.find(s => s.track === state.selectedTrack);

  setupDetails.innerHTML = `
    <div class="setup-row"><strong>Bremsbalance</strong><span>${setup.brakeBalance}</span></div>
    <div class="setup-row"><strong>TKS</strong><span>${setup.tcs}</span></div>
    <div class="setup-row"><strong>Reifen</strong><span>${setup.tires}</span></div>
    <p>${setup.tip}</p>
  `;

  const noteKey = `gt7-note-${car.id}-${setup.track}`;
  setupNote.value = localStorage.getItem(noteKey) || "";
  setupNote.dataset.noteKey = noteKey;
}

function renderAll() {
  renderClassFilters();
  renderManufacturers();
  renderCars();
  renderDetails();
}

document.querySelector("#searchInput").addEventListener("input", event => {
  state.search = event.target.value;
  state.selectedManufacturer = null;
  state.selectedCarId = null;
  state.selectedTrack = null;
  syncSelection();
  renderAll();
});

document.querySelector("#saveNote").addEventListener("click", () => {
  if (!setupNote.dataset.noteKey) return;

  localStorage.setItem(setupNote.dataset.noteKey, setupNote.value);
  noteStatus.textContent = "Notiz gespeichert.";
  setTimeout(() => noteStatus.textContent = "", 1600);
});

init().catch(error => {
  console.error(error);
  detailsEmpty.textContent = "Die GT7-Daten konnten nicht geladen werden.";
});
