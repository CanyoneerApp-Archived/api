import _, {toArray} from 'lodash';

export function parseTable(tableEl: Element | null | undefined): { [id: string]: Element; } {
    if (!tableEl) return {};

    var tableRowMap = {};
    toArray(tableEl.children).forEach(function (row) { 
        const headerText = row.querySelector('th')?.textContent;        
        if (headerText) { 
            const rowName = headerText!.slice(0, headerText!.length - 1)
            tableRowMap[rowName] = row
        } 
    })

    tableEl.querySelectorAll('div.detailsRow').forEach(function (row) { 
        const headerText = row.querySelector('.detailsRowDescriptor')?.textContent;        
        if (headerText) { 
            const rowName = headerText!.slice(0, headerText!.length - 1)
            tableRowMap[rowName] = row
        } 
    })
    return tableRowMap
}

// Different rows have different DOM makeup
export function mostReleventElement(key: string, row: Element): Element | null | undefined {
    if (key == "Overall" || key == "Location" || key == "Best season") {
        return row.querySelector('td')
    } else if (key == "Red Tape") {
        return _.last(row.querySelectorAll('u'))
    } else {
        return _.last(row.querySelectorAll('span'))
    }
}