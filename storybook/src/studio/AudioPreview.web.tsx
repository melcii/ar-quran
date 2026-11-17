// Listen to an uploaded file in the studio (web).
export default function AudioPreview({ src, testID }: { src: string; testID?: string }) {
  return <audio controls preload="none" src={src} data-testid={testID} style={{ height: 32, maxWidth: 260 }} />;
}
