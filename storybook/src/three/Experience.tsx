// Native fallback: the 3D experience runs only on the web for now, so phones
// and tablets open the 2D Explore screen instead.
import { Redirect } from 'expo-router';

export default function Experience() {
  return <Redirect href="/explore" />;
}
