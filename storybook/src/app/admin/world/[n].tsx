// The 3D world editor for one surah (web only).
import { useLocalSearchParams } from 'expo-router';
import WorldEditor from '@/studio/WorldEditor';

export default function WorldEditorRoute() {
  const { n } = useLocalSearchParams<{ n: string }>();
  return <WorldEditor n={Number(n)} />;
}
