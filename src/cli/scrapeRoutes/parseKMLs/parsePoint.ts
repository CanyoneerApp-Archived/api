import {Feature, LineString, Point} from '@turf/helpers';
import {colors} from '../../../colors';
import {getElevationMeters} from './getElevationMeters';

export async function parsePoint(
  point: Feature<Point>,
  associatedLine: Feature<LineString> | undefined,
  cachePath: string,
) {
  return {
    ...point,
    properties: {
      ...point.properties,
      stroke: associatedLine?.properties?.stroke ?? colors.red,
      elevationMeters: Math.round(await getElevationMeters(point.geometry.coordinates, cachePath)),
    },
  };
}
