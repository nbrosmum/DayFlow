import { Tabs } from 'expo-router';
import { Sunrise, ListTodo, Timer, Settings2 } from 'lucide-react-native';
import { colors } from '../../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: '#93998F', tabBarStyle: { height: 66 + insets.bottom, backgroundColor: colors.background, borderTopColor: colors.border, paddingTop: 9, paddingBottom: Math.max(insets.bottom, 8) }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Sunrise size={22} color={color} /> }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ({ color }) => <ListTodo size={22} color={color} /> }} />
    <Tabs.Screen name="focus" options={{ title: 'Focus', tabBarIcon: ({ color }) => <Timer size={22} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings2 size={22} color={color} /> }} />
  </Tabs>;
}
