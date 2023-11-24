import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import chalk from 'chalk';
import {StackOutputs} from './syncStack/getStackTemplate';

export async function uploadOutput(s3: S3, outputs: StackOutputs) {
  console.log('Uploading');
  await syncS3Dir(s3, {
    ...outputs,
    LocalPath: './output',
    FileUploadedHandler: ({S3Key}) => console.log(chalk.dim(`Upload ${S3Key}`)),
  });
  console.log(`Uploaded to ${outputs.URL}/routes.json`);
}
