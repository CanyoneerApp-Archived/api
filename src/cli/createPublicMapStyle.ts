import FS from 'fs/promises';
import {getMapStyle} from '../web/getMapStyle';

/**
 * Generate a Mapbox Style Spec document at public/v2/mapStyle.json
 */
export async function createPublicMapStyle(publicUrl: string) {
  const style = getMapStyle({publicUrl});
  await FS.writeFile('public/style.json', JSON.stringify(style, null, '  '));
}
