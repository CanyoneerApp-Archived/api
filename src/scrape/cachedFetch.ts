import nodeCrypto from 'crypto';
import FS from 'fs';
import fetch from 'node-fetch';
import Path from 'path';
// @ts-ignore TODO create a type file for this module
import chalk from 'chalk';
import PromiseThrottle from 'promise-throttle';

const promiseThrottle = new PromiseThrottle({requestsPerSecond: 1});

export function md5(input: string) {
  return nodeCrypto.createHash('md5').update(input).digest('hex');
}

function getPath(url: string) {
  return Path.join(__dirname, '../../cache', `${md5(url)}.txt`);
}

async function defaultTransform(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP response not ok: ${url} ${response.statusText}`);
  }
  return response.text();
}

async function cachedFetch(
  url: string,
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
  transform: (url: string) => Promise<string> = defaultTransform,
) {
  const path = getPath(url);

  try {
    const text = await FS.promises.readFile(path, 'utf-8');
    console.log(chalk.dim(`Fetch cached ${url}`));
    return text;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }

    const text = await promiseThrottle.add(async () => {
      console.log(chalk.dim(`Fetch live ${url}`));
      return await transform(url);
    });

    if (text) {
      await FS.promises.mkdir(Path.dirname(path), {recursive: true});
      await FS.promises.writeFile(path, text);
    }
    return text;
  }
}

export default cachedFetch;
