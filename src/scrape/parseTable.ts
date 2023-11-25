import _, {toArray} from 'lodash';

export function parseTable(tableEl: Element | null | undefined): {[id: string]: Element} {
  if (!tableEl) return {};

  const tableRowMap: {[key: string]: Element} = {};
  toArray(tableEl.children).forEach(row => {
    const headerText = row.querySelector('th')?.textContent;
    if (headerText) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const rowName = headerText!.slice(0, headerText!.length - 1);
      tableRowMap[rowName] = row;
    }
  });

  tableEl.querySelectorAll('div.detailsRow').forEach(row => {
    const headerText = row.querySelector('.detailsRowDescriptor')?.textContent;
    if (headerText) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const rowName = headerText!.slice(0, headerText!.length - 1);
      tableRowMap[rowName] = row;
    }
  });
  return tableRowMap;
}

// Different rows have different DOM makeup
export function mostReleventElement(key: string, row: Element): Element | null | undefined {
  if (key == 'Overall' || key == 'Location' || key == 'Best season') {
    return row.querySelector('td');
  } else if (key == 'Red Tape') {
    return _.last(row.querySelectorAll('u'));
  } else {
    return _.last(row.querySelectorAll('span'));
  }
}
