import {PutObjectCommandInput, S3} from '@aws-sdk/client-s3';
import chalk from 'chalk';
import Path from 'path';
import {getS3Etag} from './getS3Etag';
import {getS3ObjectVersions} from './getS3ObjectVersions';

interface SyncS3ObjectOptions extends PutObjectCommandInput {
  Body: Buffer;
  Bucket: string;
  Key: string;
}

export interface SyncS3ObjectOutput {
  S3Bucket: string;
  S3Key: string;
  S3ObjectVersion?: string;
}

export default async function syncS3Object(
  s3: S3,
  {Bucket: bucket, Key: key, Body: body, ...request}: SyncS3ObjectOptions,
): Promise<SyncS3ObjectOutput> {
  const objects = await getS3ObjectVersions(s3, bucket);
  const prevObject = objects.find(object => object.Key === key);
  const etag = getS3Etag(body);
  const prevEtag = prevObject?.ETag && JSON.parse(prevObject?.ETag);

  if (!prevObject || prevEtag !== etag) {
    console.log(chalk.dim(`Uploading ${key}`));
    const {VersionId: versionId, ETag: actualEtagJson} = await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: getContentType(Path.extname(key)),
      ...request,
    });

    const actualEtag = JSON.parse(actualEtagJson ?? '""');
    const expectedETag = getS3Etag(body);
    if (actualEtag !== expectedETag) {
      throw new Error(
        `ETag mismatch for "${key}": Expected ${JSON.parse(
          actualEtagJson ?? '',
        )} to equal ${expectedETag}`,
      );
    }

    return {
      S3Bucket: bucket,
      S3Key: key,
      S3ObjectVersion: versionId,
    };
  } else {
    console.log(chalk.dim(`Skipping upload ${key}`));
    return {
      S3Bucket: bucket,
      S3Key: key,
      S3ObjectVersion: prevObject.VersionId,
    };
  }
}

const getContentType = (ext: string) => {
  switch (ext) {
    case '.js':
      return 'application/javascript';
    case '.html':
      return 'text/html';
    case '.txt':
      return 'text/plain';
    case '.json':
      return 'application/json';
    case '.ico':
      return 'image/x-icon';
    case '.svg':
      return 'image/svg+xml';
    case '.css':
      return 'text/css';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.map':
      return 'binary/octet-stream';
    default:
      return 'application/octet-stream';
  }
};
