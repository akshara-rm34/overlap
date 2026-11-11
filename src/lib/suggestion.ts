import { formatRange } from './dates';
import type { Match } from './matches';
import type { Profile } from './profile';

// Suggested first message (F22). Built from the overlap and the other person's housing status,
// so it says something specific instead of just "hi".
export function suggestedMessage(me: Profile | null, match: Match): string {
  const first = match.card.firstName;
  const city = me?.city?.split(',')[0];
  const where = city ? ` in ${city}` : '';
  const overlap = formatRange(match.overlapStart, match.overlapEnd);

  let ask = 'Are you still looking for a roommate?';
  if (match.card.housingStatus === 'have_place') ask = 'Is the room at your place still open?';
  if (match.card.housingStatus === 'search_together') {
    ask = 'Want to look for a place together?';
  }

  return `Hi ${first}! Looks like we’re both${where} from ${overlap}. ${ask}`;
}
