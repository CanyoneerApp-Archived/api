import XMLDOM from 'xmldom';
// @ts-ignore TODO write typescript interafce
import ToGeoJSON from '@mapbox/togeojson';
import cachedFetch, {CachedFetchOptions} from './cachedFetch';

const domParser = new XMLDOM.DOMParser();

export default async function parseKML(document: Document, options: CachedFetchOptions) {
  const url = document.querySelector('.kmllmenu a')?.getAttribute('href');

  if (!url || !new URL(url, document.URL).pathname.endsWith('.kml')) {
    return undefined;
  }

  const string = await cachedFetch(url, options);
  if (!string) {
    return undefined;
  }

  return {
    url,
    geoJSON: ToGeoJSON.kml(domParser.parseFromString(string)),
  };
}
