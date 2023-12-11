import {spawn} from 'child_process';

/**
 * Builds the frontend of the application using create-react-app.
 */
export function buildFrontend(): Promise<void> {
  const child = spawn('yarn react-app-rewired build', {shell: true, stdio: 'inherit'});
  return new Promise((resolve, reject) => {
    child.on('exit', code => (code ? reject(code) : resolve()));
  });
}
