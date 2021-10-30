import type { Reader } from 'fp-ts/Reader'

import type { TaskWriter } from './TaskWriter'

export type ReaderTaskWriter<R, A> = Reader<R, TaskWriter<A>>
