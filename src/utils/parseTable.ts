import _, {toArray} from 'lodash';

export function parseTable(tableEl: Element | null | undefined): any {
    if (!tableEl) return {};

    const one = _.fromPairs(toArray(tableEl!.children).map(tr => {
        const th = tr.querySelector('th');
        if (!th) { return []; } else { return [th.textContent?.slice(0, th.textContent.length - 1), tr.querySelector('td')]; }
    }));

    const two = _.fromPairs(toArray(tableEl.querySelectorAll('div.detailsRow')).map(tr => {
        const th = tr.querySelector('.detailsRowDescriptor');
        if (!th) { return []; } else { return [th.textContent?.slice(0, th.textContent.length - 1), _.last(tr.querySelectorAll('span'))]; }
    }));

    return {...one, ...two};
}
