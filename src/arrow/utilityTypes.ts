import { Arrow } from './index'

/**
 * Extract the result (Right) type of the given Arrow type.
 */
export type ArrowsRight<ARROW> = ARROW extends Arrow<any, any, infer R> ? R : never

/**
 * Extract the error (Left) type of the given Arrow type.
 */
export type ArrowsLeft<ARROW> = ARROW extends Arrow<any, infer E, any> ? E : never

/**
 * Extract the dependencies D type of the given Arrow type.
 */
export type ArrowsDependencies<ARROW> = ARROW extends Arrow<infer D, any, any> ? D : never
