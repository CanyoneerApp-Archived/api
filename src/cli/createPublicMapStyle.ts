import FS from 'fs/promises';
import {getMapStyle} from '../web/getMapStyle';

export async function createPublicMapStyle(publicUrl: string | undefined) {
  const style = getMapStyle({publicUrl});
  await FS.writeFile('public/v2/mapStyle.json', JSON.stringify(style, null, '  '));
}
