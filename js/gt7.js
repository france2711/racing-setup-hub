const state = {
  data: null,
  selectedClass: "all",
  manufacturer: null,
  carId: null,
  track: null,
  search: "",
  favorites: new Set(
    JSON.parse(localStorage.getItem("gt7-car-favorites") || "[]")
  ),
  view: "all",
  manufacturerFilter: "all",
  trackFilter: "all",
  drivetrainFilter: "all",
  sort: "name"
};

const $ = selector => document.querySelector(selector);

async function init() {
  const loadedCars = await DB.loadGT7();

  state.data = {
    classes: [...new Set(loadedCars.map(car => car.class))].sort(),
    cars: loadedCars
  };

  renderAdvancedFilters();
  sync();
  render();
}

function createStars(value = 0) {
  const rating = Math.max(
    0,
    Math.min(5, Number(value) || 0)
  );

  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderAdvancedFilters() {
  const manufacturerFilter = $("#manufacturerFilter");
  const trackFilter = $("#trackFilter");

  if (!manufacturerFilter || !trackFilter) {
    return;
  }

  const manufacturers = [
    ...new Set(
      state.data.cars.map(car => car.manufacturer)
    )
  ].sort();

  const tracks = [
    ...new Set(
      state.data.cars.flatMap(car =>
        car.setups.map(setup => setup.track)
      )
    )
  ].sort();

  manufacturerFilter.innerHTML =
    '<option value="all">Alle Hersteller</option>';

  manufacturers.forEach(manufacturer => {
    const option = document.createElement("option");

    option.value = manufacturer;
    option.textContent = manufacturer;

    manufacturerFilter.appendChild(option);
  });

  trackFilter.innerHTML =
    '<option value="all">Alle Strecken</option>';

  tracks.forEach(track => {
    const option = document.createElement("option");

    option.value = track;
    option.textContent = track;

    trackFilter.appendChild(option);
  });
}

function cars() {
  const query = state.search.toLowerCase().trim();

  const filtered = state.data.cars.filter(car => {
    const classMatches =
      state.selectedClass === "all" ||
      car.class === state.selectedClass;

    const favoriteMatches =
      state.view === "all" ||
      state.favorites.has(car.id);

    const manufacturerMatches =
      state.manufacturerFilter === "all" ||
      car.manufacturer === state.manufacturerFilter;

    const drivetrainMatches =
      state.drivetrainFilter === "all" ||
      car.drivetrain === state.drivetrainFilter;

    const trackMatches =
      state.trackFilter === "all" ||
      car.setups.some(setup =>
        setup.track === state.trackFilter
      );

    const searchableText = `
      ${car.manufacturer}
      ${car.name}
      ${car.class}
      ${car.drivetrain || ""}
      ${car.setups.map(setup => setup.track).join(" ")}
    `.toLowerCase();

    const searchMatches =
      !query || searchableText.includes(query);

    return (
      classMatches &&
      favoriteMatches &&
      manufacturerMatches &&
      drivetrainMatches &&
      trackMatches &&
      searchMatches
    );
  });

  filtered.sort((a, b) => {
    if (state.sort === "manufacturer") {
      return a.manufacturer.localeCompare(b.manufacturer);
    }

    if (state.sort === "grip") {
      return (
        (b.ratings?.grip || 0) -
        (a.ratings?.grip || 0)
      );
    }

    if (state.sort === "controller") {
      return (
        (b.ratings?.controller || 0) -
        (a.ratings?.controller || 0)
      );
    }

    return a.name.localeCompare(b.name);
  });

  return filtered;
}

function sync() {
  const filteredCars = cars();

  const manufacturers = [
    ...new Set(
      filteredCars.map(car => car.manufacturer)
    )
  ].sort();

  if (!manufacturers.includes(state.manufacturer)) {
    state.manufacturer = manufacturers[0] || null;
  }

  const manufacturerCars = filteredCars.filter(
    car => car.manufacturer === state.manufacturer
  );

  if (
    !manufacturerCars.some(
      car => car.id === state.carId
    )
  ) {
    state.carId = manufacturerCars[0]?.id || null;
  }

  const selectedCar = state.data.cars.find(
    car => car.id === state.carId
  );

  if (
    !selectedCar?.setups.some(
      setup => setup.track === state.track
    )
  ) {
    state.track = selectedCar?.setups[0]?.track || null;
  }
}

function renderStats() {
  $("#carCount").textContent =
    state.data.cars.length;

  $("#setupCount").textContent =
    state.data.cars.reduce(
      (total, car) => total + car.setups.length,
      0
    );

  $("#manufacturerCount").textContent =
    new Set(
      state.data.cars.map(car => car.manufacturer)
    ).size;

  $("#favoriteCount").textContent =
    state.favorites.size;
}

function renderClasses() {
  const box = $("#classTabs");

  box.innerHTML = "";

  ["all", ...state.data.classes].forEach(className => {
    const button = document.createElement("button");

    button.className =
      `tab ${
        state.selectedClass === className
          ? "active"
          : ""
      }`;

    button.textContent =
      className === "all"
        ? "Alle Klassen"
        : className;

    button.onclick = () => {
      state.selectedClass = className;
      state.manufacturer = null;
      state.carId = null;
      state.track = null;

      sync();
      render();
    };

    box.appendChild(button);
  });
}

function renderManufacturers() {
  const box = $("#manufacturerList");

  box.innerHTML = "";

  const manufacturers = [
    ...new Set(
      cars().map(car => car.manufacturer)
    )
  ].sort();

  manufacturers.forEach(manufacturer => {
    const button = document.createElement("button");

    button.className =
      `db-btn ${
        state.manufacturer === manufacturer
          ? "active"
          : ""
      }`;

    button.textContent = manufacturer;

    button.onclick = () => {
      state.manufacturer = manufacturer;
      state.carId = null;
      state.track = null;

      sync();
      render();
    };

    box.appendChild(button);
  });

  if (!manufacturers.length) {
    box.textContent = "Keine Hersteller gefunden.";
  }
}

function renderCars() {
  const box = $("#carList");

  box.innerHTML = "";

  const filteredCars = cars().filter(
    car => car.manufacturer === state.manufacturer
  );

  filteredCars.forEach(car => {
    const button = document.createElement("button");

    button.className =
      `db-btn ${
        state.carId === car.id
          ? "active"
          : ""
      }`;

    button.textContent =
      `${state.favorites.has(car.id) ? "★ " : ""}${car.name}`;

    button.onclick = () => {
      state.carId = car.id;
      state.track = car.setups[0]?.track || null;

      render();
    };

    box.appendChild(button);
  });

  if (!filteredCars.length) {
    box.textContent = "Keine Fahrzeuge gefunden.";
  }
}function getSetupOverrideKey(carId, track) {
  return `gt7-setup-edit-${carId}-${track}`;
}

function getSetupOverride(carId, track) {
  const saved = localStorage.getItem(
    getSetupOverrideKey(carId, track)
  );

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getDisplayedSetup(car, originalSetup) {
  const override = getSetupOverride(
    car.id,
    originalSetup.track
  );

  return override
    ? { ...originalSetup, ...override }
    : originalSetup;
}

function fillSetupEditor(setup) {
  $("#editBrakeBalance").value =
    setup.brakeBalance ?? 0;

  $("#editTcs").value =
    setup.tcs ?? 0;

  $("#editTires").value =
    setup.tires || "";

  $("#editAbs").value =
    setup.abs || "Standard";

  $("#editAsm").value =
    setup.asm || "Aus";

  $("#editTip").value =
    setup.tip || "";
}

function renderDetails()
 {function getSetupOverrideKey(carId, track) {
  return `gt7-setup-edit-${carId}-${track}`;
}

function getSetupOverride(carId, track) {
  const saved = localStorage.getItem(
    getSetupOverrideKey(carId, track)
  );

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getDisplayedSetup(car, originalSetup) {
  const override = getSetupOverride(
    car.id,
    originalSetup.track
  );

  return override
    ? { ...originalSetup, ...override }
    : originalSetup;
}

function fillSetupEditor(setup) {
  $("#editBrakeBalance").value =
    setup.brakeBalance ?? 0;

  $("#editTcs").value =
    setup.tcs ?? 0;

  $("#editTires").value =
    setup.tires || "";

  $("#editAbs").value =
    setup.abs || "Standard";

  $("#editAsm").value =
    setup.asm || "Aus";

  $("#editTip").value =
    setup.tip || "";
}
  const car = state.data.cars.find(
    item => item.id === state.carId
  );

  if (!car) {
    $("#details").hidden = true;
    $("#detailsEmpty").hidden = false;

    return;
  }

  $("#details").hidden = false;
  $("#detailsEmpty").hidden = true;

  $("#carClass").textContent = car.class;
  $("#carName").textContent = car.name;
  $("#carManufacturer").textContent =
    car.manufacturer;

  const logo = $("#manufacturerLogo");

  if (logo) {
    logo.src = getLogo(car.manufacturer);
    logo.alt = `${car.manufacturer} Logo`;

    logo.onerror = () => {
      logo.src =
        "../assets/images/logos/placeholder.webp";
    };
  }

  const carImage = $("#carImage");

  if (carImage) {
    carImage.src = getCarImage(car);
    carImage.alt = car.name;

    carImage.onerror = () => {
      carImage.src =
        "../assets/images/cars/placeholder.webp";
    };
  }

  const drivetrain = $("#carDrivetrain");
  const power = $("#carPower");
  const weight = $("#carWeight");
  const year = $("#carYear");

  if (drivetrain) {
    drivetrain.textContent =
      car.drivetrain || "Nicht eingetragen";
  }

  if (power) {
    power.textContent = car.power
      ? `${car.power} PS`
      : "Nicht eingetragen";
  }

  if (weight) {
    weight.textContent = car.weight
      ? `${car.weight.toLocaleString("de-DE")} kg`
      : "Nicht eingetragen";
  }

  if (year) {
    year.textContent =
      car.year || "Nicht eingetragen";
  }

  if ($("#ratingGrip")) {
    $("#ratingGrip").textContent =
      createStars(car.ratings?.grip);
  }

  if ($("#ratingStability")) {
    $("#ratingStability").textContent =
      createStars(car.ratings?.stability);
  }

  if ($("#ratingController")) {
    $("#ratingController").textContent =
      createStars(car.ratings?.controller);
  }

  if ($("#ratingTireWear")) {
    $("#ratingTireWear").textContent =
      createStars(car.ratings?.tireWear);
  }

  $("#favoriteCar").textContent =
    state.favorites.has(car.id) ? "★" : "☆";

  const trackTabs = $("#trackTabs");

  trackTabs.innerHTML = "";

  car.setups.forEach(setup => {
    const button = document.createElement("button");

    button.className =
      `track-tab ${
        state.track === setup.track
          ? "active"
          : ""
      }`;

    button.textContent = setup.track;

    button.onclick = () => {
      state.track = setup.track;
      renderDetails();
    };

    trackTabs.appendChild(button);
  });

  const setup = car.setups.find(
    item => item.track === state.track
  );

  if (!setup) {
    $("#setupDetails").innerHTML =
      "<p>Kein Setup für diese Strecke vorhanden.</p>";

    return;
  }
const displayedSetup =
  getDisplayedSetup(car, setup);
 $("#selectedTrackName").textContent =
  displayedSetup.track;

$("#setupDetails").innerHTML = `
  <div class="setup-row">
    <strong>Bremsbalance</strong>
    <span>${displayedSetup.brakeBalance}</span>
  </div>

  <div class="setup-row">
    <strong>TKS</strong>
    <span>${displayedSetup.tcs}</span>
  </div>

  <div class="setup-row">
    <strong>Reifen</strong>
    <span>${displayedSetup.tires}</span>
  </div>

  <div class="setup-row">
    <strong>ABS</strong>
    <span>${displayedSetup.abs || "Standard"}</span>
  </div>

  <div class="setup-row">
    <strong>ASM</strong>
    <span>${displayedSetup.asm || "Aus"}</span>
  </div>

  <p>${displayedSetup.tip || ""}</p>
`;

$("#setupStability").textContent =
  createStars(displayedSetup.ratings?.stability);

$("#setupTurnIn").textContent =
  createStars(displayedSetup.ratings?.turnIn);

$("#setupTraction").textContent =
  createStars(displayedSetup.ratings?.traction);

$("#setupTireWear").textContent =
  createStars(displayedSetup.ratings?.tireWear);
  const noteKey =
  `gt7-note-${car.id}-${displayedSetup.track}`;
 
  fillSetupEditor(displayedSetup);


$("#setupNote").value =
  localStorage.getItem(noteKey) || "";

$("#setupNote").dataset.key = noteKey;
}
function render() {
  renderStats();
  renderClasses();
  renderManufacturers();
  renderCars();
  renderDetails();
}

function resetSelection() {
  state.manufacturer = null;
  state.carId = null;
  state.track = null;
  sync();
  render();
}

$("#searchInput").oninput = event => {
  state.search = event.target.value;
  resetSelection();
};

$("#viewFilter").onchange = event => {
  state.view = event.target.value;
  resetSelection();
};

$("#manufacturerFilter").onchange = event => {
  state.manufacturerFilter = event.target.value;
  resetSelection();
};

$("#trackFilter").onchange = event => {
  state.trackFilter = event.target.value;
  resetSelection();
};

$("#drivetrainFilter").onchange = event => {
  state.drivetrainFilter = event.target.value;
  resetSelection();
};

$("#sortFilter").onchange = event => {
  state.sort = event.target.value;
  resetSelection();
};

$("#favoriteCar").onclick = () => {
  const car = state.data?.cars.find(item => item.id === state.carId);
  if (!car) return;

  if (state.favorites.has(car.id)) {
    state.favorites.delete(car.id);
  } else {
    state.favorites.add(car.id);
  }

  localStorage.setItem(
    "gt7-car-favorites",
    JSON.stringify([...state.favorites])
  );

  render();
};

$("#saveNote").onclick = () => {
  const key = $("#setupNote").dataset.key;
  if (!key) return;

  localStorage.setItem(key, $("#setupNote").value);
  $("#noteStatus").textContent = "Notiz gespeichert.";

  setTimeout(() => {
    $("#noteStatus").textContent = "";
  }, 1600);
};

$("#exportButton").onclick = () => {
  const backup = {
    favorites: [...state.favorites],
    notes: {}
  };

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith("gt7-note-")) {
      backup.notes[key] = localStorage.getItem(key);
    }
  }

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "gt7-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
};
$("#toggleSetupEditor").onclick = () => {
  const editor = $("#setupEditor");

  editor.hidden = !editor.hidden;

  $("#toggleSetupEditor").textContent =
    editor.hidden
      ? "✏️ Setup bearbeiten"
      : "✖ Editor schließen";
};

$("#saveSetupEdit").onclick = () => {
  const car = state.data?.cars.find(
    item => item.id === state.carId
  );

  const originalSetup = car?.setups.find(
    item => item.track === state.track
  );

  if (!car || !originalSetup) {
    return;
  }

  const editedSetup = {
    brakeBalance:
      Number($("#editBrakeBalance").value),

    tcs:
      Number($("#editTcs").value),

    tires:
      $("#editTires").value.trim(),

    abs:
      $("#editAbs").value.trim(),

    asm:
      $("#editAsm").value.trim(),

    tip:
      $("#editTip").value.trim()
  };

  localStorage.setItem(
    getSetupOverrideKey(
      car.id,
      originalSetup.track
    ),
    JSON.stringify(editedSetup)
  );

  $("#setupEditorStatus").textContent =
    "Persönliches Setup gespeichert.";

  renderDetails();

  setTimeout(() => {
    $("#setupEditorStatus").textContent = "";
  }, 1800);
};

$("#resetSetupEdit").onclick = () => {
  const car = state.data?.cars.find(
    item => item.id === state.carId
  );

  const originalSetup = car?.setups.find(
    item => item.track === state.track
  );

  if (!car || !originalSetup) {
    return;
  }

  localStorage.removeItem(
    getSetupOverrideKey(
      car.id,
      originalSetup.track
    )
  );

  $("#setupEditorStatus").textContent =
    "Original-Setup wiederhergestellt.";

  renderDetails();

  setTimeout(() => {
    $("#setupEditorStatus").textContent = "";
  }, 1800);
};
init().catch(error => {
  $("#detailsEmpty").textContent =
    "GT7-Daten konnten nicht geladen werden.";
  console.error(error);
});
