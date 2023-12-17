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
    data[i] = sum(neighbors.map((j) => elevations.data[j]! - elevations.data[i]!))
  }


  const out = {...elevations, data};
  createCanyoninessDebugTile(out, s)

  return out
}

async function createCanyoninessDebugTile(canyoniness: Raster, s: string) {
  const png = new PNG({
    width: canyoniness.width,
    height: canyoniness.height,
    colorType: 6
  });

  for (let i = 0; i < canyoniness.data.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const c = canyoniness.data[i]!

    // Red
    png.data[i * 4 + 0] = c >= 0 ? 255 : 0

    // Green
    png.data[i * 4 + 1] = c < 0 ? 255 : 0

    // Blue
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    png.data[i * 4 + 2] = 0;

    // Alpha
    png.data[i * 4 + 3] = Math.max(0, Math.min(255, Math.abs(c) / 50 * 255));
  }

  await FS.promises.mkdir(`./public/v2/curvature/${Path.dirname(s)}`, {recursive: true});
  await FS.promises.writeFile(`./public/v2/curvature/${s}.png`, PNG.sync.write(png, {}));
}

// async function createCurvatureDebugTile(curvatures: Raster, curvaturesOrientation: Raster, s: string) {
//   const png = new PNG({
//     width: curvatures.width,
//     height: curvatures.height,
//     colorType: 6
//   });

//   for (let i = 0; i < curvatures.data.length; i++) {

//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     const orientation = (curvaturesOrientation.data[i]! / Math.PI / 4 + 0.5) * 255;

//     // Red
//     png.data[i * 4 + 0] = orientation;

//     // Green
//     png.data[i * 4 + 1] = 255 - orientation;

//     // Blue
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     png.data[i * 4 + 2] = 0;

//     // Alpha
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     png.data[i * 4 + 3] = Math.max(0, Math.min(255, curvatures.data[i]! * 100000));
//   }

//   await FS.promises.mkdir(`./public/v2/curvature/${Path.dirname(s)}`, {recursive: true});
//   await FS.promises.writeFile(`./public/v2/curvature/${s}.png`, PNG.sync.write(png, {}));
// }

// async function createSlopeDebugTile(slopes: Raster, slopesOrientation: Raster, s: string) {
//   const png = new PNG({
//     width: slopes.width,
//     height: slopes.height,
//     colorType: 6
//   });

//   for (let i = 0; i < slopes.data.length; i++) {

//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     const orientation = (slopesOrientation.data[i]! / Math.PI / 4 + 0.5) * 255;

//     // Red
//     png.data[i * 4 + 0] = orientation;

//     // Green
//     png.data[i * 4 + 1] = 255 - orientation;

//     // Blue
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     png.data[i * 4 + 2] = 0;

//     // Alpha
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     png.data[i * 4 + 3] = Math.max(0, Math.min(255, slopes.data[i]! * 255));
//   }

//   await FS.promises.mkdir(`./public/v2/slope/${Path.dirname(s)}`, {recursive: true});
//   await FS.promises.writeFile(`./public/v2/slope/${s}.png`, PNG.sync.write(png, {}));
// }

// function getRasterSlopes(input: Raster): [Raster, Raster] {
//   const mag = new Float32Array(input.height * input.width);
//   const ori = new Float32Array(input.height * input.width);

//   for (let i = 0; i < input.data.length; i++) {
//     const {y, x} = getRasterGradient(input, i);
//     mag[i] = Math.sqrt(x * x + y * y);
//     ori[i] = Math.atan2(y, x);
//   }

//   return [{...input, data: mag}, {...input, data: ori}];
// }

// // See https://sci-hub.st/10.3846/20296991.2013.806702
// export function getRasterGradient(input: Raster, i: number) {
//   // https://wiki.openstreetmap.org/wiki/Zoom_levels
//   const tileWidthMeters =
//     (earthCircumference * Math.cos(d2r(tile2lat(input.id.y, input.id.z)))) /
//     Math.pow(2, input.id.z);

//   const g = tileWidthMeters / input.width;

//   const z2 = input.data[i - input.width - 0];
//   const z4 = input.data[i - 1];
//   const z6 = input.data[i + 1];
//   const z8 = input.data[i + input.width - 0];

//   if (isNumber(z2) && isNumber(z4) && isNumber(z6) && isNumber(z8)) {
//     const x = (z6 - z4) / 2 / g;
//     const y = (z8 - z2) / 2 / g;
//     return {y, x};
//   } else {
//     return {y: 0, x: 0};
//   }
// }

// export function r2d(rad: number) {
//   return (rad * 180) / Math.PI;
// }

// export function d2r(deg: number) {
//   return (deg / 180) * Math.PI;
// }

// export function highlightMaxLines(curvatures: Raster) {
//   const data = new Float32Array(curvatures.data.length);

//   for (let i = 0; i < curvatures.data.length; i++) {
//     const neighbors = [
//       i - curvatures.width - 1,
//       i - curvatures.width,
//       i - curvatures.width + 1,
//       i - 1,
//       i,
//       i + 1,
//       i + curvatures.width - 1,
//       i + curvatures.width,
//       i + curvatures.width + 1,
//     ];

//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     const curvature = curvatures.data[i]!;

//     const pNeighbors = neighbors.filter(
//       j =>
//         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//         curvature > curvatures.data[j]!,
//     );
//     const nNeighbors = neighbors.filter(
//       j =>
//         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//         curvature < curvatures.data[j]!,
//     );

//     if (pNeighbors.length <= 2) {
//       data[i] = curvature;
//     }

//     if (nNeighbors.length <= 2) {
//       data[i] = -curvature;
//     }
//   }

//   return {...curvatures, data};
// }
