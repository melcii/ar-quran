// Native fallback: the Ark slice is built and tested on the web (WebGL) only.
// Until it runs through expo-gl and is checked on real phones, native opens
// the text screens instead.
import { Redirect } from 'expo-router';

export default function ArkSlice() {
  return <Redirect href="/explore" />;
}
