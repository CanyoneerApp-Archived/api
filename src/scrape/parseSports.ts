import {SportV1} from '../types/RouteV1';

const lookups: [string | RegExp, SportV1][] = [
  ['canyoneering', 'canyoneering'],
  ['trad', 'trad climbing'],
  ['sport', 'sport climbing'],
  ['lead', 'sport climbing'],
  ['hiking', 'hiking'],
  ['mountaineering', 'mountaineering'],
  ['scrambling', 'mountaineering'],
  ['scramble', 'mountaineering'],
  ['bouldering', 'bouldering'],
  ['technical rock', 'trad climbing'],
  ['ski', 'backcountry skiing'],
  ['alpine rock', 'trad climbing'],
  ['technical ice', 'ice climbing'],
  ['backpack', 'hiking'],
  ['hike', 'hiking'],
  ['walk', 'hiking'],
  ['cave', 'caving'],
  ['caving', 'caving'],
  ['class 3', 'mountaineering'],
  ['class 2', 'hiking'],
  ['toprope', 'sport climbing'],
  ['nothing technical', 'mountaineering'],

  // Especially vague
  ['wall', 'trad climbing'],
  ['climb', 'trad climbing'],
  ['ice', 'ice climbing'],
  ['mixed', 'ice climbing'],
  ['trail', 'hiking'],
  ['snow', 'mountaineering'],
  ['slog', 'mountaineering'],
  ['poi', 'hiking'],
];

export default function parseSport(
  input: string | undefined | null,
  defaultOutput: SportV1[] = [],
): SportV1[] {
  input = input ? input.toLowerCase() : '';
  const output: SportV1[] = [];

  for (const lookup of lookups) {
    const [key, value] = lookup;
    if (input.match(key)) {
      output.push(value);
    }
  }

  if (output.length) {
    return output;
  } else {
    return defaultOutput;
  }
}
