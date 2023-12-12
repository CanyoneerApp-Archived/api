import {spawn} from 'child_process';

/**
 * Builds the React web frontend using create-react-app.
 */
export function createBuild(): Promise<void> {
  const child = spawn('yarn react-app-rewired build', {shell: true, stdio: 'inherit'});
  return new Promise((resolve, reject) => {
    child.on('exit', code => (code ? reject(code) : resolve()));
  });
}
