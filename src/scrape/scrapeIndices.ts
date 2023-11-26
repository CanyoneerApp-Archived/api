import assert from 'assert';
import {logger} from '../logger';
import {IndexRouteV2, TechnicalGradeV2, WaterGradeV2} from '../types/RouteV2';
import cachedFetch from './cachedFetch';
import {validate as validateSchema} from './getValidator';
import {parseIntSafe} from './parseIntSafe';
import parseRappelCount from './parseRappelCount';

interface FetchIndicesOptions {
  regions: string[];
}

const apiResponse = {
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
  // 'Min Time': 'Has fastest typical time',
  // 'Max Time': 'Has slowest typical time',
  // Hike: 'Has length of hike',
  permits: 'Requires permits',
  rappelCount: 'Has info rappels',
  // URL: 'Has url',
  rappelLongest: 'Has longest rappel',
  months: 'Has best month',
  shuttle: 'Has shuttle length',
  vehicle: 'Has vehicle type',
};

type APIResponse = {
  fulltext: string;
  fullurl: string;
  namespace: number;
  exists: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  printouts: {[Key in keyof typeof apiResponse]: any};
};

export async function scrapeIndices({regions}: FetchIndicesOptions) {
  const output: IndexRouteV2[] = [];

  for (const region of regions) {
    const url = new URL('https://ropewiki.com/index.php');
    url.searchParams.append('title', 'Special:Ask');

    const propertiesEncoded = Object.entries(apiResponse)
      .map(([a, b]) => `${encode(b)}=${encode(a)}`)
      .join('/-3F');

    url.searchParams.append(
      'x',
      `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3F${propertiesEncoded}`,
    );
    url.searchParams.append('format', 'json');

    // The API does not support returning more than 2000 results
    url.searchParams.append('limit', '2000');

    const text = await cachedFetch(url);
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

      if (!result.printouts.coordinates[0]?.lat || !result.printouts.coordinates[0]?.lon) continue;

      const route: IndexRouteV2 = {
        url: result.fullurl,
        latitude: result.printouts.coordinates[0]?.lat,
        longitude: result.printouts.coordinates[0]?.lon,
        id: result.printouts.pageid[0],
        name: result.printouts.name[0],
        quality: result.printouts.quality[0],
        months: result.printouts.months,
        technicalRating: parseIntSafe(result.printouts.technicalRating[0]) as TechnicalGradeV2,
        waterRating: result.printouts.waterRating[0] as WaterGradeV2,
        timeRating: result.printouts.timeRating[0],
        riskRating: result.printouts.riskRating[0],
        permit: result.printouts.permits[0],
        ...parseRappelCount(result.printouts.rappelCount[0]),
        rappelLongestMeters: result.printouts.rappelLongest[0]?.value
          ? result.printouts.rappelLongest[0].value * METERS_PER_FOOT
          : undefined,
        vehicle: result.printouts.vehicle[0],
        shuttleMinutes: result.printouts.shuttle[0]?.value,
      };

      validateSchema('IndexRouteV2', route);

      output.push(route);
    }
  }

  return output;
}

function encode(input: string) {
  return encodeURIComponent(input).replace(/%/g, '-');
}

export const METERS_PER_FOOT = 0.3048;
