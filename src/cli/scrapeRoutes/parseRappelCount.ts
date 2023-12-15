import {parseIntSafe} from '../../utils/parseIntSafe';

/**
 * RopeWiki stores rappel counts in a string format like "1r" or "1-2r"
 */
export default function parseRappelCount(input: string | undefined) {
  if (!input) return {rappelCountMin: undefined, rappelCountMax: undefined};
  const match = input.match(/([0-9+])(-([0-9+]))?r/);
  return {
    rappelCountMin: parseIntSafe(match?.[1]),
    rappelCountMax: parseIntSafe(match?.[3] ?? match?.[1]),
  };
}
