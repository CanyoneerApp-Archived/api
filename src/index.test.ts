import FS from 'fs';
import Path from 'path';
import {main} from '.';
import {logger} from './logger';

// This test can take longer than the default 5 seconds timeout
const timeout = 60 * 1000;

describe('scrape', () => {
  beforeAll(async () => {
    logger.enable = false;
  });

  it(
    'Maine',
    async () => {
      await main(['test', 'test', '--local', '--region', 'Maine']);
      expect(JSON.stringify(await getOutputDir(), null, '  ')).toMatchSnapshot();
    },
    timeout,
  );
});

const ignore = ['output/v1/schemas', 'output/v2/schemas', 'output/v2/tiles'];

async function getOutputDir(path = 'output') {
  return Object.fromEntries(
    (
      await Promise.all(
        FS.readdirSync(path).map(async (child): Promise<[string, string][]> => {
          const path1 = Path.join(path, child);
          if (ignore.includes(path1)) {
            return [];
          } else if ((await FS.promises.lstat(path1)).isDirectory()) {
            return Object.entries(await getOutputDir(path1));
          } else {
            return [[path1, parseFile(await FS.promises.readFile(path1, 'utf8'))]];
          }
        }),
      )
    ).flat(),
  );
}

/**
 * Try to parse a string as JSON or newline separated JSON for an easier-to-read snapshot.
 * If the string is neither, return the original string.
 */
function parseFile(input: string) {
  try {
    return JSON.parse(input);
  } catch (error) {
    // do nothing
  }

  try {
    return input
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (error) {
    // do nothing
  }

  return input;
}
