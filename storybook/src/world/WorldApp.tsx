// Native fallback for now: the 3D world is built and tested on the web only.
// The plan for phones is the same scene through expo-gl; until that is built
// and tested on devices, native opens the text screens instead.
import { Redirect } from 'expo-router';

export default function WorldApp() {
  return <Redirect href="/explore" />;
}
