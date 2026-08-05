function getLogo(manufacturer) {

    if (!manufacturer) {
        return "../assets/images/logos/placeholder.webp";
    }

    const logos = {

        "Audi": "../assets/images/logos/audi.webp",
        "BMW": "../assets/images/logos/bmw.webp",
        "Ferrari": "../assets/images/logos/ferrari.webp",
        "Honda": "../assets/images/logos/honda.webp",
        "Lamborghini": "../assets/images/logos/lamborghini.webp",
        "Lexus": "../assets/images/logos/lexus.webp",
        "McLaren": "../assets/images/logos/mclaren.webp",
        "Mercedes-AMG": "../assets/images/logos/mercedes.webp",
        "Nissan": "../assets/images/logos/nissan.webp",
        "Porsche": "../assets/images/logos/porsche.webp",
        "Toyota": "../assets/images/logos/toyota.webp",
        "Volkswagen": "../assets/images/logos/volkswagen.webp"

    };

    return logos[manufacturer] || "../assets/images/logos/placeholder.webp";

}