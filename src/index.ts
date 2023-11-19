import cachedFetch from './utils/cachedFetch';
import _, {toArray}  from 'lodash';
import jsdom  from 'jsdom';
import parseDifficulty  from './utils/parseDifficulty';
import parseTime  from './utils/parseTime';
import parseSport  from './utils/parseSports';
import parseAdditionalRisk  from './utils/parseAdditionalRisk';
import {parseDescription} from './utils/parseDescription';
import {parseRaps} from './utils/parseRaps';
import parseKML from './utils/parseKML';
import {parseTable, mostReleventElement} from './utils/parseTable';
import parseMonths from './utils/parseMonths';

let first = true;
async function main() {
    console.log('[');
    
    const urls = await getRouteURLs()
    await Promise.all((urls).map(async url => {
        try {
            const route = await parseRoute(url);
            if (first) { first = false; } else { console.log(','); }
            console.log(JSON.stringify(route));
        } catch (error) {
            console.error(error);
        }
    }));
    console.log(']');
}

async function getRouteURLs(): Promise<Array<string>> {
    const url = 'http://ropewiki.com/api.php?action=ask&format=json&query=%5B%5BCategory%3ACanyons%5D%5D%5B%5BHas+coordinates%3A%3A%2B%5D%5D%5B%5BCategory%3ACanyons%5D%5D%0A++%0A++%5B%5BHas+star+rating%3A%3A%210%5D%5D%5B%5BHas+star+rating%3A%3A%211%5D%5D%5B%5BHas+latitude%3A%3A%3E30.412022222222%5D%5D%5B%5BHas+longitude%3A%3A%3E-128.08301666667%5D%5D%5B%5BHas+latitude%3A%3A%3C44.8852%5D%5D%5B%5BHas+longitude%3A%3A%3C-108.54692%5D%5D%7Corder%3Ddescending%2C+ascending%7Csort%3DHas_rank_rating%2C+Has_name|%3FHas_coordinates|%3FHas_star_rating|%3FHas_summary|%3FHas_banner_image_file|%3FHas_location_class|%3FHas_KML_file|limit=2000|offset=0';
    const response = JSON.parse(await cachedFetch(url));
    return Object.values(response.query.results).map((result: any) => result.fullurl);
}

async function parseRoute(url: string): Promise<any> {
    const text = await cachedFetch(url);
    const {window: {document}} = new jsdom.JSDOM(text, {url});

    // This generally works but not for linked bluugnome data
    const kml = await parseKML(document);

    const tableElementRowMap = parseTable(document.querySelector('.tablecanyon tbody'));
    const raps = parseRaps(tableElementRowMap['Raps']);
    const qualityPopSection = tableElementRowMap['Rating']!;
    const quality = qualityPopSection.querySelectorAll('.starRate4')?.length ?? 0 + (qualityPopSection.querySelectorAll('.starRate2')?.length ?? 0) / 2;
    const months = parseMonths(tableElementRowMap['Best season'])

    // Typically we just need the last element
    var tableElements = {};
    for (let key in tableElementRowMap) {
        tableElements[key] = mostReleventElement(key, tableElementRowMap[key]);
    }
    const rating = tableElements['Difficulty']?.textContent.trim() ?? "";            

    // popularity is currently broken
    const popularity =  tableElements['StarRank'] && parseInt(tableElements['StarRank'].querySelector('.starRate > span')!.textContent!.slice(2));
    return {
        URL: url,
        Name: document.querySelector('h1')!.textContent!,
        Quality: quality,
        Popularity: popularity,
        Latitude: tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[0]),
        Longitude: tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[1]),
        Months: months,
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
        GeoJSON: kml.geoJSON
    };
}

main();
