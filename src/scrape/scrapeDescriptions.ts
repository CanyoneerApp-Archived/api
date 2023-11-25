import {chunk as lodashChunk} from 'lodash';
import {parseString} from 'xml2js';
import {IndexRoute} from '../Route';

export async function scrapeDescriptions(
  indicies: IndexRoute[],
): Promise<(IndexRoute & {description: string})[]> {
  const chunks = lodashChunk(indicies, 50);
  const output: (IndexRoute & {description: string})[] = [];

  for (const chunk of chunks) {
    // TODO there's actually a ton of meatadata in here, do we even need the first pass over the index data?
    const url = `http://ropewiki.com/api.php?format=json&action=query&export=true&pageids=${chunk
      .map(index => index.id)
      .join('|')}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xml: any = await new Promise(async (resolve, reject) =>
      parseString((await (await fetch(url)).json()).query.export['*'], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }),
    );

    for (let i = 0; i < chunk.length; i++) {
      const index = chunk[i];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = xml.mediawiki.page.find((page: any) => page.id[0] === index.id).revision[0]
        .text[0]._;

      const startIndex = text.indexOf('==Introduction==');

      const o = {
        ...index,
        // TODO render this as HTML
        description: text.slice(startIndex),
      };

      console.log(o);

      output.push(o);
    }
  }

  // @ts-ignore
  return output;
}
