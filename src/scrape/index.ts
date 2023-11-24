import FS from 'fs';
import {toLegacyRoute} from './LegacyRoute';
import {RouteGeoJSONFeature, toIndexRoute} from './Route';
import {getRouteURLs} from './getRouteURLs';
import {scrapeRoute} from './scrapeRoute';

export async function scrape() {
  await FS.promises.mkdir('./cache', {recursive: true});
  await FS.promises.mkdir('./output/details', {recursive: true});

  const legacy = FS.createWriteStream('./output/legacy.json');
  const index = FS.createWriteStream('./output/index.json');
  const geojson = FS.createWriteStream('./output/index.geojson');

  let first = true;
  legacy.write('[\n');

  await Promise.all(
    (await getRouteURLs()).map(async url => {
      const route = await scrapeRoute(url);
      if (!route) {
        return;
      } else if (first) {
        first = false;
      } else {
        legacy.write(',\n');
      }

      const features: RouteGeoJSONFeature[] =
        route.geojson?.features.map(feature => ({
          ...feature,
          properties: {
            ...Object.fromEntries(
              Object.entries(toIndexRoute(route)).map(([key, value]) => [`route.${key}`, value]),
            ),
            ...feature.properties,
          },
        })) ??
        (route.longitude && route.latitude
          ? [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [route.longitude, route.latitude],
                },
                properties: {
                  name: route.name,
                  ...Object.fromEntries(
                    Object.entries(route).map(([key, value]) => [`route.${key}`, value]),
                  ),
                } as unknown as RouteGeoJSONFeature['properties'],
              },
            ]
          : []);

      FS.writeFileSync(`./output/details/${route.id}.json`, JSON.stringify(route));
      index.write(`${JSON.stringify(toIndexRoute(route))}\n`);
      features.forEach(feature => {
        geojson.write(`${JSON.stringify(feature)}\n`);
      });
      legacy.write(JSON.stringify(toLegacyRoute(route)));
    }),
  );
  legacy.write(']');
}
