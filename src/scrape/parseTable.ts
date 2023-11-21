import _, {toArray} from 'lodash';

export function parseTable(tableEl: Element | null | undefined) {
  if (!tableEl) return {};

  const one = _.fromPairs(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    toArray(tableEl!.children).map(tr => {
      const th = tr.querySelector('th');
      if (!th) {
        return [];
      } else {
        return [th.textContent?.slice(0, th.textContent.length - 1), tr.querySelector('td')];
      }
    }),
  );

  const two = _.fromPairs(
    toArray(tableEl.querySelectorAll('div.detailsRow')).map(tr => {
      const th = tr.querySelector('.detailsRowDescriptor');
      if (!th) {
        return [];
      } else {
        // permits has a <u> instead of a <span>
        let found = _.last(tr.querySelectorAll('u'));
        if (found == null) {
          found = _.last(tr.querySelectorAll('span'));
        }
        return [th.textContent?.slice(0, th.textContent.length - 1), found];
      }
    }),
  );

  return {...one, ...two};
}
