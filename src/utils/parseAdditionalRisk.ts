import _  from 'lodash';

export type ScrapeyAdditionalRisk = 'PG-13' | 'PG' | 'XXX' | 'XX' | 'X' | 'R'

const lookups: [string | RegExp, ScrapeyAdditionalRisk][] = [
    [/\bPG-13\b/, 'PG-13'],
    [/\bPG\b/, 'PG'],
    [/\bXXX\b/, 'XXX'],
    [/\bXX\b/, 'XX'],
    [/\bX\b/, 'X'],
    [/\bR\b/, 'R'],
];

export default function parseAdditionalRisk(input: string | undefined): ScrapeyAdditionalRisk | undefined {
    input = input ? input : '';

    for (const lookup of lookups) {
        const [key, value] = lookup;
        if (input.match(key)) {
            return value;
        }
    }
}
