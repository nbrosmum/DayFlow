import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DayFlowProvider } from '../state/dayflow';
import { FocusProvider } from '../state/focus';
import { colors } from '../components/ui';

export default function RootLayout() {
  return <SafeAreaProvider><DayFlowProvider><FocusProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="task" options={{ presentation: 'modal' }} /></Stack></FocusProvider></DayFlowProvider></SafeAreaProvider>;
}
