import { Stars as StarMeter } from '@/components/ui/Stars';

export function starRatingDisplay(stars: number, max = 5) {
  return <StarMeter count={stars} max={max} size={13} emptyColor="rgb(var(--border))" />;
}
