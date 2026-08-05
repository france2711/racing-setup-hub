// Racing Setup Hub
// Garage Module
// Version 4.5

const Garage = {

    getCars(database, favorites) {

        return database.filter(car =>
            favorites.has(car.id)
        );

    }

};