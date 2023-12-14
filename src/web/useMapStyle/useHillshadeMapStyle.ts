export function useHillshadeMapStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      hillshadeSource: {
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        type: 'raster-dem',
        encoding: 'terrarium',
      },
    },
    layers: [
      {
        id: 'hillshade',
        source: 'hillshadeSource',
        type: 'hillshade',
        paint: {
          'hillshade-exaggeration': 0.15,
        },
      },
    ],
  };
}
