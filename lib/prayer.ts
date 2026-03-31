import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';

export function getTodayPrayerTimes(latitude: number, longitude: number, date: Date = new Date()) {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.UmmAlQura();
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}
