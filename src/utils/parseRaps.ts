export function parseRaps(value: string): {countMin?: number; countMax?: number; lengthMax?: number} {
    const maxMatch = value?.match(/Max ↕([0-9]+ft$)/i);
    const countMatch = value?.match(/^([0-9]+)(-([0-9]+))?/);

    return {
        countMin: parseInt(countMatch?.[1] || '', 10),
        countMax: parseInt(countMatch?.[3] || countMatch?.[1] || '', 10),
        lengthMax: parseInt(maxMatch?.[1] || '', 10)
    };
}
