import jsdom from 'jsdom';
import cachedFetch from './utils/cachedFetch';
import parseAdditionalRisk from './utils/parseAdditionalRisk';
import {parseDescription} from './utils/parseDescription';
import parseDifficulty from './utils/parseDifficulty';
import parseKML from './utils/parseKML';
import parseMonths from './utils/parseMonths';
import {parseRaps} from './utils/parseRaps';
import parseSport from './utils/parseSports';
import {mostReleventElement, parseTable} from './utils/parseTable';
import parseTime from './utils/parseTime';

let first = true;
async function main() {
  console.log('[');

  const urls = await getRouteURLs();
  await Promise.all(
    urls.map(async url => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const route = await parseRoute(url);
        if (first) {
          first = false;
        } else {
          console.log(',');
        }
        console.log(JSON.stringify(route));
      } catch (error) {
        console.error(error);
      }
    }),
  );
  console.log(']');
}

async function getRouteURLs(): Promise<Array<string>> {
  const url =
    'http://ropewiki.com/api.php?action=ask&format=json&query=%5B%5BCategory%3ACanyons%5D%5D%5B%5BHas+coordinates%3A%3A%2B%5D%5D%5B%5BCategory%3ACanyons%5D%5D%0A++%0A++%5B%5BHas+star+rating%3A%3A%210%5D%5D%5B%5BHas+star+rating%3A%3A%211%5D%5D%5B%5BHas+latitude%3A%3A%3E30.412022222222%5D%5D%5B%5BHas+longitude%3A%3A%3E-128.08301666667%5D%5D%5B%5BHas+latitude%3A%3A%3C44.8852%5D%5D%5B%5BHas+longitude%3A%3A%3C-108.54692%5D%5D%7Corder%3Ddescending%2C+ascending%7Csort%3DHas_rank_rating%2C+Has_name|%3FHas_coordinates|%3FHas_star_rating|%3FHas_summary|%3FHas_banner_image_file|%3FHas_location_class|%3FHas_KML_file|limit=2000|offset=0';
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const response = JSON.parse((await cachedFetch(url))!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(response.query.results).map((result: any) => result.fullurl);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseRoute(url: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const text = (await cachedFetch(url))!;
  const {
    window: {document},
  } = new jsdom.JSDOM(text, {url});

  // This generally works but not for linked bluugnome data
  const kml = await parseKML(document);

  const tableElementRowMap = parseTable(document.querySelector('.tablecanyon tbody'));
  const raps = parseRaps(tableElementRowMap['Raps']);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const qualityPopSection = tableElementRowMap['Rating']!;
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
  const popularity =
    tableElements['StarRank'] &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    parseInt(tableElements['StarRank'].querySelector('.starRate > span')!.textContent!.slice(2));
  return {
    URL: url,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Name: document.querySelector('h1')!.textContent!,
    Quality: quality,
    Popularity: popularity,
    Latitude:
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[0]),
    Longitude:
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[1]),
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
    KMLURL: kml.url,
    HTMLDescription: await parseDescription(document),
    GeoJSON: kml.geoJSON,
  };
}

main();
