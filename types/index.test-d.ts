import { expectType } from 'tsd'
import { ExecException, ChildProcess } from 'child_process'
import fastFolderSize from '.'

expectType<ChildProcess>(
  fastFolderSize('.', (err, bytes) => {
    expectType<ExecException | null>(err)
    expectType<number | undefined>(bytes)
  })
)
