import XMLDOM from 'xmldom';
import ToGeoJSON from '@mapbox/togeojson';
import cachedFetch from './cachedFetch';

const domParser = new XMLDOM.DOMParser();

export default async function parseKML(document: Document) {
    const url = document.querySelector('.kmllmenu a')?.getAttribute('href');

    if (!url || !new URL(url, document.URL).pathname.endsWith('.kml')) {
        return {url, geoJSON: undefined};
    } else {
        return {
            url,
            geoJSON: ToGeoJSON.kml(domParser.parseFromString(await cachedFetch(url)))
        };
    }
}
