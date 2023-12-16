import assert from 'assert';
import {isNumber} from 'lodash';
import {LRUCache} from 'lru-cache';
import {Raster} from './Raster';
import {earthCircumference} from './earthCircumference';
import {getElevationMetersRaster} from './getElevationMetersRaster';
import {gigabyte} from './gigabyte';
import {tile2lat} from './lon2tile';

export const getCurvaturesRaster = new LRUCache<string, Raster>({
  maxSize: 4 * gigabyte,
  ignoreFetchAbort: true,

  sizeCalculation: ({data}) => {
    return data.byteLength;
  },

  fetchMethod: async (s: string) => {
    // TODO buffer this raster so the edges aren't undefined
    const elevations = await getElevationMetersRaster.fetch(s);

    assert(elevations);

    const slopes = getRasterSlopes(elevations);
    const curvatures = getRasterSlopes(slopes);

    return curvatures;
  },
});

function getRasterSlopes(input: Raster): Raster {
  const data = new Float32Array(input.height * input.width);

  for (let i = 0; i < input.data.length; i++) {
    const {y, x} = getRasterGradient(input, i);
    data[i] = Math.sqrt(x * x + y * y);
  }

  return {...input, data};
}

// See https://sci-hub.st/10.3846/20296991.2013.806702
export function getRasterGradient(input: Raster, i: number) {
  // https://wiki.openstreetmap.org/wiki/Zoom_levels
  const tileWidthMeters =
    (earthCircumference * Math.cos(d2r(tile2lat(input.id.y, input.id.z)))) /
    Math.pow(2, input.id.z);

  const g = tileWidthMeters / input.width;

  const z2 = input.data[i - input.width - 0];
  const z4 = input.data[i - 1];
  const z6 = input.data[i + 1];
  const z8 = input.data[i + input.width - 0];

  if (isNumber(z2) && isNumber(z4) && isNumber(z6) && isNumber(z8)) {
    const x = (z6 - z4) / 2 / g;
    const y = (z8 - z2) / 2 / g;
    return {y, x};
  } else {
    return {y: 0, x: 0};
  }
}

export function r2d(rad: number) {
  return (rad * 180) / Math.PI;
}

export function d2r(deg: number) {
  return (deg / 180) * Math.PI;
}
