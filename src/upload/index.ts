import {S3} from '@aws-sdk/client-s3';
import FS from 'fs';
import Path from 'path';
import PromiseThrottle from 'promise-throttle';
import syncS3Object from './syncS3Object';

const promiseThrottle = new PromiseThrottle({requestsPerSecond: 100});

interface UploadOptions {
  region: string;
  bucket: string;
  key?: string;
  localPath?: string;
}

export async function upload({
  region,
  bucket,
  key = undefined,
  localPath = './output',
}: UploadOptions): Promise<void> {
  const s3 = new S3({region: region});

  if ((await FS.promises.lstat(localPath)).isDirectory()) {
    await Promise.all(
      (await FS.promises.readdir(localPath)).map(file => {
        return upload({
          region,
          bucket,
          key: key ? Path.join(key, file) : file,
          localPath: Path.join(localPath, file),
        });
      }),
    );
  } else {
    await promiseThrottle.add(async () => {
      key ||= Path.basename(localPath);
      return syncS3Object(s3, {
        Key: key,
        Bucket: bucket,
        Body: await FS.promises.readFile(localPath),
      });
    });
  }
}
