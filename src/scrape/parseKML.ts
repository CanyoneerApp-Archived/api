import XMLDOM from 'xmldom';
// @ts-ignore TODO write typescript interafce
import ToGeoJSON from '@mapbox/togeojson';
import {Feature, FeatureCollection} from '@turf/helpers';
import cachedFetch from './cachedFetch';

const domParser = new XMLDOM.DOMParser();

export default async function parseKML(
  document: Document,
): Promise<{url: string | undefined; geojson: FeatureCollection | Feature | undefined}> {
  const url = document.querySelector('.kmllmenu a')?.getAttribute('href') ?? undefined;

  if (!url || !new URL(url, document.URL).pathname.endsWith('.kml')) {
    return {url, geojson: undefined};
  } else {
    return {
      url,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      geojson: ToGeoJSON.kml(domParser.parseFromString((await cachedFetch(url))!)),
    };
  }
}
