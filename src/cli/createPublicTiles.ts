// @ts-ignore there are no type definitions for this module
import tippecanoe from 'tippecanoe';
import {logger} from '../utils/logger';

export async function createPublicTiles() {
  await tippecanoe(
    ['./public/v2/index.geojson'],

    // You can pass any option from https://github.com/mapbox/tippecanoe. The node wrapper will
    // convert keys from camelCase to kebab-case.
    {
      // Write tiles to a directory instead of creating a mbtiles file
      outputToDirectory: './public/v2/tiles',

      // The highest zoom level for which tiles are generated. Choosing a larger value allows for
      // more detailed geometries at the expense of much larger download sizes.
      maximumZoom: 12,

      // Use the specified layer name instead of deriving a name from the input filename or output
      // tileset.
      layer: 'routes',

      // If the tiles are too big at low zoom levels, drop the least-visible features to allow
      // tiles to be created with those features that remain
      dropDensestAsNeeded: true,

      // Do not apply gzip compression to the vector tile files.
      noTileCompression: true,

      // Rate at which especially dense dots are dropped (default 0, for no effect). A gamma of 2
      // reduces the number of dots less than a pixel apart to the square root of their original
      // number.
      gamma: 0,

      // Rate at which dots are dropped at zoom levels below basezoom (default 2.5).
      dropRate: 1,

      //  Dynamically drop some fraction of features from large tiles to keep them under the 500K
      // size limit. It will probably look ugly at the tile boundaries.
      forceFeatureLimit: true,
    },
    {echo: logger.enable, async: true},
  );
}
