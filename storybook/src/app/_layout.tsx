import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RecitationBar } from '@/components/RecitationBar';
import { AppStateProvider } from '@/state/AppState';
import { RecitationProvider } from '@/state/Recitation';
import { colors } from '@/theme';

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Nunito_400Regular,
    Nunito_700Bold,
    AmiriQuran_400Regular,
  });

  // On the web, remove the plain loading message that the page shows before the app starts.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    (window as any).__booted = true;
    document.getElementById('boot')?.remove();
  }, []);

  // If a font cannot load, carry on with the fallback fonts rather than wait forever.
  if (!loaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <RecitationProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade' }} />
          <RecitationBar />
        </RecitationProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
