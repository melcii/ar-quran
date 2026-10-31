import { Platform } from 'react-native';

export const colors = {
  paper: '#F7F1E3',
  paperDeep: '#EFE4CC',
  card: '#FFFBF2',
  sand: '#E4CFA4',
  ink: '#3B3326',
  inkSoft: '#6E624E',
  green: '#6F8F6A',
  greenDeep: '#4E6B4B',
  sky: '#9CC3D5',
  skyDeep: '#4F7F98',
  terracotta: '#C2704E',
  gold: '#C59B44',
  line: '#E3D6BA',
  // Scripture panel: kept plain and calm, never decorated.
  scripture: '#FFFDF8',
  scriptureBorder: '#D9C9A3',
  explanation: '#EEF3EA',
  explanationBorder: '#C8D6C2',
  activity: '#FBEDE4',
  activityBorder: '#E9C8B5',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
  quran: 'AmiriQuran_400Regular',
};

export const radius = { sm: 10, md: 16, lg: 24 };

export const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(80, 60, 30, 0.10)' } as object,
  default: {
    shadowColor: '#503C1E',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
