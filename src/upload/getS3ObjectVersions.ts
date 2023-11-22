import {ObjectVersion, S3} from '@aws-sdk/client-s3';
import _ from 'lodash';

export const getS3ObjectVersions = _.memoize(
  async (s3: S3, bucket: string) => {
    const objects: ObjectVersion[] = [];
    let keyMarker: string | undefined;

    do {
      const output = await s3.listObjectVersions({Bucket: bucket, KeyMarker: keyMarker});
      if (output.IsTruncated) {
        keyMarker = output.NextKeyMarker;
      } else {
        keyMarker = undefined;
      }
      objects.push(...(output.Versions || []));
    } while (keyMarker);

    return objects;
  },
  (s3, bucket) => `${s3.config.region}:${bucket}`,
);
