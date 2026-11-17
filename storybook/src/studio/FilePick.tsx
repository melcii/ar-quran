// Uploads use the web studio's file chooser.
import { Text } from 'react-native';
export default function FilePick(_: { onPick: (f: any) => void; accept?: string; testID?: string }) {
  return <Text>Upload audio from the web studio.</Text>;
}
