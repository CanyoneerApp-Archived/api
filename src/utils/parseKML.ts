import XMLDOM from 'xmldom';
import ToGeoJSON from '@mapbox/togeojson';
import cachedFetch from './cachedFetch';
import FS from 'fs';
import Path from 'path';

const domParser = new XMLDOM.DOMParser();

export default async function parseKML(document: Document) {
    const kmlURLMaybe = document.querySelector('.kmllmenu a')?.getAttribute('href') || undefined;
    const kmlURL = kmlURLMaybe?.endsWith('.kml') ? kmlURLMaybe : undefined;

    const kml = kmlURL && await cachedFetch(kmlURL);
    if (kml && kmlURL) await FS.promises.writeFile(`/Users/lucaswoj/Desktop/kml/${Path.basename(kmlURL)}`, kml);

    return {
        url: kmlURL,
        geoJSON: kmlURL && kml && ToGeoJSON.kml(domParser.parseFromString(await cachedFetch(kmlURL)))
    };
}
