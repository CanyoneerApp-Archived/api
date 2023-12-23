import {parseIntSafe} from '../../utils/parseIntSafe';

/**
 * RopeWiki stores Hike in a string like 4mi
 */
export default function parseHike(input: string | undefined) {
  if (!input) return {hike: undefined};
  const match = parseFloat(input)
  return {
    overallLengthMeters: Math.round(match * metersPerMile)
  };
}
