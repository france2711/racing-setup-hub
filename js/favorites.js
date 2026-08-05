// Racing Setup Hub
// Favorites Module
// Version 4.5

const Favorites = {

    key: "gt7-car-favorites",

    load() {

        return new Set(
            JSON.parse(localStorage.getItem(this.key) || "[]")
        );

    },

    save(favorites) {

        localStorage.setItem(
            this.key,
            JSON.stringify([...favorites])
        );

    },

    toggle(favorites, id) {

        if (favorites.has(id)) {

            favorites.delete(id);

        } else {

            favorites.add(id);

        }

        this.save(favorites);

        return favorites;

    }

};