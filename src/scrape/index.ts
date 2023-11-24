import nodeCrypto from 'crypto';
import {Route} from "../Route";

export default async function* fetchRoutes() {
  const regions = ["Venezuela"] // ['Asia', 'Central America', 'Albania', 'Austria', 'Bavaria', 'Friuli Venezia Giulia', 'Lombardia', 'Piemonte', "Provence-Alpes-Cote d'Azur", 'Slovenia', 'Switzerland', 'Trentino-Alto Adige', "Valle d'Aosta", 'Andorra', 'Bulgaria', 'Croatia', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Islas Canarias', 'Italy', 'Lithuania', 'Macedonia', 'Montenegro', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Spain', 'Turkey', 'United Kingdom', 'Middle East', 'North America', 'Canada', 'Mexico', 'Northeast', 'Pacific Northwest', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Central Utah', 'Colorado', 'Connecticut', 'Georgia', 'Hawaii', 'Idaho', 'Maine', 'Massachusetts', 'Montana', 'Nevada', 'New Mexico', 'New York', 'North Carolina', 'Oregon', 'South Carolina', 'South Dakota', 'Texas', 'Utah', 'Virginia', 'Washington', 'West Desert', 'Wyoming', 'Pacific', 'South America', 'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Peru', 'Playa Montezuma', 'Venezuela']

  for (const region of regions) {
    const url = new URL('https://ropewiki.com/index.php')
    url.searchParams.append("title", "Special:Ask")

    // const properties = {
    //   'PAGEID': 'Has pageid',
    //   'name': 'Has name',
    //   'coordinates': 'Has coordinates',
    //   'Region': 'Located in region',
    //   'Quality': 'Has user rating',
    //   'Rating': 'Has rating',
    //   'Time Rating': 'Has time rating',
    //   'KML LINK': 'Has KML file',
    //   'Technical Rating': 'Has technical rating',
    //   'Water Rating': 'Has water rating',
    //   'Risk Rating': 'Has extra risk rating',
    //   'Min Time': 'Has fastest typical time',
    //   'Max Time': 'Has slowest typical time',
    //   'Hike': 'Has length of hike',
    //   'Permits': 'Requires permits',
    //   'Rappels': 'Has info rappels',
    //   'URL': 'Has url',
    //   'Longest': 'Has longest rappel',
    //   'Best Months': 'Has best month',
    //   'Shuttle': 'Has shuttle length',
    //   'Vehicle': 'Has vehicle type',
    // }

    url.searchParams.append("x", `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3FHas-20pageid=PAGEID/-3FHas-20name=name/-3FHas-20coordinates=coordinates/-3FLocated-20in-20region=Region/-3FHas-20user-20rating=Quality/-3FHas-20rating=Rating/-3FHas-20time-20rating=Time-20Rating/-3FHas-20KML-20file=KML-20LINK/-3FHas-20technical-20rating=Technical-20Rating/-3FHas-20water-20rating=Water-20Rating/-3FHas-20extra-20risk-20rating=Risk-20Rating/-3FHas-20fastest-20typical-20time=Min-20Time/-3FHas-20slowest-20typical-20time=Max-20Time/-3FHas-20length-20of-20hike=Hike/-3FRequires-20permits=Permits/-3FHas-20info-20rappels=Rappels/-3FHas-20url=URL/-3FHas-20longest-20rappel=Longest/-3FHas-20best-20month=Best-20Months/-3FHas-20shuttle-20length=Shuttle/-3FHas-20vehicle-20type=Vehicle`)
    url.searchParams.append("format", "json")
    url.searchParams.append("limit", "2000")
    url.searchParams.append("offset", "0");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = Object.values((await (await fetch(url)).json()).results ?? {})


    for (const result of results) {
      const route: Route = {
        description: "", // TODO
        geojson: undefined, // TODO
        url: result.fullurl,
        latitude: result.printouts.coordinates[0].lat,
        longitude: result.printouts.coordinates[0].lon,
        id: md5(result.fullurl),
        name: result.printouts.name[0],
        quality: 0,
        months: [],
        technicalGrade: undefined,
        waterGrade: undefined,
        timeGrade: undefined,
        additionalRisk: undefined,
        permits: undefined,
        rappelCountMin: undefined,
        rappelCountMax: undefined,
        rappelLengthMax: undefined,
        vehicle: undefined,
        shuttle: undefined
      }
      yield route
    }

  }
}

async function main() {
  for await (const route of fetchRoutes()) {
    console.log(route)
  }
}

export function md5(input: string) {
  return nodeCrypto.createHash('md5').update(input).digest('hex');
}

main()
