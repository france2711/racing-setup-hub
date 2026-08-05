const state = {
  data: null,
  selectedClass: "all",
  manufacturer: null,
  carId: null,
  track: null,
  trackSearch: "",
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
  const [loadedCars, setupTemplates] = await Promise.all([
    DB.loadGT7(),
    DB.loadSetupTemplates()
  ]);

  const resolvedCars = DB.applySetupTemplates(
    loadedCars,
    setupTemplates
  );

  state.data = {
    classes: [...new Set(resolvedCars.map(car => car.class))].sort(),
    cars: resolvedCars,
    setupTemplates
  };

  renderAdvancedFilters();
  initializeRaceCenter();
  initializeComparison();
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
}

function getSetupOverrideKey(carId, track) {
  return `gt7-setup-edit-${carId}-${track}`;
}

function getSetupOverride(carId, track) {
  const saved = localStorage.getItem(
    getSetupOverrideKey(carId, track)
  );

  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getDisplayedSetup(car, originalSetup) {
  const override = getSetupOverride(car.id, originalSetup.track);

  if (!override) {
    return originalSetup;
  }

  return {
    ...originalSetup,
    ...override,
    ratings: {
      ...(originalSetup.ratings || {}),
      ...(override.ratings || {})
    },
    setupOrigin: "personal",
    setupOriginLabel: `Persönliche Anpassung auf ${originalSetup.setupOriginLabel || car.class + "-Basis"}`
  };
}

function fillSetupEditor(setup) {
  const brake = $("#editBrakeBalance");
  if (!brake) return;

  brake.value = setup.brakeBalance ?? 0;
  $("#editTcs").value = setup.tcs ?? 0;
  $("#editTires").value = setup.tires || "";
  $("#editAbs").value = setup.abs || "Standard";
  $("#editAsm").value = setup.asm || "Aus";
  $("#editTip").value = setup.tip || "";
}

function renderDetails() {
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
  const trackResultCount = $("#trackResultCount");

  trackTabs.innerHTML = "";

  const trackQuery = state.trackSearch.toLowerCase().trim();
  const visibleSetups = car.setups.filter(setup =>
    setup.track.toLowerCase().includes(trackQuery)
  );

  if (trackResultCount) {
    trackResultCount.textContent = trackQuery
      ? `${visibleSetups.length} von ${car.setups.length} Strecken gefunden`
      : `${car.setups.length} Strecken verfügbar`;
  }

  visibleSetups.forEach(setup => {
    const button = document.createElement("button");

    button.className =
      `track-tab ${state.track === setup.track ? "active" : ""}`;

    button.textContent = setup.track;

    button.onclick = () => {
      state.track = setup.track;
      renderDetails();
    };

    trackTabs.appendChild(button);
  });

  if (!visibleSetups.length) {
    const message = document.createElement("div");
    message.className = "track-no-results";
    message.textContent = "Keine passende Strecke gefunden.";
    trackTabs.appendChild(message);
  }

  const setup = car.setups.find(
    item => item.track === state.track
  );

  if (!setup) {
    $("#setupDetails").innerHTML =
      "<p>Kein Setup für diese Strecke vorhanden.</p>";
    return;
  }

  const displayedSetup = getDisplayedSetup(car, setup);

  $("#selectedTrackName").textContent = displayedSetup.track;

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
    <div class="setup-row setup-source-row">
      <strong>Quelle</strong>
      <span>${displayedSetup.setupOriginLabel || displayedSetup.source || "Fahrzeug-Setup"}</span>
    </div>
    ${displayedSetup.changedFields?.length ? `
      <div class="setup-source-details">
        Angepasst: ${displayedSetup.changedFields
          .map(field => ({
            brakeBalance: "Bremsbalance",
            tcs: "TKS",
            tires: "Reifen",
            abs: "ABS",
            asm: "ASM",
            tip: "Tipp",
            "ratings.stability": "Stabilität",
            "ratings.turnIn": "Einlenken",
            "ratings.traction": "Traktion",
            "ratings.tireWear": "Reifenverschleiß"
          }[field] || field))
          .join(", ")}
      </div>
    ` : ""}
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

  fillSetupEditor(displayedSetup);

  const noteKey = `gt7-note-${car.id}-${displayedSetup.track}`;
  $("#setupNote").value = localStorage.getItem(noteKey) || "";
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

const trackSearchInput = $("#trackSearchInput");
const clearTrackSearchButton = $("#clearTrackSearch");

trackSearchInput?.addEventListener("input", event => {
  state.trackSearch = event.target.value;
  renderDetails();
});

clearTrackSearchButton?.addEventListener("click", () => {
  state.trackSearch = "";
  if (trackSearchInput) {
    trackSearchInput.value = "";
    trackSearchInput.focus();
  }
  renderDetails();
});

$("#toggleSetupEditor")?.addEventListener("click", () => {
  const editor = $("#setupEditor");
  editor.hidden = !editor.hidden;
  $("#toggleSetupEditor").textContent = editor.hidden
    ? "✏️ Setup bearbeiten"
    : "✖ Editor schließen";
});

$("#saveSetupEdit")?.addEventListener("click", () => {
  const car = state.data?.cars.find(item => item.id === state.carId);
  const originalSetup = car?.setups.find(item => item.track === state.track);
  if (!car || !originalSetup) return;

  const editedSetup = {
    brakeBalance: Number($("#editBrakeBalance").value),
    tcs: Number($("#editTcs").value),
    tires: $("#editTires").value.trim(),
    abs: $("#editAbs").value.trim(),
    asm: $("#editAsm").value.trim(),
    tip: $("#editTip").value.trim()
  };

  localStorage.setItem(
    getSetupOverrideKey(car.id, originalSetup.track),
    JSON.stringify(editedSetup)
  );

  $("#setupEditorStatus").textContent = "Persönliches Setup gespeichert.";
  renderDetails();
});

$("#resetSetupEdit")?.addEventListener("click", () => {
  const car = state.data?.cars.find(item => item.id === state.carId);
  const originalSetup = car?.setups.find(item => item.track === state.track);
  if (!car || !originalSetup) return;

  localStorage.removeItem(
    getSetupOverrideKey(car.id, originalSetup.track)
  );

  $("#setupEditorStatus").textContent = "Original-Setup wiederhergestellt.";
  renderDetails();
});


// Version 5.0.1 – Fahrzeugvergleich
function compareCarLabel(car) {
  return `${car.manufacturer} · ${car.name} (${car.class})`;
}

function appendCarOptions(select, selectedId = null) {
  if (!select || !state.data) return;

  select.innerHTML = "";
  const grouped = new Map();

  [...state.data.cars]
    .sort((a, b) =>
      a.class.localeCompare(b.class) ||
      a.manufacturer.localeCompare(b.manufacturer) ||
      a.name.localeCompare(b.name)
    )
    .forEach(car => {
      const groupName = car.class || "Ohne Klasse";
      if (!grouped.has(groupName)) grouped.set(groupName, []);
      grouped.get(groupName).push(car);
    });

  grouped.forEach((groupCars, groupName) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;

    groupCars.forEach(car => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = compareCarLabel(car);
      option.selected = car.id === selectedId;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });
}

function commonTracks(carA, carB) {
  if (!carA || !carB) return [];
  const tracksB = new Set(carB.setups.map(setup => setup.track));
  return carA.setups
    .map(setup => setup.track)
    .filter(track => tracksB.has(track))
    .sort((a, b) => a.localeCompare(b));
}

function comparisonSetup(car, track) {
  const original = car?.setups.find(setup => setup.track === track);
  return original ? getDisplayedSetup(car, original) : null;
}

function comparisonScore(car, setup) {
  if (!car || !setup) return 0;
  const values = [
    setup.ratings?.stability,
    setup.ratings?.turnIn,
    setup.ratings?.traction,
    setup.ratings?.tireWear,
    car.ratings?.controller
  ].filter(value => Number.isFinite(Number(value)));

  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

function setComparisonImage(selector, path, fallback, alt) {
  const image = $(selector);
  if (!image) return;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
  image.src = path;
  image.alt = alt;
}

function renderComparisonCar(side, car, setup) {
  $(`#compareClass${side}`).textContent = car.class || "–";
  $(`#compareName${side}`).textContent = car.name;
  $(`#compareManufacturer${side}`).textContent = car.manufacturer;
  $(`#compareShort${side}`).textContent = car.name;

  setComparisonImage(
    `#compareLogo${side}`,
    getLogo(car.manufacturer),
    "../assets/images/logos/placeholder.webp",
    `${car.manufacturer} Logo`
  );

  setComparisonImage(
    `#compareImage${side}`,
    getCarImage(car),
    "../assets/images/cars/placeholder.webp",
    car.name
  );

  $(`#compareBrake${side}`).textContent = setup?.brakeBalance ?? "–";
  $(`#compareTcs${side}`).textContent = setup?.tcs ?? "–";
  $(`#compareTires${side}`).textContent = setup?.tires || "–";
  $(`#compareAbs${side}`).textContent = setup?.abs || "Standard";
  $(`#compareAsm${side}`).textContent = setup?.asm || "Aus";
  $(`#compareStability${side}`).textContent = createStars(setup?.ratings?.stability);
  $(`#compareTurnIn${side}`).textContent = createStars(setup?.ratings?.turnIn);
  $(`#compareTraction${side}`).textContent = createStars(setup?.ratings?.traction);
  $(`#compareWear${side}`).textContent = createStars(setup?.ratings?.tireWear);
  $(`#compareSource${side}`).textContent =
    setup?.setupOriginLabel || setup?.source || "Fahrzeug-Setup";
}

function renderComparison() {
  if (!state.data) return;

  const selectA = $("#compareCarA");
  const selectB = $("#compareCarB");
  const trackSelect = $("#compareTrack");
  if (!selectA || !selectB || !trackSelect) return;

  const carA = state.data.cars.find(car => car.id === selectA.value);
  const carB = state.data.cars.find(car => car.id === selectB.value);
  const tracks = commonTracks(carA, carB);
  const previousTrack = trackSelect.value;

  trackSelect.innerHTML = "";
  tracks.forEach(track => {
    const option = document.createElement("option");
    option.value = track;
    option.textContent = track;
    trackSelect.appendChild(option);
  });

  if (tracks.includes(previousTrack)) {
    trackSelect.value = previousTrack;
  }

  const hasTracks = tracks.length > 0;
  $("#comparisonEmpty").hidden = hasTracks;
  $("#comparisonResults").hidden = !hasTracks;
  $("#comparisonRecommendation").hidden = !hasTracks;
  trackSelect.disabled = !hasTracks;

  if (!hasTracks || !carA || !carB) return;

  const selectedTrack = trackSelect.value || tracks[0];
  const setupA = comparisonSetup(carA, selectedTrack);
  const setupB = comparisonSetup(carB, selectedTrack);

  renderComparisonCar("A", carA, setupA);
  renderComparisonCar("B", carB, setupB);

  const scoreA = comparisonScore(carA, setupA);
  const scoreB = comparisonScore(carB, setupB);
  const recommendation = $("#comparisonRecommendation");

  if (Math.abs(scoreA - scoreB) < 0.15) {
    recommendation.innerHTML = `
      <strong>Sehr ausgeglichener Vergleich.</strong>
      Beide Fahrzeuge sind auf <b>${selectedTrack}</b> ähnlich controllerfreundlich.
      Entscheide nach Fahrgefühl und persönlicher Vorliebe.
    `;
  } else {
    const winner = scoreA > scoreB ? carA : carB;
    const winnerSetup = scoreA > scoreB ? setupA : setupB;
    const score = Math.max(scoreA, scoreB).toFixed(1);
    recommendation.innerHTML = `
      <strong>Controller-Empfehlung: ${winner.name}</strong><br>
      Auf <b>${selectedTrack}</b> erreicht dieses Fahrzeug im Vergleich einen
      Controller-Score von <b>${score}/5</b>. Grundlage sind Stabilität,
      Einlenken, Traktion, Reifenverschleiß und die Fahrzeugbewertung.
      <div class="setup-source-details">Quelle: ${winnerSetup?.setupOriginLabel || winnerSetup?.source || "Setup-Datenbank"}</div>
    `;
  }
}

function initializeComparison() {
  const selectA = $("#compareCarA");
  const selectB = $("#compareCarB");
  if (!selectA || !selectB || !state.data?.cars.length) return;

  const preferredA = state.data.cars.find(car =>
    car.name.toLowerCase().includes("r8 lms evo")
  ) || state.data.cars[0];

  const preferredB = state.data.cars.find(car =>
    car.id !== preferredA.id &&
    car.name.toLowerCase().includes("911 gt3 r")
  ) || state.data.cars.find(car => car.id !== preferredA.id) || preferredA;

  appendCarOptions(selectA, preferredA.id);
  appendCarOptions(selectB, preferredB.id);
  renderComparison();
}

$("#toggleComparison")?.addEventListener("click", () => {
  const section = $("#comparisonSection");
  section.hidden = false;
  renderComparison();
  section.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#closeComparison")?.addEventListener("click", () => {
  $("#comparisonSection").hidden = true;
});

$("#compareCarA")?.addEventListener("change", renderComparison);
$("#compareCarB")?.addEventListener("change", renderComparison);
$("#compareTrack")?.addEventListener("change", renderComparison);


// Version 5.0.2 – Race Center
function raceCenterTracksForClass(className) {
  const tracks = new Set();

  state.data.cars
    .filter(car => car.class === className)
    .forEach(car => {
      car.setups.forEach(setup => tracks.add(setup.track));
    });

  return [...tracks].sort((a, b) => a.localeCompare(b));
}

function raceCenterSetup(car, track) {
  const original = car?.setups.find(setup => setup.track === track);
  return original ? getDisplayedSetup(car, original) : null;
}

function raceCenterCarScore(car, setup, tireMultiplier) {
  if (!car || !setup) return -1;

  const stability = Number(setup.ratings?.stability || 3);
  const turnIn = Number(setup.ratings?.turnIn || 3);
  const traction = Number(setup.ratings?.traction || 3);
  const tireWear = Number(setup.ratings?.tireWear || 3);
  const controller = Number(car.ratings?.controller || 3);

  const wearWeight = Number(tireMultiplier) >= 6 ? 2 : 1;

  return (
    stability +
    turnIn +
    traction +
    controller +
    tireWear * wearWeight
  ) / (4 + wearWeight);
}

function raceCenterRecommendedCar(className, track, tireMultiplier) {
  const candidates = state.data.cars
    .filter(car => car.class === className)
    .map(car => ({
      car,
      setup: raceCenterSetup(car, track)
    }))
    .filter(item => item.setup)
    .map(item => ({
      ...item,
      score: raceCenterCarScore(
        item.car,
        item.setup,
        tireMultiplier
      )
    }))
    .sort((a, b) =>
      b.score - a.score ||
      a.car.name.localeCompare(b.car.name)
    );

  return candidates[0] || null;
}

function raceCenterEstimatedMinutes(mode, duration, laps, track) {
  if (mode === "time") {
    return Number(duration);
  }

  const lapCount = Math.max(2, Number(laps) || 15);

  const longTracks = [
    "24 Heures du Mans",
    "Nürburgring Nordschleife",
    "Nürburgring 24h",
    "Nürburgring Endurance",
    "Nürburgring Endurance II",
    "Spa",
    "Spa – 24h Layout",
    "Mount Panorama Motor Racing Circuit"
  ];

  const shortTracks = [
    "Brands Hatch – Indy",
    "Tsukuba Circuit",
    "Suzuka – East Course",
    "Red Bull Ring – Kurz",
    "Watkins Glen – Short Course",
    "Autopolis – Kurzstrecke"
  ];

  let estimatedLapMinutes = 2.0;

  if (longTracks.includes(track)) {
    estimatedLapMinutes =
      track.includes("Nürburgring") ? 7.5 :
      track.includes("Le Mans") ? 3.8 :
      2.3;
  } else if (shortTracks.includes(track)) {
    estimatedLapMinutes = 1.05;
  }

  return Math.max(5, Math.round(lapCount * estimatedLapMinutes));
}

function raceCenterStrategy(
  setup,
  options
) {
  const {
    distanceMode,
    duration,
    laps,
    track,
    tireMultiplier,
    fuelMultiplier,
    startType,
    weather,
    mandatoryTires,
    mandatoryStop,
    refuelAllowed,
    tireChangeRequired
  } = options;

  const minutes = raceCenterEstimatedMinutes(
    distanceMode,
    duration,
    laps,
    track
  );

  const tire = Number(tireMultiplier);
  const fuel = Number(fuelMultiplier);
  const mustStop = mandatoryStop === "yes";
  const mustChangeTires = tireChangeRequired === "yes";
  const refuel = refuelAllowed === "yes";

  let startTires = setup?.tires || "Racing Medium";
  let nextTires = "Kein Wechsel";
  let alternative = "Konservative Ein-Stint-Strategie";
  let stops = 0;

  const mandatoryMap = {
    RM: ["Racing Medium"],
    RH: ["Racing Hard"],
    RS: ["Racing Soft"],
    "RM+RH": ["Racing Medium", "Racing Hard"],
    "RS+RM": ["Racing Soft", "Racing Medium"],
    "RS+RH": ["Racing Soft", "Racing Hard"]
  };

  const requiredCompounds = mandatoryMap[mandatoryTires] || [];

  if (weather === "rain") {
    startTires = "Intermediate";
    nextTires = "Heavy Wet bei starkem Regen";
    stops = Math.max(stops, 1);
    alternative = "Intermediate starten, bei stehender Nässe auf Heavy Wet wechseln";
  } else if (weather === "changeable") {
    startTires = tire <= 4 ? "Racing Medium" : "Racing Hard";
    nextTires = "Intermediate bereithalten";
    stops = Math.max(stops, 1);
    alternative = "Trockenreifen verlängern, bis die Strecke dauerhaft nass ist";
  } else if (requiredCompounds.length >= 2) {
    startTires = requiredCompounds[0];
    nextTires = requiredCompounds[1];
    stops = Math.max(stops, 1);
    alternative = `${requiredCompounds[1]} starten und auf ${requiredCompounds[0]} wechseln`;
  } else if (requiredCompounds.length === 1) {
    startTires = requiredCompounds[0];
    nextTires = mustChangeTires ? requiredCompounds[0] : "Kein Wechsel";
  } else if (minutes <= 15 && tire <= 3) {
    startTires = "Racing Soft";
    alternative = "Racing Medium ohne Reifenrisiko";
  } else if (minutes <= 35 && tire <= 4) {
    startTires = "Racing Medium";
    alternative = "Racing Soft für Qualifying-Tempo";
  } else if (minutes >= 60 || tire >= 8) {
    startTires = "Racing Hard";
    nextTires = tire >= 10 ? "Racing Hard" : "Racing Medium";
    stops = Math.max(stops, minutes >= 80 || tire >= 10 ? 2 : 1);
    alternative = "Medium starten, früher stoppen und auf Hard wechseln";
  } else if (minutes >= 40 || tire >= 6) {
    startTires = "Racing Medium";
    nextTires = tire >= 8 ? "Racing Hard" : "Racing Medium";
    stops = Math.max(stops, 1);
    alternative = "Hard starten und am Ende Medium fahren";
  }

  if (mustStop || mustChangeTires) {
    stops = Math.max(stops, 1);
  }

  if (fuel >= 10 && minutes >= 45) {
    stops = Math.max(stops, refuel ? 2 : 1);
  } else if (fuel >= 6 && minutes >= 30) {
    stops = Math.max(stops, 1);
  }

  if (stops > 0 && nextTires === "Kein Wechsel") {
    nextTires = startTires;
  }

  let fuelMapStart = startType === "grid" ? "Map 1" : "Map 2";
  let fuelMapRace = "Map 1";
  let fuelMapSave = "Map 3";

  if (fuel >= 8) {
    fuelMapStart = "Map 2–3";
    fuelMapRace = "Map 3–4";
    fuelMapSave = "Map 5–6";
  } else if (fuel >= 6) {
    fuelMapStart = "Map 2";
    fuelMapRace = "Map 2–3";
    fuelMapSave = "Map 4–5";
  } else if (fuel >= 4) {
    fuelMapRace = "Map 1–2";
    fuelMapSave = "Map 3–4";
  }

  if (!refuel && fuel >= 4) {
    fuelMapRace =
      fuel >= 8 ? "Map 4–5" :
      fuel >= 6 ? "Map 3–4" :
      "Map 2–3";
    fuelMapSave = "Map 5–6";
  }

  let pitWindow = "Kein Stopp geplant";

  if (stops === 1) {
    if (distanceMode === "laps") {
      const lapCount = Math.max(2, Number(laps) || 15);
      const startLap = Math.max(2, Math.round(lapCount * 0.42));
      const endLap = Math.max(startLap + 1, Math.round(lapCount * 0.62));
      pitWindow = `Runde ${startLap}–${endLap}`;
    } else {
      const startMinute = Math.max(5, Math.round(minutes * 0.42));
      const endMinute = Math.max(startMinute + 2, Math.round(minutes * 0.62));
      pitWindow = `${startMinute}.–${endMinute}. Minute`;
    }
  } else if (stops >= 2) {
    if (distanceMode === "laps") {
      const lapCount = Math.max(3, Number(laps) || 15);
      pitWindow =
        `Runde ${Math.round(lapCount / 3)} und ${Math.round((lapCount * 2) / 3)}`;
    } else {
      pitWindow =
        `${Math.round(minutes / 3)}. und ${Math.round((minutes * 2) / 3)}. Minute`;
    }
  }

  let weatherPlan = "Trocken: Slicks bis zum Rennende";

  if (weather === "changeable") {
    weatherPlan =
      "Intermediate erst bei dauerhaft nasser Ideallinie; Heavy Wet bei starker Wasserbildung";
  } else if (weather === "rain") {
    weatherPlan =
      "Intermediate starten; bei starkem Regen oder viel Wasser Heavy Wet";
  }

  const startAdvice =
    startType === "grid"
      ? "TKS am Start kurz um 1 erhöhen, dann nach Kurve 1 zurückstellen"
      : "Reifen und Bremsen vor Rennfreigabe sauber auf Temperatur bringen";

  const difficulty = Math.max(
    1,
    Math.min(
      10,
      Math.round(
        7.8 -
        Number(setup?.ratings?.stability || 3) * 0.65 -
        Number(setup?.ratings?.traction || 3) * 0.35 +
        tire * 0.15 +
        fuel * 0.12 +
        (weather === "changeable" ? 1.2 : 0) +
        (weather === "rain" ? 1.8 : 0) +
        (startType === "grid" ? 0.5 : 0)
      )
    )
  );

  const tips = [];

  if (stops === 0) {
    tips.push("Reifen gleichmäßig belasten und unnötiges Rutschen vermeiden.");
  } else {
    tips.push(
      `${stops} Boxenstopp${stops === 1 ? "" : "s"} einplanen und vor dem Stopp keine Zeit in Zweikämpfen verlieren.`
    );
  }

  if (!refuel) {
    tips.push("Da Nachtanken nicht erlaubt ist, früh hochschalten und im Windschatten sparen.");
  } else if (fuel >= 6) {
    tips.push("Nur so viel nachtanken, wie für den letzten Stint benötigt wird.");
  }

  if (weather !== "dry") {
    tips.push("Wetterradar beobachten und nicht zu früh auf Regenreifen wechseln.");
  }

  if (requiredCompounds.length >= 2) {
    tips.push("Beide vorgeschriebenen Mischungen mindestens einmal verwenden.");
  }

  return {
    estimatedMinutes: minutes,
    startTires,
    nextTires,
    stops,
    pitWindow,
    fuelMapStart,
    fuelMapRace,
    fuelMapSave,
    weatherPlan,
    startAdvice,
    alternative,
    difficulty,
    tip: tips.join(" ")
  };
}

function setRaceCenterImage(selector, path, fallback, alt) {
  const image = $(selector);
  if (!image) return;

  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };

  image.src = path;
  image.alt = alt;
}


function raceCenterCarsForClass(className) {
  return state.data.cars
    .filter(car => car.class === className)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function populateRaceCenterCars() {
  const classSelect = $("#raceClass");
  const carSelect = $("#raceCarSelect");

  if (!classSelect || !carSelect || !state.data) return;

  const previousValue = carSelect.value || "current";
  const cars = raceCenterCarsForClass(classSelect.value);

  carSelect.innerHTML = "";

  const currentOption = document.createElement("option");
  currentOption.value = "current";
  currentOption.textContent = "Aktuell ausgewähltes Fahrzeug";
  carSelect.appendChild(currentOption);

  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "Automatisch";
  carSelect.appendChild(autoOption);

  cars.forEach(car => {
    const option = document.createElement("option");
    option.value = car.id;
    option.textContent = car.name;
    carSelect.appendChild(option);
  });

  if ([...carSelect.options].some(option => option.value === previousValue)) {
    carSelect.value = previousValue;
  } else {
    carSelect.value = "current";
  }
}

function raceCenterSelectedCar(className, track, tireMultiplier) {
  const mode = $("#raceCarSelect")?.value || "current";

  if (mode === "current") {
    const currentCar = state.data.cars.find(
      car => car.id === state.carId && car.class === className
    );

    const currentSetup = raceCenterSetup(currentCar, track);

    if (currentCar && currentSetup) {
      return {
        car: currentCar,
        setup: currentSetup,
        score: raceCenterCarScore(
          currentCar,
          currentSetup,
          tireMultiplier
        ),
        selectionMode: "current"
      };
    }
  }

  if (mode !== "auto" && mode !== "current") {
    const selectedCar = state.data.cars.find(
      car => car.id === mode && car.class === className
    );

    const selectedSetup = raceCenterSetup(selectedCar, track);

    if (selectedCar && selectedSetup) {
      return {
        car: selectedCar,
        setup: selectedSetup,
        score: raceCenterCarScore(
          selectedCar,
          selectedSetup,
          tireMultiplier
        ),
        selectionMode: "manual"
      };
    }
  }

  const automatic = raceCenterRecommendedCar(
    className,
    track,
    tireMultiplier
  );

  return automatic
    ? { ...automatic, selectionMode: "auto" }
    : null;
}

function populateRaceCenterTracks() {
  const classSelect = $("#raceClass");
  const trackSelect = $("#raceTrack");

  if (!classSelect || !trackSelect || !state.data) return;

  const previousTrack = trackSelect.value;
  const tracks = raceCenterTracksForClass(classSelect.value);

  trackSelect.innerHTML = "";

  tracks.forEach(track => {
    const option = document.createElement("option");
    option.value = track;
    option.textContent = track;
    trackSelect.appendChild(option);
  });

  if (tracks.includes(previousTrack)) {
    trackSelect.value = previousTrack;
  } else if (tracks.includes("Spa")) {
    trackSelect.value = "Spa";
  }
}

function renderRaceCenter() {
  if (!state.data) return;

  const className = $("#raceClass")?.value || "Gr.3";
  const track = $("#raceTrack")?.value;
  const distanceMode = $("#raceDistanceMode")?.value || "time";
  const duration = Number($("#raceDuration")?.value || 20);
  const laps = Number($("#raceLaps")?.value || 15);
  const tireMultiplier = Number(
    $("#raceTireMultiplier")?.value || 3
  );
  const fuelMultiplier = Number(
    $("#raceFuelMultiplier")?.value || 3
  );
  const startType = $("#raceStartType")?.value || "rolling";
  const weather = $("#raceWeather")?.value || "dry";
  const mandatoryTires = $("#raceMandatoryTires")?.value || "none";
  const mandatoryStop = $("#raceMandatoryStop")?.value || "no";
  const refuelAllowed = $("#raceRefuelAllowed")?.value || "yes";
  const tireChangeRequired =
    $("#raceTireChangeRequired")?.value || "no";

  const result = raceCenterSelectedCar(
    className,
    track,
    tireMultiplier
  );

  const empty = $("#raceCenterEmpty");
  const results = $("#raceCenterResults");

  if (!result) {
    if (empty) empty.hidden = false;
    if (results) results.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (results) results.hidden = false;

  const { car, setup, score } = result;
  const strategy = raceCenterStrategy(setup, {
    distanceMode,
    duration,
    laps,
    track,
    tireMultiplier,
    fuelMultiplier,
    startType,
    weather,
    mandatoryTires,
    mandatoryStop,
    refuelAllowed,
    tireChangeRequired
  });

  $("#raceCarClass").textContent = car.class || "–";
  $("#raceCarName").textContent = car.name;
  $("#raceCarManufacturer").textContent = car.manufacturer;

  setRaceCenterImage(
    "#raceCarLogo",
    getLogo(car.manufacturer),
    "../assets/images/logos/placeholder.webp",
    `${car.manufacturer} Logo`
  );

  setRaceCenterImage(
    "#raceCarImage",
    getCarImage(car),
    "../assets/images/cars/placeholder.webp",
    car.name
  );

  const reasonLabels = {
    current: "Aktuell in der GT7-Datenbank ausgewähltes Fahrzeug.",
    manual: "Von dir für das Race Center ausgewähltes Fahrzeug.",
    auto: "Automatische Basiswahl. Bei gleichen Daten kann die Auswahl nur eine Orientierung sein."
  };

  $("#raceCarReason").textContent =
    `${reasonLabels[result.selectionMode]} Setup-Wertung: ${score.toFixed(1)}/5.`;

  $("#raceStrategyTrack").textContent = track;
  $("#raceDifficulty").textContent =
    `Controller ${strategy.difficulty}/10`;

  $("#raceBrakeBalance").textContent =
    setup.brakeBalance ?? "–";
  $("#raceTcs").textContent =
    setup.tcs ?? "–";
  $("#raceTires").textContent =
    strategy.startTires;
  $("#raceNextTires").textContent =
    strategy.nextTires;
  $("#raceStops").textContent =
    String(strategy.stops);
  $("#racePitWindow").textContent =
    strategy.pitWindow;
  $("#raceFuelMapStart").textContent =
    strategy.fuelMapStart;
  $("#raceFuelMapRace").textContent =
    strategy.fuelMapRace;
  $("#raceFuelMapSave").textContent =
    strategy.fuelMapSave;
  $("#raceStartAdvice").textContent =
    strategy.startAdvice;
  $("#raceWeatherPlan").textContent =
    strategy.weatherPlan;
  $("#raceAlternative").textContent =
    strategy.alternative;

  $("#raceStrategyTip").textContent =
    `${setup.tip || ""} ${strategy.tip}`.trim();

  const distanceLabel =
    distanceMode === "laps"
      ? `${laps} Runden (ca. ${strategy.estimatedMinutes} Minuten)`
      : `${duration} Minuten`;

  $("#raceStrategySource").textContent =
    `Setup-Quelle: ${setup.setupOriginLabel || setup.source || "Setup-Datenbank"} · Planung: ${distanceLabel}, Reifen ${tireMultiplier}×, Kraftstoff ${fuelMultiplier}×, Wetter ${weather}.`;
}

function initializeRaceCenter() {
  if (!state.data) return;
  populateRaceCenterCars();
  populateRaceCenterTracks();
  updateRaceDistanceMode();
  renderRaceCenter();
}

$("#toggleRaceCenter")?.addEventListener("click", () => {
  const section = $("#raceCenterSection");
  section.hidden = false;
  populateRaceCenterCars();
  populateRaceCenterTracks();
  renderRaceCenter();
  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

$("#closeRaceCenter")?.addEventListener("click", () => {
  $("#raceCenterSection").hidden = true;
});


function updateRaceDistanceMode() {
  const mode = $("#raceDistanceMode")?.value || "time";
  const durationLabel = $("#raceDurationLabel");
  const lapsLabel = $("#raceLapsLabel");

  if (durationLabel) {
    durationLabel.hidden = mode !== "time";
  }

  if (lapsLabel) {
    lapsLabel.hidden = mode !== "laps";
  }
}

$("#raceClass")?.addEventListener("change", () => {
  populateRaceCenterCars();
  populateRaceCenterTracks();
  renderRaceCenter();
});

$("#raceCarSelect")?.addEventListener("change", renderRaceCenter);
$("#raceTrack")?.addEventListener("change", renderRaceCenter);

$("#raceDistanceMode")?.addEventListener("change", () => {
  updateRaceDistanceMode();
  renderRaceCenter();
});

$("#raceDuration")?.addEventListener("change", renderRaceCenter);
$("#raceLaps")?.addEventListener("input", renderRaceCenter);
$("#raceTireMultiplier")?.addEventListener("change", renderRaceCenter);
$("#raceFuelMultiplier")?.addEventListener("change", renderRaceCenter);
$("#raceStartType")?.addEventListener("change", renderRaceCenter);
$("#raceWeather")?.addEventListener("change", renderRaceCenter);
$("#raceMandatoryTires")?.addEventListener("change", renderRaceCenter);
$("#raceMandatoryStop")?.addEventListener("change", renderRaceCenter);
$("#raceRefuelAllowed")?.addEventListener("change", renderRaceCenter);
$("#raceTireChangeRequired")?.addEventListener("change", renderRaceCenter);



init().catch(error => {
  $("#detailsEmpty").textContent =
    "GT7-Daten konnten nicht geladen werden.";
  console.error(error);
});
