import {useMemo} from 'react';
import {getBaseMapStyle} from './getBaseMapStyle';
import {useHillshadeMapStyle} from './useHillshadeMapStyle';

export function useMapStyle(): maplibregl.StyleSpecification {
  const baseStyle = getBaseMapStyle();
  const hillshadeStyle = useHillshadeMapStyle();

  return useMemo(() => {
    const beforeHillshadeIndex = baseStyle.layers.findIndex(
      layer => layer.id === 'landuse_cemetery',
    );
    const beforePlacesIndex = baseStyle.layers.findIndex(
      layer => layer.id === 'placelabel_locality-B',
    );

    return {
      ...baseStyle,
      sources: {
        ...baseStyle.sources,
        ...hillshadeStyle.sources,
      },
      layers: [
        ...baseStyle.layers.slice(0, beforeHillshadeIndex),
        ...hillshadeStyle.layers,
        ...baseStyle.layers.slice(beforeHillshadeIndex, beforePlacesIndex),
        ...baseStyle.layers.slice(beforePlacesIndex),
      ],
    };
  }, [baseStyle, hillshadeStyle]);
}
