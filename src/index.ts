import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import chalk from 'chalk';
import {program} from 'commander';
import {scrape} from './scrape';
import {syncStack} from './syncStack';

program
  .option('--awsSkip', 'Skip updating the AWS stack and uploading files to S3', false)
  .option('--awsRegion', 'Set the AWS S3 region', 'us-east-1');

async function main() {
  program.parse();
  const options = program.opts<{awsSkip: boolean; awsRegion: string}>();

  if (options.awsSkip) {
    await scrape();
  } else {
    const s3 = new S3({region: options.awsRegion});
    const cloudFormation = new CloudFormation({region: options.awsRegion});

    const outputs = await syncStack(cloudFormation);
    await scrape();

    console.log('Uploading');
    await syncS3Dir(s3, {
      ...outputs,
      LocalPath: './output',
      FileUploadedHandler: ({S3Key}) => console.log(chalk.dim(`Upload ${S3Key}`)),
    });
    console.log(`Uploaded to ${outputs.URL}/routes.json`);
  }

  console.log(chalk.green(chalk.bold('Done')));
}

main();
