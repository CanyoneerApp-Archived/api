import assert from 'assert';
import {isNumber} from 'lodash';
import {TileId} from './TileId';

export function id2str(id: TileId) {
  return `${id.z}/${id.x}/${id.y}`;
}

export function str2id(str: string): TileId {
  const [z, x, y] = str.split('/').map(Number);
  assert(isNumber(z) && isNumber(x) && isNumber(y));
  return {z, x, y};
}
