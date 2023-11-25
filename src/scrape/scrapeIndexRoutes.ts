import assert from 'assert';
import {IndexRoute, TechnicalGrade, WaterGrade} from '../Route';
import {logger} from '../logger';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';

export const allRegions = [
  'Asia',
  'Central America',
  'Albania',
  'Austria',
  'Bavaria',
  'Friuli Venezia Giulia',
  'Lombardia',
  'Piemonte',
  "Provence-Alpes-Cote d'Azur",
  'Slovenia',
  'Switzerland',
  'Trentino-Alto Adige',
  "Valle d'Aosta",
  'Andorra',
  'Bulgaria',
  'Croatia',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Islas Canarias',
  'Italy',
  'Lithuania',
  'Macedonia',
  'Montenegro',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Spain',
  'Turkey',
  'United Kingdom',
  'Middle East',
  'Canada',
  'Mexico',
  'Northeast',
  'Pacific Northwest',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Utah',
  'Colorado',
  'Connecticut',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Maine',
  'Massachusetts',
  'Montana',
  'Nevada',
  'New Mexico',
  'New York',
  'North Carolina',
  'Oregon',
  'South Carolina',
  'South Dakota',
  'Texas',
  'Utah',
  'Virginia',
  'Washington',
  'West Desert',
  'Wyoming',
  'Pacific',
  'South America',
  'Argentina',
  'Bolivia',
  'Brazil',
  'Chile',
  'Colombia',
  'Ecuador',
  'Peru',
  'Playa Montezuma',
  'Venezuela',
];

interface FetchIndexRoutesOptions {
  regions: string[];
}

export async function scrapeIndexRoutes({regions}: FetchIndexRoutesOptions) {
  const output: IndexRoute[] = [];

  for (const region of regions) {
    const url = new URL('https://ropewiki.com/index.php');
    url.searchParams.append('title', 'Special:Ask');

    const properties = {
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
      'Min Time': 'Has fastest typical time',
      'Max Time': 'Has slowest typical time',
      Hike: 'Has length of hike',
      permits: 'Requires permits',
      Rappels: 'Has info rappels',
      URL: 'Has url',
      rappelLongestFeet: 'Has longest rappel',
      months: 'Has best month',
      shuttle: 'Has shuttle length',
      vehicle: 'Has vehicle type',
    };

    const propertiesEncoded = Object.entries(properties)
      .map(([a, b]) => `${encode(b)}=${encode(a)}`)
      .join('/-3F');

    url.searchParams.append(
      'x',
      `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3F${propertiesEncoded}`,
    );
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '2000');

    const results: {
      fulltext: string;
      fullurl: string;
      namespace: number;
      exists: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      printouts: {[Key in keyof typeof properties]: any};
    }[] = Object.values(JSON.parse(await cachedFetch(url.toString())).results ?? {});

    if (results.length === 2000) {
      logger.warn(`Reached limit of 2000 results for ${region}`);
    }

    for (const result of results) {
      assert(['minutes', undefined].includes(result.printouts['shuttle'][0]?.units));
      assert(['ft', undefined].includes(result.printouts['rappelLongestFeet'][0]?.units));

      const rappelCount = result.printouts['Rappels'][0]?.match(/([0-9+])(-([0-9+]))?r/);

      const route: IndexRoute = {
        url: result.fullurl,
        latitude: result.printouts.coordinates[0].lat,
        longitude: result.printouts.coordinates[0].lon,
        id: result.printouts.pageid[0],
        name: result.printouts.name[0],
        quality: result.printouts.quality[0],
        months: result.printouts.months,
        technicalRating: parseIntSafe(result.printouts.technicalRating[0]) as TechnicalGrade, // TODO format properly
        waterRating: result.printouts.waterRating[0]?.toLowerCase() as WaterGrade, // TODO format properly
        timeRating: result.printouts.timeRating[0],
        riskRating: result.printouts.riskRating[0],
        permits: result.printouts.permits[0],
        rappelCountMin: parseIntSafe(rappelCount?.[1]),
        rappelCountMax: parseIntSafe(rappelCount?.[3] ?? rappelCount?.[1]),
        rappelLongestFeet: result.printouts.rappelLongestFeet[0]?.value,
        vehicle: result.printouts.vehicle[0],
        shuttleMinutes: result.printouts.shuttle[0]?.value,
      };

      validate('IndexRoute', route);

      output.push(route);
    }
  }

  return output;
}

function encode(input: string) {
  return encodeURIComponent(input).replace(/%/g, '-');
}

function parseIntSafe(input: string) {
  const output = parseInt(input);
  return isNaN(output) ? undefined : output;
}
