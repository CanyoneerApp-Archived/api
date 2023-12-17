import assert from 'assert';
import {isNumber} from 'lodash';
import {getElevationMetersRaster} from './getElevationMetersRaster';
import {lat2tile, lon2tile} from './lon2tile';

export async function getElevationMeters([lon, lat]: number[], cachePath: string) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  const raster = await getElevationMetersRaster({
    z: z,
    x: Math.floor(x),
    y: Math.floor(y),
    cachePath,
  });

  assert(raster);

  const tileX = Math.floor((x - Math.floor(x)) * raster.width);
  const tileY = Math.floor((y - Math.floor(y)) * raster.height);

  const elevation = raster.data[tileX * raster.width + tileY];

  assert(isNumber(elevation));

  return elevation;
}
