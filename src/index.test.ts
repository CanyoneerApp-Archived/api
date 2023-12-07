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

      expect(await readOutputDir()).toMatchSnapshot();

      const stats = JSON.parse(await FS.promises.readFile('output/v2/stats.json', 'utf8'));
      expect(stats.indexBytes).toBeCloseTo(395);
      expect(stats.geojsonBytes).toBeCloseTo(2842);
      expect(stats.detailBytesSum).toBeCloseTo(13946);
      expect(stats.detailBytesMean).toBeCloseTo(2789.2);
      expect(stats.detailBytesP50).toBeCloseTo(2264);
      expect(stats.detailBytesP95).toBeCloseTo(886);
      expect(stats.detailBytesP99).toBeCloseTo(886);
      expect(stats.detailBytesMax).toBeCloseTo(7915);
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
