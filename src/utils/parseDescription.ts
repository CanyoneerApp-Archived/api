// import _, {toArray} from 'lodash';
// import {encode} from 'node-base64-image';
// import cachedFetch from './cachedFetch';

// const base64EncodeImage = _.memoize((url: string) => cachedFetch(url, url => encode(url, {string: true}) as Promise<string>));

export async function parseDescription(document: Document) {
    let current = document.querySelector('#mw-content-text > h2, #mw-content-text > p');

    const output: string[] = [];
    while (current) {

        // eslint-disable-next-line no-unused-expressions
        // current.querySelectorAll && await Promise.all(toArray(current.querySelectorAll('img'))
        //     .map(async imgEl => {
        //         // eslint-disable-next-line require-atomic-updates
        //         imgEl.src = await base64EncodeImage(imgEl.src);
        //     }));
        output.push(current.innerHTML);
        current = current.nextSibling as Element;
    }

    return output.join('\n');
}
