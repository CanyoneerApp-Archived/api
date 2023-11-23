import {
  CloudFormation,
  CreateStackCommandInput,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import {isObject} from 'lodash';
import {StackOutputs, getStackTemplate} from './getStackTemplate';

if (!process.env.GIT_BRANCH) {
  throw new Error('Please run this script using "yarn start"');
}

const appName = 'canyoneer';
const branchName = process.env.GIT_BRANCH;
const stackName = `${appName}--${branchName}`;

const region = 'us-east-1';
const cloudFormation = new CloudFormation({region});

export async function updateStack(): Promise<StackOutputs> {
  const stackList = (await cloudFormation.listStacks({})).StackSummaries;
  const stack = stackList && stackList.find(s => s.StackName === stackName);

  const template = getStackTemplate(stackName, region);
  const command: CreateStackCommandInput = {
    StackName: stackName,
    TemplateBody: JSON.stringify(template),
    Capabilities: ['CAPABILITY_IAM'],
  };

  const maxNameLength = getMaxNameLength(template);

  if (!stack || stack.StackStatus === 'DELETE_COMPLETE') {
    console.log('Creating stack');

    await cloudFormation.createStack(command);

    const stopLoggingStackEvents = logStackEvents(maxNameLength);

    await waitUntilStackCreateComplete(
      {client: cloudFormation, maxWaitTime: 60 * 5},
      {StackName: stackName},
    );

    stopLoggingStackEvents();

    console.log('Stack created');
  } else {
    console.log('Updating stack');
    try {
      await cloudFormation.updateStack(command);
    } catch (error) {
      if (
        isObject(error) &&
        'message' in error &&
        error.message === 'No updates are to be performed.'
      ) {
        console.log('Stack unchanged');
      } else {
        throw error;
      }
    }

    const stopLoggingStackEvents = logStackEvents(maxNameLength);

    await waitUntilStackUpdateComplete(
      {client: cloudFormation, maxWaitTime: 60 * 5},
      {StackName: stackName},
    );

    stopLoggingStackEvents();

    console.log('Stack updated');
  }

  const outputs = await getStackOutputs();
  return outputs;
}

async function getStackOutputs(): Promise<StackOutputs> {
  const response = await cloudFormation.describeStacks({StackName: stackName});
  return Object.fromEntries(
    response.Stacks?.[0].Outputs?.map(output => [output.OutputKey, output.OutputValue]) ?? [],
  );
}

function logStackEvents(maxNameLength: number) {
  const startTime = new Date();
  const visitedEvents = new Set<string>();

  const interval = setInterval(async () => {
    const events = await cloudFormation.describeStackEvents({StackName: stackName});
    events.StackEvents?.forEach(event => {
      if (!event.EventId || !event.Timestamp) return;
      if (visitedEvents.has(event.EventId) || event.Timestamp <= startTime) return;
      visitedEvents.add(event.EventId);
      console.log(
        chalk.dim(
          `${event.LogicalResourceId?.padEnd(maxNameLength)} ${event.ResourceStatus} ${
            event.ResourceStatusReason ?? ''
          }`,
        ),
      );
    });
  }, 500);

  return () => clearInterval(interval);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMaxNameLength(template: any) {
  return Math.max(stackName.length, ...Object.keys(template.Resources).map(key => key.length));
}
