import assert from 'assert';
import FS from 'fs';
import {sum} from 'lodash';
import {LRUCache} from 'lru-cache';
import Path from 'path';
import {PNG} from 'pngjs';
import {Raster} from './Raster';
import {blurRaster} from './blurRaster';
import {getElevationMetersRaster} from './getElevationMetersRaster';
import {gigabyte} from './gigabyte';

export const getCanyoninessRaster = new LRUCache<string, Raster>({
  maxSize: 4 * gigabyte,
  ignoreFetchAbort: true,

  sizeCalculation: ({data}) => {
    return data.byteLength;
  },

  fetchMethod: async (s: string) => {
    const elevations = await getElevationMetersRaster.fetch(s);

    assert(elevations);

    return getCanyoniness(blurRaster(elevations, 2), s);
  },
});

export function getCanyoniness(elevations: Raster, s: string) {
  const data = new Float32Array(elevations.data.length);

  for (let i = 0; i < elevations.data.length; i++) {
    const neighbors = [
      i - elevations.width - 1,
      i - elevations.width,
      i - elevations.width + 1,
      i - 1,
      i,
      i + 1,
      i + elevations.width - 1,
      i + elevations.width,
      i + elevations.width + 1,
    ];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data[i] = sum(neighbors.map(j => elevations.data[j]! - elevations.data[i]!));
  }

  const out = {...elevations, data};
  createCanyoninessDebugTile(out, s);

  return out;
}

async function createCanyoninessDebugTile(canyoniness: Raster, s: string) {
  const png = new PNG({
    width: canyoniness.width,
    height: canyoniness.height,
    colorType: 6,
  });

  for (let i = 0; i < canyoniness.data.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const c = canyoniness.data[i]!;

    // Red
    png.data[i * 4 + 0] = c >= 0 ? 255 : 0;

    // Green
    png.data[i * 4 + 1] = c < 0 ? 255 : 0;

    // Blue
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    png.data[i * 4 + 2] = 0;

    // Alpha
    png.data[i * 4 + 3] = Math.max(0, Math.min(255, (Math.abs(c) / 50) * 255));
  }

  await FS.promises.mkdir(`./public/v2/canyoniness/${Path.dirname(s)}`, {recursive: true});
  await FS.promises.writeFile(`./public/v2/canyoniness/${s}.png`, PNG.sync.write(png, {}));
}
