import * as T from 'fp-ts/Task'

import type { Writer } from './Writer'

export type TaskWriter<A> = T.Task<Writer<A>>
