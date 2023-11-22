import chalk from 'chalk';
import nodeCrypto from 'crypto';
import FS from 'fs-extra';
import fetch from 'node-fetch';
// @ts-ignore TODO create a type file for this module
import PromiseThrottle from 'promise-throttle';

const promiseThrottle = new PromiseThrottle({requestsPerSecond: 1});

function md5(input: string) {
  return nodeCrypto.createHash('md5').update(input).digest('hex');
}

function getPath(url: string) {
  return `./output/cache/${md5(url)}.txt`;
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
  transform: (url: string) => Promise<string> = defaultTransform,
) {
  const path = getPath(url);

  if (!(await cachedFetch.has(url))) {
    const text = await promiseThrottle.add(async () => {
      console.log(chalk.dim(`Fetching ${url}`))
      return await transform(url);
    });
    if (text) {
      await FS.writeFile(path, text);
    }
    return text;
  } else {
    return FS.readFile(path, 'utf-8');
  }
}

cachedFetch.has = async (url: string): Promise<boolean> => {
  const path = getPath(url);
  // TODO use async API like FS.promises.access
  return FS.existsSync(path);
};

export default cachedFetch;
