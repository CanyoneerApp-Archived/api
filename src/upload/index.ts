import {S3} from '@aws-sdk/client-s3';
import FS from 'fs';
import Path from 'path';

export async function upload(region: string, bucket: string, s3Key: string | undefined = undefined, localPath = './output'): Promise<void> {
  const s3 = new S3({region: region});

  if ((await FS.promises.lstat(localPath)).isDirectory()) {
    await Promise.all((await FS.promises.readdir(localPath)).map((file) => {
      return upload(region, bucket, s3Key ? Path.join(s3Key, file) : file, Path.join(localPath, file),)
    }))
  } else {
    await s3.putObject({
      Key: s3Key,
      Bucket: bucket,
      Body: FS.createReadStream(localPath),
    })
  }
}
