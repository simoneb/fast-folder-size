import { ExecException, ChildProcess } from 'child_process'
import fastFolderSizeSync from './sync'

declare function fastFolderSize(
  path: string,
  callback: (err: ExecException | null, bytes?: number) => void
): ChildProcess

export = fastFolderSize

declare module 'fast-folder-size/sync' {
  export = fastFolderSizeSync
}
