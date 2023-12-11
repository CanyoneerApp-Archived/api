import {VectorTile} from '@mapbox/vector-tile';
import FS from 'fs';
import {times} from 'lodash';
import {glob} from 'miniglob';
import Path from 'path';
import Protobuf from 'pbf';
import {main} from '.';
import {logger} from './logger';

// This test can take longer than the default 5 seconds timeout
const timeout = 60 * 1000;

describe('scrape', () => {
  beforeAll(async () => {
    logger.enable = false;
  });

  it(
    'Maine',
    async () => {
      await main(['test', 'test', '--local', '--region', 'Maine']);
      expect(JSON.stringify(await readOutputDir(), null, '  ')).toMatchSnapshot();
    },
    timeout,
  );
});

async function readOutputDir() {
  const {maxzoom} = JSON.parse(
    await FS.promises.readFile('output/v2/tiles/metadata.json', 'utf-8'),
  );

  return Object.fromEntries([
    ...(await Promise.all(
      [
        'output/v2/index.json',
        'output/v2/geojson.json',
        'output/v1/index.json',
        'output/v2/details/*.json',
      ].flatMap(pattern =>
        glob(pattern)
          .sort()
          .map(async path => [path, JSON.parse(await FS.promises.readFile(path, 'utf-8'))]),
      ),
    )),

    ...(await Promise.all(
      glob(`output/v2/tiles/${maxzoom}/*/*.pbf`)
        .sort()
        .map(async path => [
          path,
          parseVectorTile(await FS.promises.readFile(path), getVectorTileId(path)),
        ]),
    )),
  ]);
}

/**
 * A vector tile's x, y, and z coordinates. These specify a tile's geographic location.
 * See https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames for more.
 */
type VectorTileId = {x: number; y: number; z: number};

/**
 * Turn a binary buffer containing a vector tile and it's associated VectorTileId into a
 * GeoJSON object for snapshot inspection.
 */
function parseVectorTile(data: Buffer, {x, y, z}: VectorTileId) {
  const tile = new VectorTile(new Protobuf(data));

  return Object.fromEntries(
    Object.entries(tile.layers).map(([name, layer]) => [
      name,
      times(layer.length, i => layer.feature(i).toGeoJSON(x, y, z)),
    ]),
  );
}

/**
 * Given a filesystem path to a vector tile, return the associated VectorTileId
 */
function getVectorTileId(path: string): VectorTileId {
  const [z, x, y] = path
    .split('/')
    .slice(-3)
    .map(s => Number(Path.basename(s, Path.extname(s))));

  return {x, y, z};
}
