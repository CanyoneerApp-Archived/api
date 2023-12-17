import assert from 'assert';
import {isNumber, sum} from 'lodash';
import {getElevationMetersRaster} from './getElevationMetersRaster';
import {lat2tile, lon2tile} from './lon2tile';

export const elevationWidth = 256;

export async function getElevationMeters([lon, lat]: number[], cachePath: string, blur = false) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  return getElevationMetersTile([x, y], cachePath, blur);
}

// Define a 3x3 Gaussian kernel with some standard weights
// These weights should sum to 1.0
// You can adjust these weights based on your Gaussian function
const kernel = [0.075, 0.125, 0.075, 0.125, 0.2, 0.125, 0.075, 0.125, 0.075];

export async function getElevationMetersTile(
  [tileX, tileY]: number[],
  cachePath: string,
  blur = false,
) {
  assert(isNumber(tileX) && isNumber(tileY));
  if (blur === false) {
    return getElevationMetersTileInner([tileX, tileY], cachePath);
  } else {
    const d = 1 / elevationWidth;
    return sum(
      (
        await Promise.all([
          getElevationMetersTileInner([tileX - d, tileY + d], cachePath),
          getElevationMetersTileInner([tileX + 0, tileY + d], cachePath),
          getElevationMetersTileInner([tileX + d, tileY + d], cachePath),
          getElevationMetersTileInner([tileX - d, tileY + 0], cachePath),
          getElevationMetersTileInner([tileX + 0, tileY + 0], cachePath),
          getElevationMetersTileInner([tileX + d, tileY + 0], cachePath),
          getElevationMetersTileInner([tileX - d, tileY - d], cachePath),
          getElevationMetersTileInner([tileX + 0, tileY - d], cachePath),
          getElevationMetersTileInner([tileX + d, tileY - d], cachePath),
        ])
      ).map((elevation, i) => {
        const k = kernel[i];
        assert(isNumber(k));
        return elevation * k;
      }),
    );
  }
}

export async function getElevationMetersTileInner([tileX, tileY]: number[], cachePath: string) {
  assert(isNumber(tileX) && isNumber(tileY));
  const id = {
    z: 12,
    x: Math.floor(tileX),
    y: Math.floor(tileY),
  };

  const raster = await getElevationMetersRaster({...id, cachePath});

  assert(raster);

  const y = Math.floor((tileY - id.y) * elevationWidth);
  const x = Math.floor((tileX - id.x) * elevationWidth);

  const elevation = raster.data[y * elevationWidth + x];

  assert(isNumber(elevation));

  return elevation;
}
