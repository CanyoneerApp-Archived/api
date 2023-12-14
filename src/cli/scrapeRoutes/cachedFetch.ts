import Crypto from 'crypto';
import FS from 'fs';
import {memoize} from 'lodash';
import Path from 'path';
import PromiseThrottle from 'promise-throttle';
import {logger} from '../../utils/logger';

const promiseThrottle = new PromiseThrottle({requestsPerSecond: 1});

export function md5(input: string) {
  return Crypto.createHash('md5').update(input).digest('hex');
}

function getPath(url: string) {
  return Path.join(__dirname, '../../../cache', `${md5(url)}.txt`);
}

function cachedFetch(urlObject: URL, encoding: 'utf-8'): Promise<string>;
function cachedFetch(urlObject: URL): Promise<Buffer>;
async function cachedFetch(urlObject: URL, encoding?: 'utf-8') {
  const url = urlObject.toString();

  const path = getPath(url);

  try {
    const text = await FS.promises.readFile(path, encoding);
    logger.fetch(url, 'cached');
    return text;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }

    const body = await promiseThrottle.add(async () => {
      logger.fetch(url, 'live');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP response not ok: ${url} ${response.statusText}`);
      }
      return new Uint8Array(await (response).arrayBuffer())
    });

    if (body) {
      await FS.promises.mkdir(Path.dirname(path), {recursive: true});
      await FS.promises.writeFile(path, body);
    }

    return await FS.promises.readFile(path, encoding);
  }
}

export default memoize(cachedFetch, JSON.stringify);
