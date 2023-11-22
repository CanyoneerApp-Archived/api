// Vendored from

import crypto, {BinaryLike} from 'crypto';

function md5(contents: string | BinaryLike): string {
  return crypto.createHash('md5').update(contents).digest('hex');
}

// TODO this behavior seems to have changed with the aws-sdk v3 upgrade. Remove if this is unneeded.
export function getS3Etag(file: Buffer): string {
  return md5(file);
}
