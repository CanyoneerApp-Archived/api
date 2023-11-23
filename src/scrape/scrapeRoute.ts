import jsdom from 'jsdom';
import {LegacyRoute as Route} from './LegacyRoute';
import cachedFetch from './cachedFetch';
import parseAdditionalRisk from './parseAdditionalRisk';
import {parseDescription} from './parseDescription';
import parseDifficulty from './parseDifficulty';
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

  // popularity is currently broken
  const popularity = parseInt(
    tableElements['StarRank']?.querySelector('.starRate > span')?.textContent?.slice(2) ?? '',
  );

  return {
    URL: url,
    Name: document.querySelector('h1')?.textContent ?? 'Unknown',
    Quality: quality,
    Popularity: popularity ?? undefined,
    Latitude: parseFloat(tableElements['Location']?.textContent?.split(',')[0] ?? ''),
    Longitude: parseFloat(tableElements['Location']?.textContent?.split(',')[1] ?? ''),
    Months: months,
    Difficulty: parseDifficulty(rating),
    AdditionalRisk: parseAdditionalRisk(rating),
    Vehicle: vehicle,
    Shuttle: tableElements['Shuttle']?.textContent?.trim(),
    Permits: tableElements['Red Tape']?.textContent?.trim(),
    Sports: parseSport(rating, ['canyoneering']),
    Time: parseTime(rating),
    RappelCountMin: raps.countMin,
    RappelCountMax: raps.countMax,
    RappelLengthMax: raps.lengthMax,
    KMLURL: kml.url ?? undefined,
    HTMLDescription: await parseDescription(document),
    GeoJSON: kml.geoJSON,
  };
}
