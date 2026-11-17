// A plain file chooser for audio uploads (web).
export default function FilePick({ onPick, accept = 'audio/*', testID }: { onPick: (f: File | null) => void; accept?: string; testID?: string }) {
  return <input type="file" accept={accept} data-testid={testID} aria-label="Choose an audio file" onChange={(e) => onPick(e.currentTarget.files?.[0] ?? null)} style={{ fontSize: 14 }} />;
}
