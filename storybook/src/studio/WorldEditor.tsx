// The world editor is 3D and runs in a web browser only.
import { Text, View } from 'react-native';

export default function WorldEditor(_: { n: number }) {
  return (
    <View style={{ padding: 24 }}>
      <Text>The world editor runs in a web browser.</Text>
    </View>
  );
}
