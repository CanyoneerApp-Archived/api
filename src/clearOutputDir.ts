import FS from 'fs';

export async function clearOutputDir() {
  try {
    await FS.promises.rmdir('./output', {recursive: true});
    await FS.promises.mkdir('./output/details', {recursive: true});
  } catch (error) {
    console.error(error);
  }
}
