import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RecitationBar } from '@/components/RecitationBar';
import { AppStateProvider } from '@/state/AppState';
import { RecitationProvider } from '@/state/Recitation';
import { colors } from '@/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Nunito_400Regular,
    Nunito_700Bold,
    AmiriQuran_400Regular,
  });

  if (!loaded) {
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
