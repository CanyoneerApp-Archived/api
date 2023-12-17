import assert from 'assert';
import {isNumber} from 'lodash';
import {getCurvaturesRaster} from './getCurvatureRaster';
import {id2str} from './id2str';
import {lat2tile, lon2tile} from './lon2tile';

export async function getCurvature([lon, lat]: number[]) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  const png = await getCurvaturesRaster.fetch(id2str({z: z, x: Math.floor(x), y: Math.floor(y)}));

  assert(png);

  const tileX = Math.floor((x - Math.floor(x)) * png.width);
  const tileY = Math.floor((y - Math.floor(y)) * png.height);

  const curvature = png.data[tileX * png.width + tileY];

  assert(isNumber(curvature));

  return curvature;
}

