import assert from 'assert';
import {isNumber} from 'lodash';
import {getElevationMetersRaster} from './getElevationMetersRaster';
import {lat2tile, lon2tile} from './lon2tile';

export const elevationWidth = 256;

export async function getElevationMeters([lon, lat]: number[], cachePath: string, blur = 0) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  return getElevationMetersTile([x, y], cachePath, blur);
}

export async function getElevationMetersTile([tileX, tileY]: number[], cachePath: string, blur = 0) {
  assert(isNumber(tileX) && isNumber(tileY));
  const id = {
    z: 12,
    x: Math.floor(tileX),
    y: Math.floor(tileY),
  }

  const raster = await getElevationMetersRaster({
    ...id,
    cachePath,
    blur
  });

  assert(raster);

  const y = Math.floor((tileY - id.y) * elevationWidth)
  const x = Math.floor((tileX - id.x) * elevationWidth)

  const elevation = raster.data[y * elevationWidth + x];

  assert(isNumber(elevation));

  return elevation;
}
