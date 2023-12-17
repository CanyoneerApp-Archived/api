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
      composite: {
        url: 'mapbox://mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-bathymetry-v2',
        type: 'vector',
      },
      routes: {
        type: 'vector',
        // Mapbox requires this is an absolute URL
        tiles: [`${publicUrl}v2/tiles/{z}/{x}/{y}.pbf`],
        maxzoom: 12,
      },
      dem: {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      },
      curvature: {
        type: 'raster',
        tiles: [`${publicUrl}v2/slope/{z}/{x}/{y}.png`],
        tileSize: 512,
        maxzoom: 12,
        minzoom: 12,
      },
    },
    layers: [
      {
        id: 'curvatureRaster',
        type: 'raster',
        source: 'curvature',
        paint: {
          'raster-opacity': 1,
        },
        // @ts-expect-error we need to update these types
        slot: 'bottom',
      },
      {
        id: 'contour-line',
        type: 'line',
        source: 'composite',
        'source-layer': 'contour',
        minzoom: 11,
        filter: ['!=', ['get', 'index'], -1],
        layout: {},
        paint: {
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11,
            ['match', ['get', 'index'], [1, 2], 0.15, 0.3],
            13,
            ['match', ['get', 'index'], [1, 2], 0.3, 0.5],
          ],
          'line-color': 'hsl(60, 10%, 35%)',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13,
            ['match', ['get', 'index'], [1, 2], 0.5, 0.6],
            16,
            ['match', ['get', 'index'], [1, 2], 0.8, 1.2],
          ],
        },
        // @ts-expect-error we need to update these types
        slot: 'bottom',
      },
      {
        id: 'contour-label',
        type: 'symbol',
        source: 'composite',
        'source-layer': 'contour',
        minzoom: 11,
        filter: ['any', ['==', ['get', 'index'], 10], ['==', ['get', 'index'], 5]],
        layout: {
          'text-field': ['concat', ['get', 'ele'], ' m'],
          'symbol-placement': 'line',
          'text-pitch-alignment': 'viewport',
          'text-max-angle': 25,
          'text-padding': 5,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9.5, 20, 12],
        },
        paint: {
          'text-color': 'hsl(60, 10%, 35%)',
          'text-halo-width': 1,
          'text-halo-color': 'hsl(60, 10%, 85%)',
        },
        // @ts-expect-error we need to update these types
        slot: 'bottom',
      },

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
          'line-color': 'red',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 3],
        },
      },
      {
        id: 'linesSymbol',
        type: 'symbol',
        source: 'routes',
        'source-layer': 'routes',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
          'text-color': 'black',
        },
        layout: {
          'symbol-placement': 'line',
          'text-allow-overlap': true,
          'text-font': font,
          'text-field': [
            'concat',
            'mean: ',
            ['round', ['*', 10000000, ['get', 'curvatureMean']]],
            '\np05:',
            ['round', ['*', 10000000, ['get', 'curvatureP05']]],
            '\np50:',
            ['round', ['*', 10000000, ['get', 'curvatureP50']]],
            '\np95: ',
            ['round', ['*', 10000000, ['get', 'curvatureP95']]],
          ],
          'text-size': 12,
          'text-anchor': 'top',
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
              [
                'case',
                ['has', 'route.riskRating'],
                ['concat', ' ', ['get', 'route.riskRating']],
                '',
              ],
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
    imports: [
      {
        id: 'basemap',
        url: 'mapbox://styles/mapbox/standard',
        config: {
          font: font[0],
          showPointOfInterestLabels: true,
        },
      },
    ],
  };
}
