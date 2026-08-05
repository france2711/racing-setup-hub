class Database {
  constructor() {
    this.data = {
      gt7: [],
      tracks: [],
      setupTemplates: {}
    };
  }

  async loadJSON(path, fallback = []) {
    try {
      const response = await fetch(path);

      if (!response.ok) {
        console.warn(`Datei konnte nicht geladen werden: ${path}`);
        return fallback;
      }

      return await response.json();
    } catch (error) {
      console.error(`Fehler beim Laden von ${path}:`, error);
      return fallback;
    }
  }

  async loadTracks() {
    this.data.tracks = await this.loadJSON(
      CONFIG.tracksFile,
      []
    );

    return this.data.tracks;
  }

  async loadGT7() {
    this.data.gt7 = [];

    const results = await Promise.all(
      CONFIG.gt7Files.map(file => this.loadJSON(file, []))
    );

    results.forEach(cars => {
      if (Array.isArray(cars)) {
        this.data.gt7.push(...cars);
      }
    });

    return this.data.gt7;
  }

  async loadSetupTemplates() {
    const entries = await Promise.all(
      Object.entries(CONFIG.setupTemplateFiles || {}).map(
        async ([carClass, path]) => {
          const template = await this.loadJSON(path, {});
          return [carClass, template];
        }
      )
    );

    this.data.setupTemplates = Object.fromEntries(entries);
    return this.data.setupTemplates;
  }

  isIndividualSetup(setup) {
    if (!setup || !setup.track) {
      return false;
    }

    if (setup.verified === true) {
      return true;
    }

    const source = String(setup.source || "").toLowerCase();
    const generatedBasis =
      source.includes("basisempfehlung") ||
      source.includes("empfohlene basis");

    // Ältere, von Hand erstellte Setups haben oft keine source-Angabe.
    return !generatedBasis && setup.setupAvailable !== false;
  }

  applySetupTemplates(cars, templates) {
    return cars.map(car => {
      const classTemplate = templates[car.class];

      if (!classTemplate || typeof classTemplate !== "object") {
        return {
          ...car,
          setups: Array.isArray(car.setups) ? car.setups : []
        };
      }

      const originalSetups = Array.isArray(car.setups)
        ? car.setups
        : [];

      const individualByTrack = new Map(
        originalSetups
          .filter(setup => this.isIndividualSetup(setup))
          .map(setup => [setup.track, setup])
      );

      const resolvedSetups = Object.entries(classTemplate).map(
        ([track, templateSetup]) => {
          const individual = individualByTrack.get(track);

          if (individual) {
            const merged = {
              track,
              ...templateSetup,
              ...individual,
              ratings: {
                ...(templateSetup.ratings || {}),
                ...(individual.ratings || {})
              }
            };

            const comparedFields = [
              "brakeBalance",
              "tcs",
              "tires",
              "abs",
              "asm",
              "tip"
            ];

            const changedFields = comparedFields.filter(field =>
              individual[field] !== undefined &&
              individual[field] !== templateSetup[field]
            );

            const ratingKeys = [
              "stability",
              "turnIn",
              "traction",
              "tireWear"
            ];

            const changedRatings = ratingKeys.filter(key =>
              individual.ratings?.[key] !== undefined &&
              individual.ratings?.[key] !== templateSetup.ratings?.[key]
            );

            return {
              ...merged,
              setupOrigin: "template+vehicle",
              setupOriginLabel: `${car.class}-Basis + ${car.manufacturer}-Anpassung`,
              setupBaseLabel: `${car.class}-Basisempfehlung`,
              setupOverrideLabel: `${car.manufacturer}-Anpassung`,
              changedFields: [...changedFields, ...changedRatings.map(key => `ratings.${key}`)]
            };
          }

          return {
            track,
            ...templateSetup,
            setupOrigin: "template",
            setupOriginLabel: `${car.class}-Basisempfehlung`
          };
        }
      );

      // Individuelle Sonderstrecken erhalten, falls sie nicht im Template stehen.
      individualByTrack.forEach((setup, track) => {
        if (!(track in classTemplate)) {
          resolvedSetups.push({
            ...setup,
            setupOrigin: "vehicle",
            setupOriginLabel: "Fahrzeugspezifisches Setup"
          });
        }
      });

      return {
        ...car,
        setups: resolvedSetups
      };
    });
  }

  getGame(game) {
    return this.data[game] || [];
  }
}

const DB = new Database();
