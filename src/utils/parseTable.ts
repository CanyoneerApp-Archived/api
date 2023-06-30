import _, {toArray} from 'lodash';

export function parseTable(tableEl: Element | null | undefined): any {
    if (!tableEl) return {};

    return _.fromPairs(toArray(tableEl!.children).map(tr => {
        const th = tr.querySelector('th');
        if (!th) { return []; } else { return [th.textContent?.slice(0, th.textContent.length - 1), tr.querySelector('td')]; }
    }));
}
