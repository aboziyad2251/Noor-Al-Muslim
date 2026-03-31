// @ts-expect-error hijri-date is not typed
import HijriDate from 'hijri-date';

const ARABIC_MONTHS = [
  'محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'
];

export function getTodayHijriArabic(): string {
  try {
    const today = new HijriDate();
    const day = today.getDate();
    const month = ARABIC_MONTHS[today.getMonth() - 1];
    const year = today.getFullYear();
    
    return `${day} ${month} ${year} هـ`;
  } catch (e) {
    return 'التاريخ الهجري غير متاح';
  }
}
