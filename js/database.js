class Database {

    constructor() {
        this.data = {
            gt7: []
        };
    }

    async loadJSON(path) {

        try {

            const response = await fetch(path);

            if (!response.ok)
                return [];

            const json = await response.json();

            return Array.isArray(json)
                ? json
                : [];

        } catch {

            return [];

        }

    }

    async loadGT7() {

        this.data.gt7 = [];

        for (const file of CONFIG.gt7Files) {

            const cars = await this.loadJSON(file);

            this.data.gt7.push(...cars);

        }

        return this.data.gt7;

    }

    getGame(game) {

        return this.data[game] || [];

    }

}

const DB = new Database();