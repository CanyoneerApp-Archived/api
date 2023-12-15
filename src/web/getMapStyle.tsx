import type {Style} from 'mapbox-gl';

interface GetMapStyleOptions {
  publicUrl?: string;
}

export function getMapStyle({
  publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href).toString(),
}: GetMapStyleOptions = {}): Style {
  if (!publicUrl.endsWith('/')) publicUrl += '/';

  return {
    version: 8,
    terrain: {source: 'mapbox-dem', exaggeration: 2},
    sources: {
      routes: {
        type: 'vector',
        tiles: [`${publicUrl}v2/tiles/{z}/{x}/{y}.pbf`],
        maxzoom: 12,
      },
      'mapbox-dem': {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: 'routes',
        type: 'line',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': ['concat', ['get', 'stroke'], 'red'],
          'line-width': 4,
        },
      },
    ],
    // @ts-expect-error we are using a very new style spec
    imports: [
      {
        id: 'basemap',
        url: 'mapbox://styles/mapbox/standard',
        config: {},
      },
    ],
  };
}
