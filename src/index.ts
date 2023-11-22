import chalk from 'chalk';
import {program} from 'commander';
import {scrape} from './scrape';
import {updateStack} from './updateStack';
import {upload} from './upload';

program
  .option('--skipFetch', 'Do not make requests to RopeWiki, use only cached data')
  .option('--skipAWS', 'Do not update the AWS stack or upload to S3');

async function main() {
  program.parse();
  const options = program.opts<{skipAWS: boolean; skipFetch: boolean}>();

  if (options.skipAWS) {
    await scrape(options);
  } else {
    const stack = await updateStack();
    await scrape(options);
    await upload(stack);
    console.log(chalk.bold(`Done! ${stack.url}/routes.json`));
  }
}

main();
