import FS from 'fs';

export async function rmOutputDir() {
  try {
    await FS.promises.rm('./output', {recursive: true, force: true});
    await FS.promises.mkdir('./output');
  } catch (error) {
    console.error(error);
  }
}
