import {
  CloudFormation,
  CreateStackCommandInput,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import getStackTemplate from './getStackTemplate';

export interface UpdateStackOptions {
  branch: string;
  app: string;
  region: string;
}

export async function updateStack(options: UpdateStackOptions) {
  const {region, app, branch} = options;
  const cloudFormation = new CloudFormation({region});
  const stackName = `${app}--${branch}`;

  try {
    const stackList = (await cloudFormation.listStacks({})).StackSummaries;
    const stack = stackList && stackList.find(s => s.StackName === stackName);

    const command: CreateStackCommandInput = {
      StackName: stackName,
      TemplateBody: getStackTemplate(options),
      Capabilities: ['CAPABILITY_IAM'],
    };

    const maxKeyLength = Math.max(stackName.length, ...Object.keys(JSON.parse(command.TemplateBody ?? "{}")).map(key => key.length))

    if (!stack || stack.StackStatus === 'DELETE_COMPLETE') {
      console.log('Creating new stack');

      await cloudFormation.createStack(command);

      const stopLoggingStackEvents = logStackEvents(maxKeyLength);

      await waitUntilStackCreateComplete(
        {client: cloudFormation, maxWaitTime: 60 * 5},
        {StackName: stackName},
      );

      stopLoggingStackEvents();
    } else {
      console.log('Updating existing stack');
      await cloudFormation.updateStack(command);

      const stopLoggingStackEvents = logStackEvents(maxKeyLength);

      await waitUntilStackUpdateComplete(
        {client: cloudFormation, maxWaitTime: 60 * 5},
        {StackName: stackName},
      );

      stopLoggingStackEvents();
    }

    const outputs = await getStackOutputs();
    console.log(outputs);
    return outputs;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message !== 'No updates are to be performed.') {
      throw error;
    } else {
      console.log('No stack updates found');
    }
  }

  async function getStackOutputs() {
    const response = await cloudFormation.describeStacks({StackName: stackName});
    return Object.fromEntries(
      response.Stacks?.[0].Outputs?.map(output => [output.OutputKey, output.OutputValue]) ?? [],
    );
  }

  function logStackEvents(maxKeyLength: number) {
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
            `${event.LogicalResourceId?.padEnd(maxKeyLength)} ${event.ResourceStatus} ${event.ResourceStatusReason ?? ''
            }`,
          ),
        );
      });
    }, 500);

    return () => setInterval(() => clearInterval(interval));
  }
}
