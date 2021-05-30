import { ChildProcess } from 'child_process'

declare function fastFolderSize(
  path: string,
  callback: (err: Error, bytes: number) => void
): ChildProcess

export = fastFolderSize
