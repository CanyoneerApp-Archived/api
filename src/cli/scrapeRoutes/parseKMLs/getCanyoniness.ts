import assert from 'assert';
import {isNumber, sum} from 'lodash';
import {elevationWidth, getElevationMetersTile} from './getElevationMeters';
import {lat2tile, lon2tile} from './lon2tile';

export async function getCanyoniness([lon, lat]: number[], cachePath: string) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  return await getCanyoninessTile([x, y], cachePath);
}

export async function getCanyoninessTile([x, y]: number[], cachePath: string) {
  assert(isNumber(x) && isNumber(y));

  const d = 1 / elevationWidth;

  const [self, ...neighbors] = await Promise.all(
    [
      [x, y],

      [x + d, y - d],
      [x + d, y + 0],
      [x + d, y + d],

      [x + 0, y - d],
      [x + 0, y + d],

      [x - d, y - d],
      [x - d, y + 0],
      [x - d, y + d],
    ].map(async ([x, y]) => {
      assert(isNumber(x) && isNumber(y));
      return getElevationMetersTile([x, y], cachePath, true);
    }),
  );

  const curvature = sum(
    neighbors.map(neighbor => {
      assert(isNumber(self));
      return neighbor - self;
    }),
  );

  return curvature;
}
