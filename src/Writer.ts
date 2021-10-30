export type Writer<A> = [readonly string[], A]

export const of: (m: string) => <A>(a: A) => Writer<A> = (m) => (a) => [[m], a]
