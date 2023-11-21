import {scrapeRoute} from './scrapeRoute';

// This integration test alerts us if our scraper starts returning different data.
// This could happen because of a bug in our code or a change on RopeWiki's site.

describe('scrapeRoute', () => {
    it('matches snapshot for Cerebus', async () => {
        expect(transform(await scrapeRoute('https://ropewiki.com/Cerberus_Canyon_(North_Fork)'))).toMatchSnapshot();
    });

    it('matches snapshot for Behunin', async () => {
        expect(transform(await scrapeRoute('https://ropewiki.com/Behunin_Canyon'))).toMatchSnapshot();
    });
});

function transform({GeoJSON, ...rest}: any) {
    return {
        HasGeoJSON: !!GeoJSON,
        ...rest
    };
}
