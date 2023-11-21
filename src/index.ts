import cachedFetch from './utils/cachedFetch';
import _, {toArray}  from 'lodash';
import {scrapeRoute} from './scrapeRoute';

let first = true;
async function main() {
    console.log('[');
    await Promise.all((await getRouteURLs()).map(async url => {
        try {
            const route = await scrapeRoute(url);
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

main();
