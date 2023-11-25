import {CloudFormation, StackEvent} from '@aws-sdk/client-cloudformation';
import {syncCloudFormationStack} from '@scree/aws-utils';
import chalk from 'chalk';
import {logger} from '../logger';
import {SyncStackOutput, getStackTemplate} from './getStackTemplate';

export async function syncStack(cloudFormation: CloudFormation) {
  if (!process.env.GIT_BRANCH) {
    throw new Error('Please run this script using "yarn start"');
  }

  const stackName = `canyoneer--${process.env.GIT_BRANCH}`;
  const template = getStackTemplate(stackName);

  const pad = getResourceIdPadding(stackName, template);

  logger.log('Syncing stack');
  const outputs = await syncCloudFormationStack<SyncStackOutput>(cloudFormation, {
    TemplateBody: JSON.stringify(template),
    StackName: stackName,
    EventHandler: (event: StackEvent) => {
      logger.verbose(
        chalk.dim(
          `${event.LogicalResourceId?.padEnd(pad)} ${event.ResourceStatus} ${event.ResourceStatusReason ?? ''
          }`,
        ),
      );
    },
  });
  logger.log('Stack synced');

  return outputs;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResourceIdPadding(stackName: string, template: any) {
  return Math.max(stackName.length, ...Object.keys(template.Resources).map(key => key.length));
}
