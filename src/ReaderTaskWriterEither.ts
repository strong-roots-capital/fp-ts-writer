import * as E from 'fp-ts/Either'
import type { Reader } from 'fp-ts/Reader'
import { pipe } from 'fp-ts/function'

import * as TWE from './TaskWriterEither'

export type ReaderTaskWriterEither<R, E, A> = Reader<R, TWE.TaskWriterEither<E, A>>

export const chainW: <R, E1, A, E2, B>(
  f: (a: A) => ReaderTaskWriterEither<R, E2, B>,
) => (fa: ReaderTaskWriterEither<R, E1, A>) => ReaderTaskWriterEither<R, E1 | E2, B> = (
  f,
) => (fa) => (r) =>
  pipe(
    fa(r),
    TWE.chainW((a) => f(a)(r)),
  )

export const chain: <R, E, A, B>(
  f: (a: A) => ReaderTaskWriterEither<R, E, B>,
) => (fa: ReaderTaskWriterEither<R, E, A>) => ReaderTaskWriterEither<R, E, B> = chainW

export const map: <A, B>(
  f: (a: A) => B,
) => <R, E>(fa: ReaderTaskWriterEither<R, E, A>) => ReaderTaskWriterEither<R, E, B> = (
  f,
) => (fa) => (r) =>
  pipe(
    fa(r),
    TWE.map((a) => f(a)),
  )

export const orElseW: <R, E1, E2, B>(
  onLeft: (e: E1) => ReaderTaskWriterEither<R, E2, B>,
) => <A>(
  fa: ReaderTaskWriterEither<R, E1, A>,
) => ReaderTaskWriterEither<R, E2, A | B> = (onLeft) => (fa) => (r) =>
  pipe(
    fa(r),
    TWE.orElseW((e) => onLeft(e)(r)),
  )

export const orElse: <R, E1, A, E2>(
  onLeft: (e: E1) => ReaderTaskWriterEither<R, E2, A>,
) => (
  fa: ReaderTaskWriterEither<R, E1, A>,
) => ReaderTaskWriterEither<R, E2, A> = orElseW

export const fromEither: (
  m: string,
) => <R, E, A>(fa: E.Either<E, A>) => ReaderTaskWriterEither<R, E, A> = (m) => (fa) => (
  _r,
) => pipe(fa, TWE.fromEither(m))

export const traverseArray = <R, E, A, B>(
  f: (a: A) => ReaderTaskWriterEither<R, E, B>,
) => (as: ReadonlyArray<A>): ReaderTaskWriterEither<R, E, ReadonlyArray<B>> => (r) => {
  const out: Array<TWE.TaskWriterEither<E, B>> = []
  for (const a of as) {
    out.push(f(a)(r))
  }
  return async () =>
    Promise.all(out.map(async (invokeTask) => invokeTask())).then((bs) => {
      // FIXME: TEST: this in the case of empty `as`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const log = bs[0]![0]
      const eithers = bs.map(([_, e]) => e)
      const either = E.sequenceArray(eithers)
      return [log, either]
    })
}

export const tell: <R, E, A>(
  m: string,
) => (fa: ReaderTaskWriterEither<R, E, A>) => ReaderTaskWriterEither<R, E, A> = (m) => (
  fa,
) => (r) => async () =>
  Promise.resolve()
    .then(fa(r))
    .then(([ma, a]) => (E.isRight(a) ? [[...ma, m], a] : [ma, a]))

export const tellI: <R, E, A>(
  fm: (a: A) => string,
) => (fa: ReaderTaskWriterEither<R, E, A>) => ReaderTaskWriterEither<R, E, A> = (
  fm,
) => (fa) => (r) => async () =>
  Promise.resolve()
    .then(fa(r))
    .then(([ma, a]) => (E.isRight(a) ? [[...ma, fm(a.right)], a] : [ma, a]))
