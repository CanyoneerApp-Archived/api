import jsdom from 'jsdom';
import {Route} from './Route';
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

  const difficulty = parseDifficulty(rating);

  return {
    URL: url,
    Name: document.querySelector('h1')?.textContent ?? 'Unknown',
    Quality: quality,
    Popularity: popularity ?? undefined,
    Latitude: parseFloat(tableElements['Location']?.textContent?.split(',')[0] ?? ''),
    Longitude: parseFloat(tableElements['Location']?.textContent?.split(',')[1] ?? ''),
    Months: months,
    Difficulty: difficulty,
    WaterDifficulty: waterLookup[difficulty ?? ''],
    TechnicalDifficulty: technicalLookup[difficulty ?? ''],
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

const waterLookup: {[key: string]: Route['WaterDifficulty']} = {
  '1a': 'a',
  '1b': 'b',
  '1c': 'c',
  '2a': 'a',
  '2b': 'b',
  '2c': 'c',
  '3a': 'a',
  '3b': 'b',
  '3c': 'c',
  '4a': 'a',
  '4b': 'b',
  '4c': 'c',
};

const technicalLookup: {[key: string]: Route['TechnicalDifficulty']} = {
  '1a': 1,
  '1b': 1,
  '1c': 1,
  '1?': 1,
  '2a': 2,
  '2b': 2,
  '2c': 2,
  '2?': 2,
  '3a': 3,
  '3b': 3,
  '3c': 3,
  '3?': 3,
  '4a': 4,
  '4b': 4,
  '4c': 4,
  '4?': 4,
};
