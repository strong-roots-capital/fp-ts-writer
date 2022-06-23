import test from 'ava'
import * as T from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'

import * as TWE from '../../src/TaskWriterEither'

test('should create a TWE from a try-catch that resolves', async (t) => {
  await pipe(
    TWE.tryCatch('attempting a risky stunt')(
      async () => Promise.resolve('passed'),
      (error) => `Failed with error ${error}`,
    ),
    TWE.fold(
      () =>
        T.fromIO(() => {
          t.fail('Expected promise to resolve')
        }),
      (log, resolved) =>
        T.fromIO(() => {
          t.deepEqual(log, ['attempting a risky stunt'])
          t.is(resolved, 'passed')
        }),
    ),
    async (invokeTask) => invokeTask(),
  )
})

test('should create a TWE from a try-catch that rejects', async (t) => {
  await pipe(
    TWE.tryCatch('attempting a risky stunt')(
      // eslint-disable-next-line prefer-promise-reject-errors
      async () => Promise.reject('rejected'),
      (error) => `Failed with error ${error}`,
    ),
    TWE.fold(
      (log, resolved) =>
        T.fromIO(() => {
          t.deepEqual(log, ['attempting a risky stunt'])
          t.is(resolved, 'Failed with error rejected')
        }),
      () =>
        T.fromIO(() => {
          t.fail('Expected promise to reject')
        }),
    ),
    async (invokeTask) => invokeTask(),
  )
})

test('should concatenate the log from several TWEs', async (t) => {
  await pipe(
    TWE.tryCatch('attempting a risky stunt')(
      async () => Promise.resolve('resolved'),
      (error) => `Failed with error ${error}`,
    ),
    TWE.chain(() =>
      TWE.tryCatch('attempting it again')(
        async () => Promise.resolve('resolved'),
        (error) => `Failed with error ${error}`,
      ),
    ),
    TWE.chain(() =>
      TWE.tryCatch('third time is the charm')(
        // eslint-disable-next-line prefer-promise-reject-errors
        async () => Promise.reject('rejected'),
        (error) => `Failed with error ${error}`,
      ),
    ),
    TWE.chain(() =>
      TWE.tryCatch('this should not appear in the logs')(
        async () => Promise.resolve('not applicable'),
        (error) => `Failed with error ${error}`,
      ),
    ),
    TWE.fold(
      (log, resolved) =>
        T.fromIO(() => {
          t.deepEqual(log, [
            'attempting a risky stunt',
            'attempting it again',
            'third time is the charm',
          ])
          t.is(resolved, 'Failed with error rejected')
        }),
      () =>
        T.fromIO(() => {
          t.fail('Expected promise to reject')
        }),
    ),
    async (invokeTask) => invokeTask(),
  )
})
