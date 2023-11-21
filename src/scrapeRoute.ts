import cachedFetch from './utils/cachedFetch';
import jsdom from 'jsdom';
import parseDifficulty from './utils/parseDifficulty';
import parseTime from './utils/parseTime';
import parseSport from './utils/parseSports';
import parseAdditionalRisk from './utils/parseAdditionalRisk';
import {parseDescription} from './utils/parseDescription';
import {parseRaps} from './utils/parseRaps';
import parseKML from './utils/parseKML';
import {parseTable, mostReleventElement} from './utils/parseTable';
import parseMonths from './utils/parseMonths';

export async function scrapeRoute(url: string): Promise<any> {
    const text = await cachedFetch(url);
    const {window: {document}} = new jsdom.JSDOM(text, {url});

    // This generally works but not for linked bluugnome data
    const kml = await parseKML(document);

    const tableElementRowMap = parseTable(document.querySelector('.tablecanyon tbody'));
    const raps = parseRaps(tableElementRowMap['Raps']);
    const qualityPopSection = tableElementRowMap['Rating']!;
    const quality = qualityPopSection.querySelectorAll('.starRate4')?.length ?? 0 + (qualityPopSection.querySelectorAll('.starRate2')?.length ?? 0) / 2;
    const months = parseMonths(tableElementRowMap['Best season']);
    const vehicle = tableElementRowMap['Vehicle']?.textContent?.trim().replace('Vehicle:', '');

    // Typically we just need the last element
    const tableElements = {};
    for (const key in tableElementRowMap) {
        tableElements[key] = mostReleventElement(key, tableElementRowMap[key]);
    }
    const rating = tableElements['Difficulty']?.textContent.trim() ?? '';

    // popularity is currently broken
    const popularity = tableElements['StarRank'] && parseInt(tableElements['StarRank'].querySelector('.starRate > span')!.textContent!.slice(2));
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
        Vehicle: vehicle,
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
