import _, {toArray} from 'lodash';

export function parseRaps(row: Element): {countMin?: number; countMax?: number; lengthMax?: number} {
    const maxMatch = row.textContent?.match(/max ↨([0-9]+)ft/i);
    const countMatch = row.textContent?.match(/Raps\: ([0-9]+)(-([0-9]+))?/);

    return {
        countMin: parseInt(countMatch?.[1] || '', 10),
        countMax: parseInt(countMatch?.[3] || countMatch?.[1] || '', 10),
        lengthMax: parseInt(maxMatch?.[1] || '', 10)
    };
}
