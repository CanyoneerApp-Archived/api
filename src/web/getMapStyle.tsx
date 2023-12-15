import mapbox from 'mapbox-gl';

interface GetMapStyleOptions {
  publicUrl: string;
}

const font = ['Open Sans Regular', 'Arial Unicode MS Regular'];
const fontBold = ['Open Sans Bold', 'Arial Unicode MS Bold'];
// const waypointCircleRadius = 5;
// const waypointLabelSize = 12;

export function getMapStyle({publicUrl}: GetMapStyleOptions): mapbox.Style {
  if (!publicUrl.endsWith('/')) publicUrl += '/';

  return {
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    version: 8,
    terrain: {source: 'dem', exaggeration: 2},
    sources: {
      routes: {
        type: 'vector',
        tiles: [`${new URL('v2/tiles/', publicUrl)}{z}/{x}/{y}.pbf`],
        maxzoom: 12,
      },
      dem: {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: 'linesCase',
        type: 'line',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': 'white',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 5],
        },
      },
      {
        id: 'lines',
        type: 'line',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': ['coalesce', ['get', 'stroke'], 'red'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 3],
        },
      },
      {
        id: 'routesOutline',
        type: 'circle',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'parent']],
        paint: {
          'circle-color': 'white',
          'circle-radius': 4,
        },
      },
      {
        id: 'routes',
        type: 'circle',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'parent']],
        paint: {
          'circle-color': 'black',
          'circle-radius': 3,
        },
      },
      {
        id: 'routeLabels',
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'parent']],
        source: 'routes',
        'source-layer': 'routes',
        type: 'symbol',
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
        layout: {
          'text-allow-overlap': false,
          'text-font': font,
          'text-field': [
            'format',
            ['get', 'name'],
            {'text-font': fontBold, 'text-scale': 1.2},
            [
              'concat',
              '\n',
              ['get', 'route.technicalRating'],
              ['get', 'route.waterRating'],
              ' ',
              ['get', 'route.timeRating'],
              ' • ',
              [
                'case',
                ['==', ['get', 'route.rappelCountMin'], ['get', 'route.rappelCountMax']],
                ['get', 'route.rappelCountMin'],
                ['concat', ['get', 'route.rappelCountMin'], '-', ['get', 'route.rappelCountMax']],
              ],
              'r, ',
              ['round', ['*', 3.28084, ['get', 'route.rappelLongestMeters']]],
              "' max",
            ],
            {},
          ],
          'text-size': 12,
          'text-offset': [0, 0.25],
          'text-anchor': 'top',
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
    ],
    // @ts-expect-error we are using a very new style spec
    imports: [
      {
        id: 'basemap',
        url: 'mapbox://styles/mapbox/standard',
        config: {
          font,
          showPointOfInterestLabels: true,
        },
      },
    ],
  };
}
