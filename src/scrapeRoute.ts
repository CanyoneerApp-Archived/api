import cachedFetch from './utils/cachedFetch';
import jsdom from 'jsdom';
import parseDifficulty from './utils/parseDifficulty';
import parseTime from './utils/parseTime';
import parseSport from './utils/parseSports';
import parseAdditionalRisk from './utils/parseAdditionalRisk';
import {parseDescription} from './utils/parseDescription';
import {parseRaps} from './utils/parseRaps';
import parseKML from './utils/parseKML';
import {parseTable} from './utils/parseTable';
import parseMonths from './utils/parseMonths';


export async function scrapeRoute(url: string): Promise<any> {
    const text = await cachedFetch(url);
    const {window: {document}} = new jsdom.JSDOM(text, {url});

    const tableElements = parseTable(document.querySelector('.tablecanyon tbody'));
    const rating = tableElements['Difficulty']?.textContent.trim() ?? '';
    const raps = parseRaps(tableElements['Raps']?.textContent.trim());
    const kml = await parseKML(document);

    const qualityPopSection = tableElements['Rating']!;
    const quality = qualityPopSection.querySelectorAll('.starRate4')?.length ?? 0 + (qualityPopSection.querySelectorAll('.starRate2')?.length ?? 0) / 2;

    // popularity is currently broken
    const popularity = tableElements['StarRank'] && parseInt(tableElements['StarRank'].querySelector('.starRate > span')!.textContent!.slice(2));

    return {
        URL: url,
        Name: document.querySelector('h1')!.textContent!,
        Quality: quality,
        Popularity: popularity,
        Latitude: tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[0]),
        Longitude: tableElements['Location'] && parseFloat(tableElements['Location'].textContent!.split(',')[1]),
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
        GeoJSON: kml.geoJSON
    };
}
