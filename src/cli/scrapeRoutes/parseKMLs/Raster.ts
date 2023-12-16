import {TileId} from './TileId';

export interface Raster {
  width: number;
  height: number;
  data: Float32Array;
  id: TileId;
}
