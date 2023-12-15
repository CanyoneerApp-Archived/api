import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, {useEffect, useState} from 'react';

export const Map = ({
  containerStyle,
  style,
  images = {},
}: {
  containerStyle?: React.CSSProperties;
  style: mapboxgl.Style;
  images?: {[id: string]: string};
}) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!element) return;

    const nextMap = new mapboxgl.Map({
      container: element,
      style,
      center: [-116.73219, 36.21582],
      zoom: 12,
      hash: true,
      attributionControl: false,
    });

    // disable map rotation using right click + drag
    nextMap.dragRotate.disable();

    // disable map rotation using touch rotation gesture
    nextMap.touchZoomRotate.disableRotation();

    // @ts-expect-error This window global is only for debugging purposes
    window.map = nextMap;

    setMap(nextMap);

    return () => nextMap?.remove();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  useMapStyle(map, style, images);

  return <div style={{height: '100%', ...containerStyle}} ref={setElement} />;
};

function useMapStyle(
  map: mapboxgl.Map | null,
  style: mapboxgl.Style,
  images: Record<string, string>,
) {
  useEffect(() => {
    if (!map) return () => {};

    const imageElements = Object.fromEntries(
      Object.entries(images).map(([id, src]) => {
        const img = document.createElement('img');
        img.src = src;
        return [id, img];
      }),
    );

    const onStyleImageMissing = () => {
      if (!map) return;
      for (const [id, img] of Object.entries(imageElements)) {
        if (!map.hasImage(id)) {
          map.addImage(id, img, {pixelRatio: 2});
        }
      }
    };

    map.on('styleimagemissing', onStyleImageMissing);
    return () => map.off('styleimagemissing', onStyleImageMissing);
  }, [map, images]);

  useEffect(() => {
    if (!map) return;

    for (const id of Object.keys(images)) {
      if (map.hasImage(id)) {
        // We remove all map images when the style changes so that style diffing can occur
        map.removeImage(id);
      }
    }

    map.setStyle(style);
  }, [style, map, images]);

  return style;
}

export default Map;
