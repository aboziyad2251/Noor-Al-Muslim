import { Tabs } from 'expo-router';
import { BookOpen, Compass, Heart, Home, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981', // primary
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Tajawal',
          fontSize: 12,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'اكتشف',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'القرآن',
          tabBarIcon: ({ color, size }) => (
            <View className="bg-emerald-500 -mt-8 w-14 h-14 rounded-full items-center justify-center border-4 border-[#0F172A]">
              <BookOpen color="white" size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dua"
        options={{
          title: 'أدعية',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ملفي',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
