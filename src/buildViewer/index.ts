import {spawn} from "child_process";
import {SyncStackOutput} from "../syncStack/getStackTemplate";

export function buildViewer(stack: SyncStackOutput) {
  const child = spawn(`REACT_APP_FOO=${stack.URL} yarn react-app-rewired build`, {stdio: 'inherit', shell: true})
  return new Promise<void>((resolve, reject) => child.on('close', (code) => code === 0 ? resolve() : reject(code)))
}
