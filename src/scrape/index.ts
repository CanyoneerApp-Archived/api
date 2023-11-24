import Ajv, {ValidateFunction} from 'ajv';
import assert from 'assert';
import nodeCrypto from 'crypto';
import FS from 'fs';
import {Route, TechnicalGrade, WaterGrade} from "../Route";
import {writeSchemas} from '../writeSchemas';

async function fetchRoutes(validate: ValidateFunction<unknown>, callback: (route: Route) => void): Promise<void> {
  const regions = ["California"] // ['Asia', 'Central America', 'Albania', 'Austria', 'Bavaria', 'Friuli Venezia Giulia', 'Lombardia', 'Piemonte', "Provence-Alpes-Cote d'Azur", 'Slovenia', 'Switzerland', 'Trentino-Alto Adige', "Valle d'Aosta", 'Andorra', 'Bulgaria', 'Croatia', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Islas Canarias', 'Italy', 'Lithuania', 'Macedonia', 'Montenegro', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Spain', 'Turkey', 'United Kingdom', 'Middle East',string,

  for (const region of regions) {
    const url = new URL('https://ropewiki.com/index.php')
    url.searchParams.append("title", "Special:Ask")

    const properties = {
      'pageid': 'Has pageid',
      'name': 'Has name',
      'coordinates': 'Has coordinates',
      'region': 'Located in region',
      'quality': 'Has user rating',
      'rating': 'Has rating',
      'timeRating': 'Has time rating',
      'kmlUrl': 'Has KML file',
      'Technical Rating': 'Has technical rating',
      'Water Rating': 'Has water rating',
      'Risk Rating': 'Has extra risk rating',
      'Min Time': 'Has fastest typical time',
      'Max Time': 'Has slowest typical time',
      'Hike': 'Has length of hike',
      'Permits': 'Requires permits',
      'Rappels': 'Has info rappels',
      'URL': 'Has url',
      'Longest': 'Has longest rappel',
      'Best Months': 'Has best month',
      'Shuttle': 'Has shuttle length',
      'Vehicle': 'Has vehicle type',
    }

    const propertiesEncoded = Object.entries(properties).map(([output, input]) => `${encode(input)}=${encode(output)}`).join("/-3F")

    url.searchParams.append("x", `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3F${propertiesEncoded}`)
    url.searchParams.append("format", "json")
    url.searchParams.append("limit", "2000")
    url.searchParams.append("offset", "0");

    const results: {
      fulltext: string,
      fullurl: string,
      namespace: number,
      exists: boolean,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      printouts: {[Key in keyof typeof properties]: any}
    }[] = Object.values((await (await fetch(url)).json()).results ?? {})

    for (const result of results) {
      assert(['minutes', undefined].includes(result.printouts['Shuttle'][0]?.units))
      assert(['ft', undefined].includes(result.printouts['Longest'][0]?.units))

      // TODO check against schema

      const rappelCount = result.printouts['Rappels'][0]?.match(/([0-9+])(-([0-9+]))?r/)

      const route: Route = {
        description: "", // TODO
        geojson: undefined, // TODO
        url: result.fullurl,
        latitude: result.printouts.coordinates[0].lat,
        longitude: result.printouts.coordinates[0].lon,
        id: md5(result.fullurl),
        name: result.printouts.name[0],
        quality: result.printouts.quality[0],
        months: result.printouts['Best Months'], // TODO format properly
        technicalRating: parseIntSafe(result.printouts['Technical Rating'][0]) as TechnicalGrade, // TODO format properly
        waterRating: result.printouts['Water Rating'][0]?.toLowerCase() as WaterGrade, // TODO format properly
        timeRating: result.printouts['timeRating'][0],
        riskRating: result.printouts['Risk Rating'][0],
        permits: result.printouts['Permits'][0],
        rappelCountMin: parseIntSafe(rappelCount?.[1]),
        rappelCountMax: parseIntSafe(rappelCount?.[3] ?? rappelCount?.[1]),
        rappelLengthMaxFeet: result.printouts['Longest'][0]?.value,
        vehicle: result.printouts['Vehicle'][0],
        shuttleMinutes: result.printouts['Shuttle'][0]?.value
      }

      validate(route)
      if (validate.errors) {
        console.log(result)
        console.log(route)
        console.error(validate.errors)
        throw new Error('Failed validation')
      }

      callback(route)
    }
  }
}

function parseIntSafe(input: string) {
  const output = parseInt(input)
  return isNaN(output) ? undefined : output
}

async function main() {
  await writeSchemas()

  const ajv = new Ajv({allowUnionTypes: true, allErrors: true}) // options can be passed, e.g. {allErrors: true}
  const validate = ajv.compile(JSON.parse(await FS.promises.readFile('./output/schemas/Route.json', 'utf-8')))

  fetchRoutes(validate, (route) => console.log(route))
}

export function md5(input: string) {
  return nodeCrypto.createHash('md5').update(input).digest('hex');
}

main()

function encode(input: string) {
  return encodeURIComponent(input).replace(/%/g, "-")
}
