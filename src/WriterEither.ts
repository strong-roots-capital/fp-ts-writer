import * as E from 'fp-ts/Either'

import type { Writer } from './Writer'

export type WriterEither<E, A> = Writer<E.Either<E, A>>

export const map: <E, A, B>(
  f: (a: A) => B,
) => (fa: WriterEither<E, A>) => WriterEither<E, B> = (f) => ([m, a]) =>
  E.isRight(a) ? [m, E.of(f(a.right))] : [m, a]

export const fromEither: (
  m: string,
) => <E, A>(fa: E.Either<E, A>) => WriterEither<E, A> = (m) => (fa) => [[m], fa]
