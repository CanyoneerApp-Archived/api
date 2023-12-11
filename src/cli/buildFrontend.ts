import {spawn} from 'child_process';

export function buildFrontend(): Promise<unknown> {
  const child = spawn('yarn react-app-rewired build', {shell: true, stdio: 'inherit'});
  return new Promise((resolve, reject) => {
    child.on('exit', code => (code ? reject(code) : resolve(code)));
  });
}
