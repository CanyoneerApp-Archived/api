import assert from 'assert';
import FS from 'fs';
import {isNumber, memoize, sum} from 'lodash';
import Path from 'path';
import {PNG} from 'pngjs';
import {TileId} from './TileId';
import {elevationWidth, getElevationMetersTile} from './getElevationMeters';
import {lat2tile, lon2tile, tile2lat, tile2long as tile2lon} from './lon2tile';

export async function getCanyoniness([lon, lat]: number[], cachePath: string, debug = true) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  const innerX = Math.floor((x - Math.floor(x)) * elevationWidth)
  const innerY = Math.floor((y - Math.floor(y)) * elevationWidth)

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
    ].map(([x, y]) => {
      assert(isNumber(x) && isNumber(y));
      return getElevationMetersTile([x, y], cachePath, 2);
    }),
  );

  const curvature = sum(
    neighbors.map(neighbor => {
      assert(isNumber(self));
      return neighbor - self;
    }),
  );

  if (debug) {
    await createCanyoninessDebugTile(
      {x: Math.floor(x), y: Math.floor(y), z: Math.floor(z)},
      cachePath,
    );
  }

  return curvature;
}

const createCanyoninessDebugTile = memoize(
  async (id: TileId, cachePath: string) => {
    const png = new PNG({
      width: elevationWidth,
      height: elevationWidth,
      colorType: 6,
    });

    for (let x = 0; x < elevationWidth; x++) {
      for (let y = 0; y < elevationWidth; y++) {
        const c = await getCanyoniness(
          [tile2lon(id.x + x / elevationWidth, id.z), tile2lat(id.y + y / elevationWidth, id.z)],
          cachePath,
          false
        );
        assert(c !== undefined);

        png.data[(y * elevationWidth + x) * 4 + 0] = c >= 0 ? 255 : 0; // Red
        png.data[(y * elevationWidth + x) * 4 + 1] = c < 0 ? 255 : 0; // Green
        png.data[(y * elevationWidth + x) * 4 + 2] = 0; // Blue
        png.data[(y * elevationWidth + x) * 4 + 3] = Math.max(0, Math.min(255, (Math.abs(c) / 50) * 255)); // Alpha
      }
    }

    const path = `./public/v2/debug/canyoniness/${id.z}/${id.x}/${id.y}.png`;

    await FS.promises.mkdir(Path.dirname(path), {recursive: true});
    await FS.promises.writeFile(path, PNG.sync.write(png, {}));
  },
  ({x, y, z}) => `${z}/${x}/${y}`
);

// export async function getCanyoninessOld([lon, lat]: number[], cachePath: string) {
//   assert(isNumber(lon) && isNumber(lat));

//   const z = 12;
//   const x = lon2tile(lon, z);
//   const y = lat2tile(lat, z);

//   const png = await getCanyoninessRaster({z: z, x: Math.floor(x), y: Math.floor(y), cachePath});

//   assert(png);

//   const tileX = Math.floor((x - Math.floor(x)) * png.width);
//   const tileY = Math.floor((y - Math.floor(y)) * png.height);

//   const curvature = png.data[tileY * png.width + tileX];

//   assert(isNumber(curvature));

//   return curvature;
// }
