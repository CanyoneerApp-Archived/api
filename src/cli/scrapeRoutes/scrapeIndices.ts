import assert from 'assert';
import {round} from 'lodash';
import {RouteV2, TechnicalGradeV2, WaterGradeV2} from '../../types/v2';
import {validate as validateSchema} from '../../utils/getValidator';
import {logger} from '../../utils/logger';
import {metersPerFoot} from '../../utils/metersPerFoot';
import {parseIntSafe} from '../../utils/parseIntSafe';
import cachedFetch from './cachedFetch';
import parseHike from './parseHike';
import parseRappelCount from './parseRappelCount';
const apiRequestPrintouts = {
  pageid: 'Has pageid',
  name: 'Has name',
  coordinates: 'Has coordinates',
  region: 'Located in region',
  quality: 'Has user rating',
  rating: 'Has rating',
  timeRating: 'Has time rating',
  kmlUrl: 'Has KML file',
  technicalRating: 'Has technical rating',
  waterRating: 'Has water rating',
  riskRating: 'Has extra risk rating',
  permits: 'Requires permits',
  rappelCount: 'Has info rappels',
  rappelLongest: 'Has longest rappel',
  months: 'Has best month',
  shuttle: 'Has shuttle length',
  vehicle: 'Has vehicle type',
  minTime: 'Has fastest typical time',
  maxTime: 'Has slowest typical time',
  hike: 'Has info length of hike',
  lastModified: 'Modification date',
};

type APIResponse = {
  fulltext: string;
  fullurl: string;
  namespace: number;
  exists: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  printouts: {[Key in keyof typeof apiRequestPrintouts]: any};
};

export async function scrapeIndices(regions: string[], cachePath: string) {
  const output: RouteV2[] = [];

  const totalCount = regions.length;
  let doneCount = 0;

  for (const region of regions) {
    const url = new URL('https://ropewiki.com/index.php');
    url.searchParams.append('title', 'Special:Ask');

    const propertiesEncoded = Object.entries(apiRequestPrintouts)
      .map(([a, b]) => `${encode(b)}=${encode(a)}`)
      .join('/-3F');

    url.searchParams.append(
      'x',
      `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3F${propertiesEncoded}`,
    );
    url.searchParams.append('format', 'json');

    // The API does not support returning more than 2000 results
    url.searchParams.append('limit', '2000');

    const text = await cachedFetch(url, 'utf-8', cachePath);
    const json = text && JSON.parse(text);
    const results: APIResponse[] = Object.values(json?.results ?? {});

    if (results.length === 2000) {
      logger.warn(
        `Reached limit of 2000 results for ${region}. The output will be missing canyons unless you break this region up into its child regions.`,
      );
    }

    for (const result of results) {
      assert(['minutes', undefined].includes(result.printouts['shuttle'][0]?.units));
      assert(['ft', undefined].includes(result.printouts['rappelLongest'][0]?.units));

      const lat = result.printouts.coordinates[0]?.lat;
      const lon = result.printouts.coordinates[0]?.lon;

      if (!lat || !lon) continue;

      const route: RouteV2 = {
        url: result.fullurl,
        latitude: round(lat, 5),
        longitude: round(lon, 5),
        id: parseInt(result.printouts.pageid[0]),
        name: result.printouts.name[0],
        quality: result.printouts.quality[0] || undefined,
        months: result.printouts.months.length ? result.printouts.months : undefined,
        technicalRating: parseIntSafe(result.printouts.technicalRating[0]) as TechnicalGradeV2,
        waterRating: result.printouts.waterRating[0] as WaterGradeV2,
        timeRating: result.printouts.timeRating[0],
        riskRating: result.printouts.riskRating[0],
        permit: result.printouts.permits[0],
        ...parseRappelCount(result.printouts.rappelCount[0]),
        rappelLongestMeters:
          result.printouts.rappelLongest[0]?.value ?
            round(result.printouts.rappelLongest[0].value * metersPerFoot, 2)
          : undefined,
        vehicle: result.printouts.vehicle[0],
        overallFastestTimeSeconds:
          result.printouts.minTime[0]?.value != null ?
            Math.round(result.printouts.minTime[0].value * 60 * 60)
          : undefined,
        overallSlowestTimeSeconds:
          result.printouts.maxTime[0]?.value != null ?
            Math.round(result.printouts.maxTime[0].value * 60 * 60)
          : undefined,
        ...parseHike(result.printouts.hike[0]),
        lastModified: result.printouts.lastModified[0],
        shuttleSeconds:
          result.printouts.shuttle[0]?.value ? result.printouts.shuttle[0].value * 60 : undefined,
        description: undefined, // this is populated by `scrapeDescription` later
        geojson: undefined, // this is populated by `scrapeKMLs` later
        version: '', // this is populated by `injectVersions` later
      };

      validateSchema('RouteV2', route);

      output.push(route);
    }

    doneCount++;
    logger.progress(totalCount, doneCount, region);
  }

  return output;
}

function encode(input: string) {
  return encodeURIComponent(input).replace(/%/g, '-');
}
