import { Arrow } from './index'

export type ArrowsRight<ARROW> = ARROW extends Arrow<any, any, infer R> ? R : never
export type ArrowsLeft<ARROW> = ARROW extends Arrow<any, infer E, any> ? E : never
export type ArrowsDependencies<ARROW> = ARROW extends Arrow<infer D, any, any> ? D : never
