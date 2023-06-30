import _ from 'lodash';

type ScrapeyTime = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

const lookups: [string | RegExp, ScrapeyTime][] = [
    [/\biii\b/, 'III'],
    [/\bii\b/, 'II'],
    [/\biv\b/, 'IV'],
    [/\bvi\b/, 'VI'],
    [/\bi\b/, 'I'],
    [/\bv\b/, 'V'],
    ['less than two hours', 'I'],
    ['half a day', 'II'],
    ['most of a day', 'III'],
    ['a long day', 'IV'],
    ['one day', 'IV'],
    ['two days', 'V'],
    ['a few days', 'V'],
    ['overnight', 'V'],
];

export default function parseDifficulty(input: string | undefined): ScrapeyTime | undefined {
    input = input ? JSON.stringify(input.toLowerCase().replace('-', ' ')) : '';

    for (const lookup of lookups) {
        const [key, value] = lookup;
        if (input.match(key)) {
            return value;
        }
    }

    // if (input.length) {
    //     console.error(`WARNING: Could not parse time "${input}"`);
    // }
}
