import { ExecException, ChildProcess } from 'child_process'

declare function fastFolderSize(
  path: string,
  options: { signal: AbortSignal },
  callback: (err: ExecException | null, bytes?: number) => void
): ChildProcess

declare function fastFolderSize(
  path: string,
  callback: (err: ExecException | null, bytes?: number) => void
): ChildProcess

export default fastFolderSize
