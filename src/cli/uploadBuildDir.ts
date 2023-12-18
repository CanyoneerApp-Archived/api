import {S3} from '@aws-sdk/client-s3';
import {spawn} from 'child_process';
import {SyncStackOutput} from './syncStack/getStackTemplate';

export async function uploadBuildDir(_s3: S3, outputs: SyncStackOutput) {
  const child = spawn(`aws s3 sync ./build s3://${outputs.Bucket} --checksum --profile canyoneer`, {
    shell: true,
    stdio: 'inherit',
  });

  return new Promise<void>((resolve, reject) => {
    child.on('exit', code => (code ? reject(code) : resolve()));
  });
}
