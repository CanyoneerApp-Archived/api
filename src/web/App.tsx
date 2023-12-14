import React from 'react';
import {Map} from './scree-map-utils';
import {useMapStyle} from './useMapStyle';

export function App() {
  return <Map style={useMapStyle()} />;
}
