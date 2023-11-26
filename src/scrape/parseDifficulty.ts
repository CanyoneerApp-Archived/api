import {DifficultyV1} from '../types/RouteV1';
import {TechnicalGradeV2 as TechnicalGrade, WaterGradeV2 as WaterGrade} from '../types/RouteV2';

const lookups: [string | RegExp, DifficultyV1][] = [
  [/\b5\.14(a-d)?\b/, '5.14'],
  [/\b5\.13(a-d)?\b/, '5.13'],
  [/\b5\.12(a-d)?\b/, '5.12'],
  [/\b5\.11(a-d)?\b/, '5.11'],
  [/\b5\.10(a-d)?\b/, '5.10'],
  [/\b14(a-d)\b/, '5.14'],
  [/\b13(a-d)\b/, '5.13'],
  [/\b12(a-d)\b/, '5.12'],
  [/\b11(a-d)\b/, '5.11'],
  [/\b10(a-d)\b/, '5.10'],
  [/\b5\.9\b/, '5.9'],
  [/\b5\.8\b/, '5.8'],
  [/\b5\.7\b/, '5.7'],
  [/\b5\.6\b/, '5.6'],

  [/\b5\.5\b/, '5.fun'],
  [/\b5\.4\b/, '5.fun'],
  [/\b5\.3\b/, '5.fun'],
  [/\b5\.2\b/, '5.fun'],
  [/\b5\.1\b/, '5.fun'],
  [/\b5\.0\b/, '5.fun'],
  [/\b5(th)?\b/, '5.fun'],
  ['class five', '5.fun'],
  ['low 5', '5.fun'],

  [/\b4(th)?\b/, 'class 4'],
  ['class four', 'class 4'],
  ['class 4', 'class 4'],

  ['class three', 'class 3'],
  ['class 3', 'class 3'],
  [/\b3(rd)?\b/, 'class 3'],
  ['scrambling', 'class 3'],
  ['nothing technical', 'class 3'],

  ['class 2', 'class 2'],
  ['x country', 'class 2'],
  [/\b2(nd)?\b/, 'class 2'],
  ['cross country', 'class 2'],
  ['bushwack', 'class 2'],
  ['easy', 'class 2'],
  ['walk', 'class 2'],
  ['scramble', 'class 2'],
  ['class two', 'class 2'],
  ['slog', 'class 2'],

  ['class 1', 'class 1'],
  ['class one', 'class 1'],
  ['moderate', 'class 1'],
  ['hike', 'class 1'],
  ['hiking', 'class 1'],
  ['trail', 'class 1'],
  ['strenuous', 'class 1'],

  ['4c', '4c'],
  ['4b', '4b'],
  ['4a', '4a'],
  ['3c', '3c'],
  ['3b', '3b'],
  ['3a', '3a'],
  ['2c', '2c'],
  ['2b', '2b'],
  ['2a', '2a'],
  ['1c', '1c'],
  ['1b', '1b'],
  ['1a', '1a'],
];

export default function parseDifficulty(
  input: string | undefined | null,
): DifficultyV1 | undefined {
  input = input ? input.toLowerCase().replace('-', ' ') : '';

  for (const lookup of lookups) {
    const [key, value] = lookup;
    if (input.match(key)) {
      return value;
    }
  }
}

export const getWaterGrade: {[key: string]: WaterGrade} = {
  '1a': 'A',
  '1b': 'B',
  '1c': 'C',
  '2a': 'A',
  '2b': 'B',
  '2c': 'C',
  '3a': 'A',
  '3b': 'B',
  '3c': 'C',
  '4a': 'A',
  '4b': 'B',
  '4c': 'C',
};

export const getTechnicalGrade: {[key: string]: TechnicalGrade} = {
  '1a': 1,
  '1b': 1,
  '1c': 1,
  '1?': 1,
  '2a': 2,
  '2b': 2,
  '2c': 2,
  '2?': 2,
  '3a': 3,
  '3b': 3,
  '3c': 3,
  '3?': 3,
  '4a': 4,
  '4b': 4,
  '4c': 4,
  '4?': 4,
};
