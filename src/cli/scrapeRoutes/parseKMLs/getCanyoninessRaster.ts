// import assert from 'assert';
// import FS from 'fs';
// import {sum} from 'lodash';
// import {LRUCache} from 'lru-cache';
// import {PNG} from 'pngjs';
// import {Raster} from './Raster';
// import {TileId} from './TileId';
// import {getElevationMetersRaster} from './getElevationMetersRaster';
// import {gigabyte} from './gigabyte';

// export interface GetCanyoninessRasterOptions extends TileId {
//   cachePath: string;
// }

// export function getCanyoninessRaster(options: GetCanyoninessRasterOptions) {
//   return cache.fetch(JSON.stringify(options));
// }

// const cache = new LRUCache<string, Raster>({
//   maxSize: 4 * gigabyte,
//   ignoreFetchAbort: true,

//   sizeCalculation: ({data}) => {
//     return data.byteLength;
//   },

//   fetchMethod: async (s: string) => {
//     const {x, y, z, cachePath} = JSON.parse(s) as GetCanyoninessRasterOptions;

//     const elevations = await getElevationMetersRaster({
//       x,
//       y,
//       z,
//       cachePath,
//       blur: 2,
//     });

//     assert(elevations);

//     const data = new Float32Array(elevations.data.length);

//     for (let i = 0; i < elevations.data.length; i++) {
//       const neighbors = [
//         i - elevations.width - 1,
//         i - elevations.width,
//         i - elevations.width + 1,
//         i - 1,
//         i,
//         i + 1,
//         i + elevations.width - 1,
//         i + elevations.width,
//         i + elevations.width + 1,
//       ];

//       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//       data[i] = sum(neighbors.map(j => elevations.data[j]! - elevations.data[i]!));
//     }

//     const out = {...elevations, data};
//     createCanyoninessDebugTile(out, {x, y, z});

//     return out;
//   },
// });

// async function createCanyoninessDebugTile(canyoniness: Raster, id: TileId) {
//   const png = new PNG({
//     width: canyoniness.width,
//     height: canyoniness.height,
//     colorType: 6,
//   });

//   for (let i = 0; i < canyoniness.data.length; i++) {
//     const c = canyoniness.data[i];
//     assert(c !== undefined);

//     png.data[i * 4 + 0] = c >= 0 ? 255 : 0; // Red
//     png.data[i * 4 + 1] = c < 0 ? 255 : 0; // Green
//     png.data[i * 4 + 2] = 0; // Blue
//     png.data[i * 4 + 3] = Math.max(0, Math.min(255, (Math.abs(c) / 50) * 255)); // Alpha
//   }

//   await FS.promises.mkdir(`./public/v2/debug/canyoniness/${id.z}/${id.x}`, {recursive: true});
//   await FS.promises.writeFile(
//     `./public/v2/debug/canyoniness/${id.z}/${id.x}/${id.y}.png`,
//     PNG.sync.write(png, {}),
//   );
// }
