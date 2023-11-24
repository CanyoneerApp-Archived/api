import {Feature} from '@turf/helpers';
import jsdom from 'jsdom';
import {IndexRoute, Route, RouteGeoJSONFeature} from './Route';
import cachedFetch, {md5} from './cachedFetch';
import parseAdditionalRisk from './parseAdditionalRisk';
import {parseDescription} from './parseDescription';
import parseDifficulty, {getTechnicalGrade, getWaterGrade} from './parseDifficulty';
import parseKML from './parseKML';
import parseMonths from './parseMonths';
import {parseRaps} from './parseRaps';
import parseSport from './parseSports';
import {mostReleventElement, parseTable} from './parseTable';
import parseTime from './parseTime';

export async function scrapeRoute(url: string): Promise<Route | undefined> {
  const text = await cachedFetch(url);
  if (!text) return undefined;

  const {
    window: {document},
  } = new jsdom.JSDOM(text, {url});

  // This generally works but not for linked bluugnome data
  const kml = await parseKML(document);

  const tableElementRowMap = parseTable(document.querySelector('.tablecanyon tbody'));
  const raps = parseRaps(tableElementRowMap['Raps']);
  const qualityPopSection = tableElementRowMap['Rating'];
  const quality =
    qualityPopSection.querySelectorAll('.starRate4')?.length ??
    0 + (qualityPopSection.querySelectorAll('.starRate2')?.length ?? 0) / 2;
  const months = parseMonths(tableElementRowMap['Best season']);
  const vehicle = tableElementRowMap['Vehicle']?.textContent?.trim().replace('Vehicle:', '');

  // Typically we just need the last element
  const tableElements: {[key: string]: Element | undefined | null} = {};
  for (const key in tableElementRowMap) {
    tableElements[key] = mostReleventElement(key, tableElementRowMap[key]);
  }
  const rating = tableElements['Difficulty']?.textContent?.trim() ?? '';

  if (!parseSport(rating, ['canyoneering']).includes('canyoneering')) {
    return undefined;
  }

  const difficulty = parseDifficulty(rating);

  const geojson =
    kml.geoJSON?.type === 'FeatureCollection'
      ? kml.geoJSON
      : kml.geoJSON
        ? {type: 'FeatureCollection', features: [kml.geoJSON]}
        : undefined;

  const index: IndexRoute = {
    id: md5(url),
    name: document.querySelector('h1')?.textContent ?? 'Unknown',
    quality: quality,
    months: months,
    additionalRisk: parseAdditionalRisk(rating),
    vehicle: vehicle,
    shuttle: tableElements['Shuttle']?.textContent?.trim(),
    permits: tableElements['Red Tape']?.textContent?.trim(),
    technicalGrade: getTechnicalGrade[difficulty ?? ''],
    waterGrade: getWaterGrade[difficulty ?? ''],
    timeGrade: parseTime(rating),
    rappelCountMin: raps.countMin,
    rappelCountMax: raps.countMax,
    rappelLengthMax: raps.lengthMax,
  };

  return {
    ...index,
    latitude: parseFloat(tableElements['Location']?.textContent?.split(',')[0] ?? ''),
    longitude: parseFloat(tableElements['Location']?.textContent?.split(',')[1] ?? ''),
    url: url,
    description: await parseDescription(document),
    geojson: geojson && {
      type: 'FeatureCollection',
      features: geojson.features.map(
        (feature: Feature) =>
          ({
            ...feature,
            properties: {
              ...feature.properties,
              ...Object.fromEntries(
                Object.entries(index).map(([key, value]) => [`route.${key}`, value]),
              ),
            },
          }) as unknown as RouteGeoJSONFeature,
      ),
    },
  };
}
