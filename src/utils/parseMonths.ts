
import _, {toArray} from 'lodash';

export type Month = (
    'January' |
    'Feburary' |
    'March' |
    'April' |
    'May' |
    'June' |
    'July' |
    'August' |
    'September' |
    'October' |
    'November' |
    'December');


const monthLookup: Month[] = [
    'January',
    'Feburary',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export default function parseMonths(months: Element): Month[] {
    return _.compact(toArray(months.querySelectorAll('.wikitable.bst td:not(.bss)')).map((el, index) => (el.className === 'bsg' ? monthLookup[index] : undefined)));
}
