// @ts-ignore
import tippecanoe from 'tippecanoe';

export async function writeTippecanoe() {
  await tippecanoe(
    ['./output/index.geojson'],

    // You can pass any option from https://github.com/mapbox/tippecanoe. The node wrapper will
    // convert keys from camelCase to kebab-case.
    {
      // Write tiles to the specified directory instead of to an mbtiles file.
      outputToDirectory: './output/tiles',

      // the highest zoom level for which tiles are generated (default 14)
      maximumZoom: 12,

      // Use the specified layer name instead of deriving a name from the input filename or output
      // tileset. If there are multiple input files specified, the files are all merged into the
      // single named layer, even if they try to specify individual names with -L.
      layer: 'routes',

      // If the tiles are too big at low zoom levels, drop the least- visible features to allow
      // tiles to be created with those features that remain
      dropDensestAsNeeded: true,

      // Multiply the tolerance for line and polygon simplification by scale.The standard tolerance
      // tries to keep the line or polygon within one tile unit of its proper location.You can
      // probably go up to about 10 without too much visible difference.
      simplification: 10,
    },
    {echo: true},
  );
}
