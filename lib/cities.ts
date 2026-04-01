export interface City {
  name: string;       // Arabic name
  nameEn: string;     // English name for search
  country: string;    // Arabic country name
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  // Arabian Peninsula
  { name: 'مكة المكرمة',    nameEn: 'Makkah',        country: 'السعودية',     lat: 21.3891,  lng: 39.8579 },
  { name: 'المدينة المنورة', nameEn: 'Madinah',       country: 'السعودية',     lat: 24.5247,  lng: 39.5692 },
  { name: 'الرياض',          nameEn: 'Riyadh',        country: 'السعودية',     lat: 24.7136,  lng: 46.6753 },
  { name: 'جدة',             nameEn: 'Jeddah',        country: 'السعودية',     lat: 21.4858,  lng: 39.1925 },
  { name: 'الدمام',          nameEn: 'Dammam',        country: 'السعودية',     lat: 26.4207,  lng: 50.0888 },
  { name: 'أبوظبي',          nameEn: 'Abu Dhabi',     country: 'الإمارات',     lat: 24.4539,  lng: 54.3773 },
  { name: 'دبي',             nameEn: 'Dubai',         country: 'الإمارات',     lat: 25.2048,  lng: 55.2708 },
  { name: 'الشارقة',         nameEn: 'Sharjah',       country: 'الإمارات',     lat: 25.3463,  lng: 55.4209 },
  { name: 'الكويت',          nameEn: 'Kuwait City',   country: 'الكويت',       lat: 29.3759,  lng: 47.9774 },
  { name: 'المنامة',         nameEn: 'Manama',        country: 'البحرين',      lat: 26.2235,  lng: 50.5876 },
  { name: 'الدوحة',          nameEn: 'Doha',          country: 'قطر',          lat: 25.2854,  lng: 51.5310 },
  { name: 'مسقط',            nameEn: 'Muscat',        country: 'عُمان',        lat: 23.5880,  lng: 58.3829 },
  { name: 'صنعاء',           nameEn: "Sana'a",        country: 'اليمن',        lat: 15.3694,  lng: 44.1910 },
  { name: 'عدن',             nameEn: 'Aden',          country: 'اليمن',        lat: 12.7797,  lng: 45.0095 },

  // Levant
  { name: 'دمشق',            nameEn: 'Damascus',      country: 'سوريا',        lat: 33.5138,  lng: 36.2765 },
  { name: 'حلب',             nameEn: 'Aleppo',        country: 'سوريا',        lat: 36.2021,  lng: 37.1343 },
  { name: 'بيروت',           nameEn: 'Beirut',        country: 'لبنان',        lat: 33.8938,  lng: 35.5018 },
  { name: 'عمّان',           nameEn: 'Amman',         country: 'الأردن',       lat: 31.9454,  lng: 35.9284 },
  { name: 'القدس',           nameEn: 'Jerusalem',     country: 'فلسطين',       lat: 31.7683,  lng: 35.2137 },
  { name: 'غزة',             nameEn: 'Gaza',          country: 'فلسطين',       lat: 31.5017,  lng: 34.4674 },
  { name: 'رام الله',        nameEn: 'Ramallah',      country: 'فلسطين',       lat: 31.8996,  lng: 35.2042 },

  // Iraq
  { name: 'بغداد',           nameEn: 'Baghdad',       country: 'العراق',       lat: 33.3152,  lng: 44.3661 },
  { name: 'البصرة',          nameEn: 'Basra',         country: 'العراق',       lat: 30.5085,  lng: 47.7804 },
  { name: 'أربيل',           nameEn: 'Erbil',         country: 'العراق',       lat: 36.1912,  lng: 44.0092 },
  { name: 'النجف',           nameEn: 'Najaf',         country: 'العراق',       lat: 31.9906,  lng: 44.3319 },
  { name: 'الموصل',          nameEn: 'Mosul',         country: 'العراق',       lat: 36.3350,  lng: 43.1189 },

  // Egypt & North Africa
  { name: 'القاهرة',         nameEn: 'Cairo',         country: 'مصر',          lat: 30.0444,  lng: 31.2357 },
  { name: 'الإسكندرية',      nameEn: 'Alexandria',    country: 'مصر',          lat: 31.2001,  lng: 29.9187 },
  { name: 'الجيزة',          nameEn: 'Giza',          country: 'مصر',          lat: 30.0131,  lng: 31.2089 },
  { name: 'طرابلس',          nameEn: 'Tripoli',       country: 'ليبيا',        lat: 32.9081,  lng: 13.1805 },
  { name: 'تونس',            nameEn: 'Tunis',         country: 'تونس',         lat: 36.8065,  lng: 10.1815 },
  { name: 'الجزائر',         nameEn: 'Algiers',       country: 'الجزائر',      lat: 36.7372,  lng: 3.0865  },
  { name: 'الرباط',          nameEn: 'Rabat',         country: 'المغرب',       lat: 34.0209,  lng: -6.8416 },
  { name: 'الدار البيضاء',   nameEn: 'Casablanca',    country: 'المغرب',       lat: 33.5731,  lng: -7.5898 },
  { name: 'مراكش',           nameEn: 'Marrakech',     country: 'المغرب',       lat: 31.6295,  lng: -7.9811 },
  { name: 'نواكشوط',         nameEn: 'Nouakchott',    country: 'موريتانيا',    lat: 18.0735,  lng: -15.9582},
  { name: 'الخرطوم',         nameEn: 'Khartoum',      country: 'السودان',      lat: 15.5007,  lng: 32.5599 },

  // Turkey
  { name: 'إسطنبول',         nameEn: 'Istanbul',      country: 'تركيا',        lat: 41.0082,  lng: 28.9784 },
  { name: 'أنقرة',           nameEn: 'Ankara',        country: 'تركيا',        lat: 39.9334,  lng: 32.8597 },
  { name: 'إزمير',           nameEn: 'Izmir',         country: 'تركيا',        lat: 38.4192,  lng: 27.1287 },
  { name: 'بورصة',           nameEn: 'Bursa',         country: 'تركيا',        lat: 40.1826,  lng: 29.0665 },
  { name: 'أنطاليا',         nameEn: 'Antalya',       country: 'تركيا',        lat: 36.8969,  lng: 30.7133 },

  // Iran & Central Asia
  { name: 'طهران',           nameEn: 'Tehran',        country: 'إيران',        lat: 35.6892,  lng: 51.3890 },
  { name: 'مشهد',            nameEn: 'Mashhad',       country: 'إيران',        lat: 36.2605,  lng: 59.6168 },
  { name: 'أصفهان',          nameEn: 'Isfahan',       country: 'إيران',        lat: 32.6546,  lng: 51.6680 },
  { name: 'كابول',           nameEn: 'Kabul',         country: 'أفغانستان',    lat: 34.5553,  lng: 69.2075 },
  { name: 'إسلام آباد',      nameEn: 'Islamabad',     country: 'باكستان',      lat: 33.7294,  lng: 73.0931 },
  { name: 'كراتشي',          nameEn: 'Karachi',       country: 'باكستان',      lat: 24.8607,  lng: 67.0011 },
  { name: 'لاهور',           nameEn: 'Lahore',        country: 'باكستان',      lat: 31.5204,  lng: 74.3587 },
  { name: 'طشقند',           nameEn: 'Tashkent',      country: 'أوزبكستان',    lat: 41.2995,  lng: 69.2401 },
  { name: 'بشكيك',           nameEn: 'Bishkek',       country: 'قرغيزستان',    lat: 42.8746,  lng: 74.5698 },
  { name: 'نور سلطان',       nameEn: 'Astana',        country: 'كازاخستان',    lat: 51.1801,  lng: 71.4460 },

  // South & Southeast Asia
  { name: 'دكا',             nameEn: 'Dhaka',         country: 'بنغلاديش',     lat: 23.8103,  lng: 90.4125 },
  { name: 'كوالالمبور',      nameEn: 'Kuala Lumpur',  country: 'ماليزيا',      lat: 3.1390,   lng: 101.6869},
  { name: 'جاكرتا',          nameEn: 'Jakarta',       country: 'إندونيسيا',    lat: -6.2088,  lng: 106.8456},
  { name: 'مانيلا',          nameEn: 'Manila',        country: 'الفلبين',      lat: 14.5995,  lng: 120.9842},
  { name: 'مومباي',          nameEn: 'Mumbai',        country: 'الهند',        lat: 19.0760,  lng: 72.8777 },
  { name: 'دلهي',            nameEn: 'Delhi',         country: 'الهند',        lat: 28.7041,  lng: 77.1025 },

  // Africa (Sub-Saharan)
  { name: 'داكار',           nameEn: 'Dakar',         country: 'السنغال',      lat: 14.7167,  lng: -17.4677},
  { name: 'نيروبي',          nameEn: 'Nairobi',       country: 'كينيا',        lat: -1.2921,  lng: 36.8219 },
  { name: 'لاغوس',           nameEn: 'Lagos',         country: 'نيجيريا',      lat: 6.5244,   lng: 3.3792  },
  { name: 'أبوجا',           nameEn: 'Abuja',         country: 'نيجيريا',      lat: 9.0579,   lng: 7.4951  },
  { name: 'دار السلام',      nameEn: 'Dar es Salaam', country: 'تنزانيا',      lat: -6.7924,  lng: 39.2083 },
  { name: 'أكرا',            nameEn: 'Accra',         country: 'غانا',         lat: 5.6037,   lng: -0.1870 },
  { name: 'أديس أبابا',      nameEn: 'Addis Ababa',   country: 'إثيوبيا',      lat: 9.1450,   lng: 40.4897 },

  // Europe
  { name: 'لندن',            nameEn: 'London',        country: 'المملكة المتحدة', lat: 51.5074, lng: -0.1278 },
  { name: 'باريس',           nameEn: 'Paris',         country: 'فرنسا',        lat: 48.8566,  lng: 2.3522  },
  { name: 'برلين',           nameEn: 'Berlin',        country: 'ألمانيا',      lat: 52.5200,  lng: 13.4050 },
  { name: 'أمستردام',        nameEn: 'Amsterdam',     country: 'هولندا',       lat: 52.3676,  lng: 4.9041  },
  { name: 'بروكسل',          nameEn: 'Brussels',      country: 'بلجيكا',       lat: 50.8503,  lng: 4.3517  },
  { name: 'ستوكهولم',        nameEn: 'Stockholm',     country: 'السويد',       lat: 59.3293,  lng: 18.0686 },
  { name: 'كوبنهاغن',        nameEn: 'Copenhagen',    country: 'الدنمارك',     lat: 55.6761,  lng: 12.5683 },
  { name: 'أوسلو',           nameEn: 'Oslo',          country: 'النرويج',      lat: 59.9139,  lng: 10.7522 },
  { name: 'روما',            nameEn: 'Rome',          country: 'إيطاليا',      lat: 41.9028,  lng: 12.4964 },
  { name: 'مدريد',           nameEn: 'Madrid',        country: 'إسبانيا',      lat: 40.4168,  lng: -3.7038 },
  { name: 'أثينا',           nameEn: 'Athens',        country: 'اليونان',      lat: 37.9838,  lng: 23.7275 },
  { name: 'سراييفو',         nameEn: 'Sarajevo',      country: 'البوسنة',      lat: 43.8476,  lng: 18.3564 },
  { name: 'تيرانا',          nameEn: 'Tirana',        country: 'ألبانيا',      lat: 41.3275,  lng: 19.8187 },

  // Americas
  { name: 'نيويورك',         nameEn: 'New York',      country: 'الولايات المتحدة', lat: 40.7128, lng: -74.0060 },
  { name: 'لوس أنجلوس',      nameEn: 'Los Angeles',   country: 'الولايات المتحدة', lat: 34.0522, lng: -118.2437},
  { name: 'شيكاغو',          nameEn: 'Chicago',       country: 'الولايات المتحدة', lat: 41.8781, lng: -87.6298 },
  { name: 'هيوستن',          nameEn: 'Houston',       country: 'الولايات المتحدة', lat: 29.7604, lng: -95.3698 },
  { name: 'ديترويت',         nameEn: 'Dearborn',      country: 'الولايات المتحدة', lat: 42.3223, lng: -83.1763 },
  { name: 'تورنتو',          nameEn: 'Toronto',       country: 'كندا',         lat: 43.6532,  lng: -79.3832 },
  { name: 'مونتريال',        nameEn: 'Montreal',      country: 'كندا',         lat: 45.5017,  lng: -73.5673 },
  { name: 'ساو باولو',       nameEn: 'Sao Paulo',     country: 'البرازيل',     lat: -23.5505, lng: -46.6333 },

  // Australia
  { name: 'سيدني',           nameEn: 'Sydney',        country: 'أستراليا',     lat: -33.8688, lng: 151.2093},
  { name: 'ملبورن',          nameEn: 'Melbourne',     country: 'أستراليا',     lat: -37.8136, lng: 144.9631},
];

export const LOCATION_STORAGE_KEY = 'noor_saved_location';

export interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
}
