import jsdom from 'jsdom';
import cachedFetch from './cachedFetch';
import parseAdditionalRisk from './parseAdditionalRisk';
import {parseDescription} from './parseDescription';
import parseDifficulty from './parseDifficulty';
import parseKML from './parseKML';
import parseMonths from './parseMonths';
import {parseRaps} from './parseRaps';
import parseSport from './parseSports';
import {parseTable} from './parseTable';
import parseTime from './parseTime';

let first = true;
async function main() {
  console.log('[');
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await Promise.all(
    (await getRouteURLs()).map(async url => {
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

  const tableElements = parseTable(document.querySelector('.tablecanyon tbody'));
  const rating = tableElements['Difficulty']?.textContent.trim() ?? '';
  const raps = parseRaps(tableElements['Raps']?.textContent.trim());
  const kml = await parseKML(document);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const qualityPopSection = tableElements['Rating']!;
  const quality =
    qualityPopSection.querySelectorAll('.starRate4')?.length ??
    0 + (qualityPopSection.querySelectorAll('.starRate2')?.length ?? 0) / 2;

  // TODO popularity is currently broken
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
    Months: parseMonths(tableElements),
    Difficulty: parseDifficulty(rating),
    AdditionalRisk: parseAdditionalRisk(rating),
    Vehicle: tableElements['Vehicle']?.textContent.trim(),
    Shuttle: tableElements['Shuttle']?.textContent.trim(),
    Permits: tableElements['Red Tape']?.textContent.trim(),
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
