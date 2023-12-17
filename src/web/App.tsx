import {Map} from '@scree/kit';
import mapboxgl from 'mapbox-gl';
import React from 'react';
import {MAPBOX_TOKEN} from '../MAPBOX_TOKEN';
import {getMapStyle} from './getMapStyle';

mapboxgl.accessToken = MAPBOX_TOKEN;

export function App() {
  return <Map style={getMapStyle({publicUrl: process.env.PUBLIC_URL || window.location.origin})} />;
}
