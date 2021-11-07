import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import type { Lazy } from 'fp-ts/function'

import type { Writer } from './Writer'
import type { WriterEither } from './WriterEither'

export type TaskWriterEither<E, A> = () => Promise<Writer<E.Either<E, A>>>

export const of: <E, A>(m: string, a: A) => TaskWriterEither<E, A> = (
  m,
  a,
) => async () => Promise.resolve([[m], E.right(a)])

export const tryCatch: (
  m: string,
) => <E, A>(
  f: Lazy<Promise<A>>,
  onRejected: (reason: unknown) => E,
) => TaskWriterEither<E, A> = (m) => (f, onRejected) => async () =>
  f().then(
    (a) => [[m], E.right(a)],
    (reason) => [[m], E.left(onRejected(reason))],
  )

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: TaskWriterEither<E, A>) => TaskWriterEither<E, B> = (f) => (
  fa,
) => async () =>
  Promise.resolve()
    .then(fa)
    .then(([m, a]) => (E.isRight(a) ? [m, E.right(f(a.right))] : [m, a]))

export const tell: <E, A>(
  m: string,
) => (fa: TaskWriterEither<E, A>) => TaskWriterEither<E, A> = (m) => (fa) => async () =>
  Promise.resolve()
    .then(fa)
    .then(([ma, a]) => (E.isRight(a) ? [[...ma, m], a] : [ma, a]))

export const tellI: <E, A>(
  fm: (a: A) => string,
) => (fa: TaskWriterEither<E, A>) => TaskWriterEither<E, A> = (fm) => (
  fa,
) => async () =>
  Promise.resolve()
    .then(fa)
    .then(([ma, a]) => (E.isRight(a) ? [[...ma, fm(a.right)], a] : [ma, a]))

export const chainW: <E1, A, E2, B>(
  f: (a: A) => TaskWriterEither<E2, B>,
) => (fa: TaskWriterEither<E1, A>) => TaskWriterEither<E1 | E2, B> = (f) => (
  fa,
) => async () =>
  Promise.resolve()
    .then(fa)
    .then(async ([ma, a]) =>
      E.isRight(a) ? f(a.right)().then(([mb, b]) => [[...ma, ...mb], b]) : [ma, a],
    )

export const chain: <E, A, B>(
  f: (a: A) => TaskWriterEither<E, B>,
) => (fa: TaskWriterEither<E, A>) => TaskWriterEither<E, B> = chainW

export const orElseW: <E1, A, E2, B>(
  onLeft: (e: E1) => TaskWriterEither<E2, B>,
) => (fa: TaskWriterEither<E1, A>) => TaskWriterEither<E2, A | B> = (onLeft) => (
  fa,
) => async () =>
  Promise.resolve()
    .then(fa)
    .then(([m, v]) =>
      E.isRight(v) ? [m, v] : onLeft(v.left)().then(([mb, b]) => [[...m, ...mb], b]),
    )

export const orElse: <E1, A, E2>(
  onLeft: (e: E1) => TaskWriterEither<E2, A>,
) => (fa: TaskWriterEither<E1, A>) => TaskWriterEither<E2, A> = orElseW

export const foldW = <E, A, B, C>(
  onLeft: (m: readonly string[], e: E) => T.Task<B>,
  onRight: (m: readonly string[], a: A) => T.Task<C>,
) => (fa: TaskWriterEither<E, A>): T.Task<B | C> => async () =>
  Promise.resolve()
    .then(fa)
    .then(
      async ([m, a]): Promise<B | C> =>
        E.isRight(a) ? onRight(m, a.right)() : onLeft(m, a.left)(),
    )

export const fold: <E, A, B>(
  onLeft: (m: readonly string[], e: E) => T.Task<B>,
  onRight: (m: readonly string[], a: A) => T.Task<B>,
) => (fa: TaskWriterEither<E, A>) => T.Task<B> = foldW

export const fromEither: (
  m: string,
) => <E, A>(fa: E.Either<E, A>) => TaskWriterEither<E, A> = (m) => (fa) => async () =>
  Promise.resolve([[m], fa])

export const fromTaskEither: (
  m: string,
) => <E, A>(fa: TE.TaskEither<E, A>) => TaskWriterEither<E, A> = (m) => (
  fa,
) => async () =>
  Promise.resolve()
    .then(fa)
    .then((a) => [[m], a])

export const fromWriterEither: <E, A>(
  fa: WriterEither<E, A>,
) => TaskWriterEither<E, A> = T.of
