// Native fallback: the dressing room is 3D and built and tested on the web
// (WebGL) only, like the adventure worlds.
import { Redirect } from 'expo-router';

export default function DressingRoom() {
  return <Redirect href="/explore" />;
}
