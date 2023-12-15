import archiver from 'archiver';
import FS from 'fs';
import {logger} from '../utils/logger';

export function zipPublicDir(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: {level: 9},
    });

    archive.on('warning', error => {
      logger.error(error);
    });

    archive.on('error', error => {
      logger.error(error);
      reject(error);
    });

    archive.pipe(FS.createWriteStream('public/v2.zip'));

    archive.directory('public/v2', false);

    archive.finalize().then(resolve, reject);
  });
}
