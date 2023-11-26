import XMLDOM from '@xmldom/xmldom';
// @ts-ignore TODO write typescript interafce
import ToGeoJSON from '@mapbox/togeojson';
import {Feature, FeatureCollection} from '@turf/helpers';
import cachedFetch from './cachedFetch';

const domParser = new XMLDOM.DOMParser();

interface ParseKMLOutput {
  url: string | undefined;
  geoJSON: FeatureCollection | Feature | undefined;
}

export default async function parseKML(document: Document): Promise<ParseKMLOutput> {
  const url = document.querySelector('.kmllmenu a')?.getAttribute('href') ?? undefined;

  if (!url || !new URL(url, document.URL).pathname.endsWith('.kml')) {
    return {url, geoJSON: undefined};
  } else {
    return {
      url,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      geoJSON: ToGeoJSON.kml(domParser.parseFromString((await cachedFetch(url))!)),
    };
  }
}
