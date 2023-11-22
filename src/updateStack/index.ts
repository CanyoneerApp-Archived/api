import {
  CloudFormation,
  CreateStackCommandInput,
  waitUntilStackUpdateComplete
} from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import {StackOutputs, getStackTemplate} from './getStackTemplate';

if (!process.env.GIT_BRANCH) {
  throw new Error('Please run this script using "yarn start"');
}

const appName = 'canyoneer'
const branchName = process.env.GIT_BRANCH
const stackName = `${appName}--${branchName}`;

const region = 'us-east-1'
const cloudFormation = new CloudFormation({region});

export async function updateStack(): Promise<StackOutputs> {
  const stackList = (await cloudFormation.listStacks({})).StackSummaries;
  const stack = stackList && stackList.find(s => s.StackName === stackName);

  const template = getStackTemplate(stackName, region)
  const command: CreateStackCommandInput = {
    StackName: stackName,
    TemplateBody: JSON.stringify(template),
    Capabilities: ['CAPABILITY_IAM'],
  };

  const maxNameLength = getMaxNameLength(stackName, template)

  if (!stack || stack.StackStatus === 'DELETE_COMPLETE') {
    console.log('Creating new stack');

    try {
      await cloudFormation.createStack(command);
    } catch (error: any) {
      if (error.message === 'No updates are to be performed.') {
        console.log('No stack updates found');
        return
      } else {
        throw error;
      }
    }

  } else {
    console.log('Updating existing stack');

    try {
      await cloudFormation.updateStack(command);
    } catch (error: any) {
      if (error.message === 'No updates are to be performed.') {
        console.log('No stack updates found');
        return
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
  }

  const outputs = await getStackOutputs();
  console.log(outputs);
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
          `${event.LogicalResourceId?.padEnd(maxNameLength)} ${event.ResourceStatus} ${event.ResourceStatusReason ?? ''
          }`,
        ),
      );
    });
  }, 500);

  return () => setInterval(() => clearInterval(interval));
}

function getMaxNameLength(stackName: string, template: any) {
  return Math.max(stackName.length, ...Object.keys(template.Resources).map(key => key.length));
}

