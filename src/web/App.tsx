import mapboxgl from 'mapbox-gl';
import React from 'react';
import {Map} from './scree-map-utils';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3BpbmRyaWZ0IiwiYSI6ImNqaDg2bDBsdTBmZG0yd3MwZ2x4ampsdXUifQ.7E19C7BhF9Dfd1gdJiYTEg';

export function App() {
  console.log(process.env.PUBLIC_URL, window.location.href);

  return (
    <Map
      style={{
        version: 8,
        sources: {
          routes: {
            type: 'vector',
            tiles: [
              `${new URL(
                process.env.PUBLIC_URL,
                window.location.href,
              ).toString()}v2/tiles/{z}/{x}/{y}.pbf`,
            ],
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
            config: {
              lightPreset: 'dusk',
              showPointOfInterestLabels: false,
            },
          },
        ],
      }}
    />
  );
}
