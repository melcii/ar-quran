// Native fallback: the adventure worlds are built and tested on the web
// (WebGL) only. Until they run through expo-gl and are checked on real
// phones, native opens the text screens instead.
import { Redirect } from 'expo-router';

export default function Adventure(_: { n: number }) {
  return <Redirect href="/explore" />;
}
