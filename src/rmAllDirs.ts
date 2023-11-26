import FS from 'fs';

export async function rmAllDirs() {
  try {
    await FS.promises.rmdir('./output', {recursive: true});
  } catch (error) {
    console.error(error);
  }

  try {
    await FS.promises.rmdir('./cache', {recursive: true});
  } catch (error) {
    console.error(error);
  }
}
