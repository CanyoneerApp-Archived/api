import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import {logger} from './logger';
import {SyncStackOutput} from './syncStack/getStackTemplate';

export async function uploadOutputDir(s3: S3, outputs: SyncStackOutput) {
  await syncS3Dir(s3, {
    ...outputs,
    LocalPath: './output',
    FileUploadedHandler: ({S3Key, total, done}) => logger.progress(total, done, S3Key),
  });
}
