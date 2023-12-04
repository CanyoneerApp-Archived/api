// @ts-ignore there are no type definitions for this module
import tippecanoe from 'tippecanoe';

export async function writeTippecanoe() {
  await tippecanoe(
    ['./output/v2/index.geojson'],

    // You can pass any option from https://github.com/mapbox/tippecanoe. The node wrapper will
    // convert keys from camelCase to kebab-case.
    {
      // Write tiles to a directory instead of creating a mbtiles file
      outputToDirectory: './output/v2/tiles',

      // The highest zoom level for which tiles are generated. Choosing a larger value allows for
      // more detailed geometries at the expense of much larger download sizes.
      maximumZoom: 12,

      // Use the specified layer name instead of deriving a name from the input filename or output
      // tileset.
      layer: 'routes',

      // If the tiles are too big at low zoom levels, drop the least-visible features to allow
      // tiles to be created with those features that remain
      dropDensestAsNeeded: true,
    },
    {echo: true},
  );
}
