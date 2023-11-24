import FS from 'fs';

export async function createOutputDir() {
  try {
    await FS.promises.rmdir('./output', {recursive: true});
  } catch (error) {
    console.error(error);
  }
}
