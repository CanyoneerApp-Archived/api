import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import chalk from 'chalk';
import {logger} from './logger';
import {SyncStackOutput} from './syncStack/getStackTemplate';

export async function uploadOutputDir(s3: S3, outputs: SyncStackOutput) {
  logger.log('Uploading');
  await syncS3Dir(s3, {
    ...outputs,
    LocalPath: './output',
    FileUploadedHandler: ({S3Key}) => console.log(chalk.dim(`Upload ${S3Key}`)),
  });
  logger.log(`Uploaded to ${outputs.URL}`);
}