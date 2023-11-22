import {S3} from '@aws-sdk/client-s3';
import FS from 'fs';
import Path from 'path';
import syncS3Object from './syncS3Object';

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
    await syncS3Object(s3, {
      Key: key || Path.basename(localPath),
      Bucket: bucket,
      Body: await FS.promises.readFile(localPath),
    });
  }
}
