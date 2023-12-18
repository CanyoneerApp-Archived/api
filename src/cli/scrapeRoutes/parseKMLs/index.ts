import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';
import {minBy} from 'lodash';
import {RouteV2} from '../../../types/v2';
import {logger} from '../../../utils/logger';
import {flattenFeatureCollection} from './flattenFeatureCollection';
import {parseLineString} from './parseLineString';
import {parsePoint} from './parsePoint';

export async function parseKMLs(routes: RouteV2[], cachePath: string): Promise<RouteV2[]> {
  let doneCount = 0;
  for (const route of routes) {
    route.geojson = route.geojson && (await parseKMLsInner(route.geojson, cachePath));
    logger.progress(routes.length, doneCount++, route.name);
  }
  return routes;
}

export async function parseKMLsInner(
  input: Feature | FeatureCollection,
  cachePath: string,
): Promise<FeatureCollection> {
  const output = flattenFeatureCollection(input);

  const lines = output.filter(isLineStringFeature);
  const points = output.filter(isPointFeature);

  return {
    type: 'FeatureCollection',
    features: await Promise.all([
      ...lines.map(async line => {
        return await parseLineString(line as Feature<LineString>, cachePath);
      }),

      ...points.map(async point => {
        const foo = lines
          .map((line): [Feature<LineString>, number] => [
            line,
            pointToLineDistance(point.geometry, line.geometry, {units: 'meters'}),
          ])
          .filter(([, distance]) => distance <= 100);

        const [associatedLine] = minBy(foo, ([, distance]) => distance) ?? [];

        return await parsePoint(point, associatedLine, cachePath);
      }),
    ]),
  };
}

function isLineStringFeature(f: Feature): f is Feature<LineString> {
  return f.geometry.type === 'LineString';
}

function isPointFeature(f: Feature): f is Feature<Point> {
  return f.geometry.type === 'Point';
}
