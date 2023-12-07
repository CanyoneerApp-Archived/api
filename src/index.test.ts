import FS from 'fs';
import Path from 'path';
import {main} from '.';
import {logger} from './logger';
import {WriteOutputStats} from './writeOutput';

const baselineStats = {
  regions: 'Maine',
  indexBytes: 395,
  geojsonBytes: 2842,
  detailBytesSum: 4286,
  detailBytesMean: 857.2,
  detailBytesP50: 472,
  detailBytesP95: 894,
  detailBytesP99: 894,
  detailBytesMax: 1249,
};

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
      expect(await readOutputDir()).toMatchSnapshot();
      await expectStatsToMatchBaseline();
    },
    timeout,
  );
});

const readOutputDirIgnore = [
  'output/v1/schemas',
  'output/v2/schemas',
  'output/v2/tiles',
  'output/v2/stats.json',
];

async function expectStatsToMatchBaseline() {
  const actualStats: WriteOutputStats = JSON.parse(
    await FS.promises.readFile('output/v2/stats.json', 'utf8'),
  );

  const names = Object.keys({...actualStats, ...baselineStats}) as (keyof WriteOutputStats)[];
  logger.outputStats(actualStats, baselineStats);

  expect(actualStats.regions).toBe(baselineStats.regions);

  for (const key of names) {
    if (key === 'regions') continue;
    const percentChange = Math.abs((baselineStats[key] - actualStats[key]) / baselineStats[key]);
    expect(percentChange).toBeCloseTo(0.01, 1);
  }
}

async function readOutputDir(parentPath = 'output') {
  return Object.fromEntries(
    (
      await Promise.all(
        FS.readdirSync(parentPath).map(async (childPathUnresolved): Promise<[string, string][]> => {
          const childPath = Path.join(parentPath, childPathUnresolved);

          // Child is ignored
          if (readOutputDirIgnore.includes(childPath)) {
            return [];

            // Child is a directory
          } else if ((await FS.promises.lstat(childPath)).isDirectory()) {
            return Object.entries(await readOutputDir(childPath));

            // Child is a file
          } else {
            return [[childPath, parseOutputFile(await FS.promises.readFile(childPath, 'utf8'))]];
          }
        }),
      )
    ).flat(),
  );
}

/**
 * Try to parse a string as JSON or newline separated JSON for an easier-to-read snapshot.
 * If the string is parsable as neither, return the original string.
 */
function parseOutputFile(input: string) {
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
