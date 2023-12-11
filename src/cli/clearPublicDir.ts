import FS from 'fs/promises';

export async function clearPublicDir() {
  try {
    await Promise.all([
      await FS.rm('./public/v1', {recursive: true, force: true}),
      await FS.rm('./public/v2', {recursive: true, force: true}),
    ]);
  } catch (error) {
    console.error(error);
  }
}
