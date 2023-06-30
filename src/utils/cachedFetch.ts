import fetch from 'node-fetch';
import FS from 'fs-extra';
import Path from 'path';
import nodeCrypto from 'crypto';
import PromiseThrottle from 'promise-throttle';

const promiseThrottle = new PromiseThrottle({requestsPerSecond: 5});

function md5(input: string) {
    return nodeCrypto.createHash('md5').update(input).digest('hex');
}

function getPath(url: string) {
    return Path.join(__dirname, '../../cache', `${md5(url)  }.txt`);
}

async function defaultTransform(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) { throw new Error(`HTTP response not ok: ${url} ${response.statusText}`); }
    return response.text();
}

async function cachedFetch(url: string, transform: (url: string) => Promise<string> = defaultTransform) {
    const path = getPath(url);

    if (!await cachedFetch.has(url)) {
        const text = await promiseThrottle.add(async () => {
            try {
                return await transform(url);
            } catch (error) {
                console.error(error);
                return undefined;
            }
        });
        if (text) {
            await FS.writeFile(path, text);
        }
        return text;

    } else {
        return FS.readFile(path, 'utf-8');

    }
}

cachedFetch.has = (url: string): Promise<boolean> => {
    const path = getPath(url);
    // @ts-ignore broken typings
    return FS.existsSync(path);
};

export default cachedFetch;
