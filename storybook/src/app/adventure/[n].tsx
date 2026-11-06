// One adventure world, for the surah in the address (/adventure/1 … /adventure/10).
import { useLocalSearchParams } from 'expo-router';
import Adventure from '@/adventure/Adventure';

export default function AdventureRoute() {
  const { n } = useLocalSearchParams<{ n: string }>();
  return <Adventure n={Number(n)} />;
}
