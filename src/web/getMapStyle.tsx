import mapbox from 'mapbox-gl';
import {colors} from '../colors';

interface GetMapStyleOptions {
  publicUrl: string;
}

const font = ['DIN Pro Medium', 'Arial Unicode MS Regular'];
const fontBold = ['DIN Pro Bold', 'Arial Unicode MS Regular'];

const routeSize: mapboxgl.Expression = ['interpolate', ['linear'], ['zoom'], 8, 0, 15, 1.5];
const routePointSize: mapboxgl.Expression = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  0.25,
  15,
  0.75,
];

export function getMapStyle({publicUrl}: GetMapStyleOptions): mapbox.Style {
  if (!publicUrl.endsWith('/')) publicUrl += '/';

  return {
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    version: 8,
    sprite: `${publicUrl}sprite`,
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
    },
    layers: [
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
        metadata: {
          'mapbox:featureComponent': 'terrain',
          'mapbox:group': 'Terrain, land',
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
          'line-color': ['get', 'stroke'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 3],
        },
      },
      {
        id: 'waypointIcons',
        minzoom: 13,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'child']],
        source: 'routes',
        'source-layer': 'routes',
        type: 'symbol',
        paint: {
          'icon-color': ['get', 'stroke'],
          'icon-halo-color': 'white',
          'icon-halo-width': 1,
        },
        layout: {
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-image': 'waypoint',
          'icon-size': routePointSize,
          'icon-anchor': 'bottom',
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
      {
        id: 'waypointLabelsHigh',
        minzoom: 13,
        maxzoom: 16,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'child']],
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
          'text-field': ['format', ['get', 'name'], {}],
          'text-size': 12,
          'text-anchor': 'top',
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
      {
        id: 'waypointLabelsMedium',
        minzoom: 16,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'child']],
        source: 'routes',
        'source-layer': 'routes',
        type: 'symbol',
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
        layout: {
          'text-allow-overlap': true,
          'text-font': font,
          'text-field': ['format', ['get', 'name'], {'text-font': fontBold}],
          'text-size': 13,
          'text-anchor': 'top',
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
      {
        id: 'waypointLabelsLow',
        minzoom: 16,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], 'child']],
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
            {'text-font': fontBold},
            '\n',
            {},
            ['get', 'description'],
            {'font-scale': 0.9},
          ],
          'text-size': 13,
          'text-anchor': 'top',
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
      ...getRoutes({
        id: 'routesYesChildren',
        filter: [
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['==', ['get', 'type'], 'parent'],
          ['has', 'hasChildren'],
        ],
        maxzoom: 14,
      }),
      ...getRoutes({
        id: 'routesNoChildren',
        filter: [
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['==', ['get', 'type'], 'parent'],
          ['!', ['has', 'hasChildren']],
        ],
        maxzoom: undefined,
      }),
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

function getRoutes({
  id,
  filter,
  maxzoom,
}: {
  id: string;
  filter: mapboxgl.Layer['filter'];
  maxzoom: number | undefined;
}): mapboxgl.AnyLayer[] {
  return [
    {
      id: `${id}Symbols`,
      ...(maxzoom !== undefined ? {maxzoom} : {}),
      filter,
      source: 'routes',
      'source-layer': 'routes',
      type: 'symbol',
      paint: {
        'text-halo-color': 'white',
        'text-halo-width': 2,
        'icon-color': colors.red,
        'icon-halo-color': 'white',
        'icon-halo-width': 1,
      },
      layout: {
        'icon-size': routeSize,
        'icon-allow-overlap': true,
        'text-optional': true,
        'icon-image': 'waypoint',
        'icon-anchor': 'bottom',
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
            ['case', ['has', 'route.riskRating'], ['concat', ' ', ['get', 'route.riskRating']], ''],
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
        'text-size': 13,
        'text-anchor': 'top',
        'symbol-sort-key': ['get', 'sortKey'],
      },
    },
  ];
}
