import FS from 'fs';

export async function rmOutputDir() {
  try {
    await FS.promises.rm('./output', {recursive: true});
  } catch (error) {
    console.error(error);
  }
}
