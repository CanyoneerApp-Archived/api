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

async function cachedFetch(url: string) {
  const path = getPath(url);

  if (await cachedFetch.has(url)) {
    console.log(chalk.dim(`Fetch cached ${url}`));
    return FS.readFile(path, 'utf-8');
  } else {
    const text = await promiseThrottle.add(async () => {
      console.log(chalk.dim(`Fetch ${url}`));
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fetch error ${response.status} ${url}`);
      }
      return response.text();
    });
    await FS.writeFile(path, text);
    return text;
  }
}

cachedFetch.has = async (url: string): Promise<boolean> => {
  const path = getPath(url);
  // TODO use async API like FS.promises.access
  return FS.existsSync(path);
};

export default cachedFetch;
