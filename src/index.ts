import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import chalk from 'chalk';
import {program} from 'commander';
import {scrape} from './scrape';
import {syncStack} from './syncStack';

program
  .option('--skipFetch', 'Do not make requests to RopeWiki, use only cached data')
  .option('--skipAWS', 'Do not update the AWS stack or upload to S3')
  .option('--region', 'Set the AWS S3 region', 'us-east-1');

async function main() {
  program.parse();
  const options = program.opts<{skipAWS: boolean; skipFetch: boolean; region: string}>();

  if (options.skipAWS) {
    await scrape(options);
  } else {
    const s3 = new S3({region: options.region});
    const cloudFormation = new CloudFormation({region: options.region});

    const outputs = await syncStack(cloudFormation);
    await scrape(options);

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
