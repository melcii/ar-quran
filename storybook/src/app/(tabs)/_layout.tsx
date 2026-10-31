import { Tabs } from 'expo-router/js-tabs';
import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts } from '@/theme';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: unknown }) => <Icon name={icon} size={26} color={String(color)} />,
  tabBarAccessibilityLabel: title,
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 68, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="explore" options={tab('Explore', 'home')} />
      <Tabs.Screen name="stories" options={tab('Stories', 'stories')} />
      <Tabs.Screen name="quran" options={tab('Quran', 'quran')} />
      <Tabs.Screen name="journey" options={tab('My Journey', 'journey')} />
      <Tabs.Screen name="parents" options={tab('Parents', 'parents')} />
    </Tabs>
  );
}
