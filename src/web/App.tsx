import mapboxgl from 'mapbox-gl';
import React from 'react';
import {Map} from './scree-map-utils';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3BpbmRyaWZ0IiwiYSI6ImNqaDg2bDBsdTBmZG0yd3MwZ2x4ampsdXUifQ.7E19C7BhF9Dfd1gdJiYTEg';

export function App() {
  console.log(process.env.PUBLIC_URL, window.location.href);

  return <Map style={getMapStyle()} />;
}

function getMapStyle(): mapboxgl.Style {
  const publicURL = new URL('http://localhost:8001');

  return {
    version: 8,
    terrain: {source: 'mapbox-dem', exaggeration: 2},
    sources: {
      routes: {
        type: 'vector',
        tiles: [`${publicURL}v2/tiles/{z}/{x}/{y}.pbf`],
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
        paint: {
          'line-color': 'red',
          'line-width': 2,
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
