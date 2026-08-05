class Search {

    static cars(cars, text) {

        if (!text)
            return cars;

        text = text.toLowerCase();

        return cars.filter(car => {

            if (
                car.name.toLowerCase().includes(text) ||
                car.manufacturer.toLowerCase().includes(text) ||
                car.class.toLowerCase().includes(text)
            )
                return true;

            return car.setups.some(setup =>
                setup.track.toLowerCase().includes(text)
            );

        });

    }

}