import XMLDOM from 'xmldom';
// @ts-ignore TODO write typescript interafce
import ToGeoJSON from '@mapbox/togeojson';
import cachedFetch, {CachedFetchOptions} from './cachedFetch';

const domParser = new XMLDOM.DOMParser();

export default async function parseKML(document: Document, options: CachedFetchOptions) {
  const url = document.querySelector('.kmllmenu a')?.getAttribute('href');

  if (!url || !new URL(url, document.URL).pathname.endsWith('.kml')) {
    return {url, geoJSON: undefined};
  } else {
    return {
      url,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      geoJSON: ToGeoJSON.kml(domParser.parseFromString((await cachedFetch(url, options))!)),
    };
  }
}
