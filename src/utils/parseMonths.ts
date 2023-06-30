
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


const months: Month[] = [
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

export default function parseMonths(tableElements: any): Month[] {
    return _.compact(tableElements['Best season'] && toArray(tableElements['Best season'].querySelectorAll('.wikitable.bst td:not(.bss)')).map((el, index) => (el.className === 'bsg' ? months[index] : undefined)));
}
