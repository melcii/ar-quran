import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'stories'
  | 'quran'
  | 'journey'
  | 'parents'
  | 'play'
  | 'pause'
  | 'replay'
  | 'next'
  | 'previous'
  | 'stop'
  | 'bookmark'
  | 'bookmarked'
  | 'back'
  | 'close'
  | 'speaker'
  | 'search'
  | 'plus'
  | 'minus'
  | 'check'
  | 'motion'
  | 'still'
  | 'book';

const paths: Record<IconName, string> = {
  home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z',
  stories: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h9M19 7v13',
  quran: 'M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13',
  journey: 'M5 20c0-4 4-4 6-7s-1-5 2-7 6 0 6 0M5 20h.01M19 6h.01',
  parents: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9 12l2 2 4-4',
  play: 'M8 5.5v13l10-6.5z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  replay: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  next: 'M6 6l8 6-8 6zM17 6v12',
  previous: 'M18 6l-8 6 8 6zM7 6v12',
  stop: 'M7 7h10v10H7z',
  bookmark: 'M6 4h12v17l-6-4-6 4z',
  bookmarked: 'M6 4h12v17l-6-4-6 4z',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6 6 18',
  speaker: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  motion: 'M3 9c3-3 6 3 9 0s6-3 9 0M3 15c3-3 6 3 9 0s6-3 9 0',
  still: 'M3 9h18M3 15h18',
  book: 'M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h5z',
};

const filled: Partial<Record<IconName, true>> = { play: true, pause: true, stop: true, bookmarked: true, next: true, previous: true };

export function Icon({ name, size = 24, color = '#3B3326', strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const isFilled = filled[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={paths[name]}
        fill={isFilled ? color : 'none'}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {name === 'journey' && <Circle cx="5" cy="20" r="1.6" fill={color} />}
    </Svg>
  );
}
