import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Mosque, Bed, 
  MapPin, Bell, Search, 
  Menu, User, Settings,
  ShieldCheck, Heart, Star,
  Compass, BookOpen, Clock,
  ArrowRight
} from 'lucide-react';
import athkarData from './data/athkar.json';

const ICON_MAP: Record<string, React.ElementType> = {
  Sun, Moon, Mosque, Bed
};

const PRAYER_TIMES = [
  { name: 'الفجر', time: '04:32 AM', status: 'past' },
  { name: 'الشروق', time: '05:54 AM', status: 'past' },
  { name: 'الظهر', time: '12:15 PM', status: 'next' },
  { name: 'العصر', time: '03:45 PM', status: 'upcoming' },
  { name: 'المغرب', time: '06:35 PM', status: 'upcoming' },
  { name: 'العشاء', time: '07:55 PM', status: 'upcoming' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Sidebar - Desktop Only */}
      <aside className="w-20 lg:w-64 glass-card m-4 hidden sm:flex flex-col items-center py-8">
        <div className="mb-12 flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Mosque className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold hidden lg:block">نور المسلم</span>
        </div>

        <nav className="flex-1 w-full px-4 space-y-4">
          <SidebarLink icon={<Clock size={22} />} label="الرئيسية" active />
          <SidebarLink icon={<Compass size={22} />} label="القبلة" />
          <SidebarLink icon={<BookOpen size={22} />} label="القرآن" />
          <SidebarLink icon={<Heart size={22} />} label="الأذكار" />
        </nav>

        <div className="mt-auto px-4 w-full">
          <SidebarLink icon={<Settings size={22} />} label="الإعدادات" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">السلام عليكم، يا محمد</h1>
            <p className="text-slate-400">اليوم هو {currentDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="glass-card p-3 rounded-full hover:bg-white/10">
              <Bell size={20} className="text-slate-300" />
            </button>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 p-1">
              <img src="https://ui-avatars.com/api/?name=Mohammed&background=10B981&color=fff" className="w-full h-full rounded-full" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Aya Card */}
          <section className="lg:col-span-2 space-y-8">
            <div className="glass-card relative overflow-hidden group p-8 min-h-[250px] flex flex-col justify-center text-center">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Mosque size={120} />
              </div>
              <p className="text-2xl arabic leading-loose mb-6 relative">"وَٱذْكُر رَّبَّكَ فِى نَفْسِكَ تَضَرُّعًۭا وَخِيفَةًۭ وَدُونَ ٱلْجَهْرِ مِنَ ٱلْقَوْلِ بِٱلْغُدُوِّ وَٱلْـَٔاصَالِ وَلَا تَكُن مِّنَ ٱلْغَٰفِلِينَ"</p>
              <p className="text-secondary font-semibold italic">[سورة الأعراف: 205]</p>
              
              <div className="mt-8 flex justify-center gap-4">
                <button className="btn-primary">
                  <Star size={18} /> حفظ الآية
                </button>
                <button className="glass-card px-6">
                   مشاركة
                </button>
              </div>
            </div>

            {/* Athkar Categories */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">أذكار اليوم</h2>
                <button className="text-primary flex items-center gap-2 hover:underline">
                  عرض الكل <ArrowRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {athkarData.map((thikr: any) => {
                  const Icon = ICON_MAP[thikr.icon] || Heart;
                  return (
                    <div key={thikr.id} className="glass-card p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-emerald-500/50">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${thikr.color}22` }}>
                        <Icon size={28} style={{ color: thikr.color }} />
                      </div>
                      <h3 className="font-bold text-lg">{thikr.title}</h3>
                      <span className="text-sm text-slate-400">{thikr.count} ذكر</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Prayer Times Column */}
          <aside className="space-y-8">
            <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 backdrop-blur-3xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="text-primary" size={24} /> مواقيت الصلاة
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                   القاهرة، مصر
                </span>
              </div>
              
              <div className="space-y-4">
                {PRAYER_TIMES.map((prayer) => (
                  <div key={prayer.name} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    prayer.status === 'next' 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}>
                    <span className="font-bold">{prayer.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={prayer.status === 'next' ? 'text-white' : 'text-slate-300'}>{prayer.time}</span>
                      {prayer.status === 'next' && <Bell size={16} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary mb-1">الصلاة القادمة</p>
                  <p className="font-bold text-lg">الظهر بعد 45 دقيقة</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin-slow"></div>
              </div>
            </div>

            {/* Qibla Indicator Mock */}
            <div className="glass-card p-6 bg-indigo-500/5 flex flex-col items-center gap-6">
               <h3 className="font-bold">اتجاه القبلة</h3>
               <div className="relative w-40 h-40 rounded-full border-4 border-white/10 flex items-center justify-center">
                  <Compass className="text-indigo-400 animate-pulse" size={48} />
                  <div className="absolute top-0 w-2 h-2 bg-secondary rounded-full"></div>
               </div>
               <p className="text-sm text-slate-400 text-center">يرجى توجيه الهاتف للحصول على أدق النتائج</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-primary text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}>
      {icon}
      <span className="hidden lg:block font-medium">{label}</span>
    </div>
  );
}
