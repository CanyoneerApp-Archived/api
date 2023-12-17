import Crypto from 'crypto';
import FS from 'fs';
import Path from 'path';
import PromiseThrottle from 'promise-throttle';
import {logger} from '../../utils/logger';

const throttle: {[host: string]: PromiseThrottle} = {
  'api.mapbox.com': new PromiseThrottle({requestsPerSecond: 100}),
  'ropewiki.com': new PromiseThrottle({requestsPerSecond: 1}),
};

export function md5(input: string) {
  return Crypto.createHash('md5').update(input).digest('hex');
}

export default function cachedFetch(
  urlObject: URL,
  encoding: 'utf-8',
  cachePath: string,
): Promise<string>;
export default function cachedFetch(
  urlObject: URL,
  encoding: undefined,
  cachePath: string,
): Promise<Buffer>;
export default async function cachedFetch(
  urlObject: URL,
  encoding: 'utf-8' | undefined,
  cachePath: string,
) {
  const url = urlObject.toString();
  const path = Path.join(cachePath, `${md5(url)}.txt`);

  try {
    const text = await FS.promises.readFile(path, encoding);
    logger.fetch(url, 'cached');
    return text;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }

    const hostThrottle = throttle[urlObject.host];
    if (!hostThrottle) {
      throw new Error(`Please set a throttling rate for "${urlObject.host}"`);
    }

    const body = await hostThrottle.add(async () => {
      logger.fetch(url, 'live');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP response not ok: ${url} ${response.statusText}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    });

    if (body) {
      await FS.promises.mkdir(Path.dirname(path), {recursive: true});
      await FS.promises.writeFile(path, body);
    }

    return encoding === 'utf-8' ? new TextDecoder().decode(body) : body;
  }
}
