import {VectorTile} from '@mapbox/vector-tile';
import FS from 'fs';
import {times} from 'lodash';
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

const readOutputDirIgnore = [
  'output/v1/schemas',
  'output/v2/schemas',
  'output/v2/tiles/metadata.json',
  'output/index.html',
];

async function readOutputDir(dirPath = 'output') {
  const tilesMetadata = JSON.parse(
    await FS.promises.readFile('output/v2/tiles/metadata.json', 'utf-8'),
  );

  return Object.fromEntries(
    (
      await Promise.all(
        FS.readdirSync(dirPath).map(async (basePath): Promise<[string, unknown][]> => {
          const path = Path.join(dirPath, basePath);

          // Path is ignored
          if (readOutputDirIgnore.includes(path)) {
            return [];

            // Path is a directory
          } else if ((await FS.promises.lstat(path)).isDirectory()) {
            return Object.entries(await readOutputDir(path));

            // Path is a vector tile
          } else if (Path.extname(path) === '.pbf') {
            const coords = getVectorTileId(path);
            // We give up some snapshot completeness to reduce the snapshot size by only including
            // the tiles at the max zoom level.
            if (coords.z !== Number(tilesMetadata.maxzoom)) {
              return [];
            } else {
              return [[path, parseVectorTileTile(await FS.promises.readFile(path), coords)]];
            }

            // Path is some other kind of file
          } else {
            return [[path, parseTextFile(await FS.promises.readFile(path, 'utf-8'))]];
          }
        }),
      )
    ).flat(),
  );
}

/**
 * Try to parse a string as JSON or newline separated JSON for an easier-to-read snapshot.
 * If the string is parsable as neither, return the original string.
 */
function parseTextFile(input: string) {
  try {
    return JSON.parse(input);
  } catch (error) {
    // do nothing
  }

  try {
    return input
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (error) {
    // do nothing
  }

  return input;
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
function parseVectorTileTile(data: Buffer, {x, y, z}: VectorTileId) {
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
