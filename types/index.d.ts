import { ExecException, ChildProcess } from 'child_process'

declare function fastFolderSize(
  path: string,
  callback: (err: ExecException | null, bytes?: number) => void
): ChildProcess

export = fastFolderSize

declare module 'fast-folder-size/sync' {
  function fastFolderSize(path: string): number
  export = fastFolderSize
}
