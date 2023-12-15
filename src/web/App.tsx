import mapboxgl from 'mapbox-gl';
import React from 'react';
import {Map} from './Map';
import {getMapStyle} from './getMapStyle';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3BpbmRyaWZ0IiwiYSI6ImNqaDg2bDBsdTBmZG0yd3MwZ2x4ampsdXUifQ.7E19C7BhF9Dfd1gdJiYTEg';

export function App() {
  console.log(process.env.PUBLIC_URL, window.location.href);

  return <Map style={getMapStyle()} />;
}
