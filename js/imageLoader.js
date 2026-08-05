function getCarImage(car) {
  if (!car) {
    return "../assets/images/cars/placeholder.webp";
  }

  const imageMap = {
    "audi-r8-lms-evo19":
      "../assets/images/cars/audi/r8-lms-evo19.webp",

    "porsche-911-gt3-r-992":
      "../assets/images/cars/porsche/911-gt3-r-992.webp",

    "ferrari-296-gt3":
      "../assets/images/cars/ferrari/296-gt3.webp",

    "ferrari-458-gt3":
      "../assets/images/cars/ferrari/458-gt3.webp",

    "bmw-m4-gt3":
      "../assets/images/cars/bmw/m4-gt3.webp",

    "bmw-m6-gt3":
      "../assets/images/cars/bmw/m6-gt3.webp",

    "mercedes-amg-gt3-20":
      "../assets/images/cars/mercedes/amg-gt3-20.webp",

    "mclaren-650s-gt3-15":
      "../assets/images/cars/mclaren/650s-gt3.webp",

    "lexus-rc-f-gt3-17":
      "../assets/images/cars/lexus/rc-f-gt3.webp",

    "nissan-gt-r-nismo-gt3-18":
      "../assets/images/cars/nissan/gt-r-nismo-gt3-18.webp",

    "toyota-gr-supra-racing-concept-18":
      "../assets/images/cars/toyota/gr-supra-racing-concept-18.webp",

    "honda-nsx-gr3":
      "../assets/images/cars/honda/nsx-gr3.webp",

    "lamborghini-huracan-gt3-15":
      "../assets/images/cars/lamborghini/huracan-gt3-15.webp",

    "volkswagen-beetle-gr3":
      "../assets/images/cars/volkswagen/beetle-gr3.webp"
  };

  return imageMap[car.id] ||
    "../assets/images/cars/placeholder.webp";
}