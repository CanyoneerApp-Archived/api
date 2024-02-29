/**
 * RopeWiki stores Hike in a string like 4mi
 */
const metersPerMile = 1609.34;

export default function parseHike(input: string | undefined) {
  if (!input) return {overallLengthMeters: undefined};
  const match = parseFloat(input);
  return {
    overallLengthMeters: Math.round(match * metersPerMile),
  };
}
