export const SIZES = {
  XS: '極小',
  S: '小',
  M: '中',
  L: '大',
  XL: '特大',
} as const

export type Sizes = (typeof SIZES)[keyof typeof SIZES]

// [NEW] 変身薬のアイテムタイプ. "NEOBELMIN", "PLUSTELIN", "COLLABORMIN" のどれかが入る
export const RECIPE_TYPE = {
  NEOBELMIN: 'NEOBELMIN',
  PLUSTELIN: 'PLUSTELIN',
  COLLABORMIN: 'COLLABORMIN',
  NEOBELMING: 'pb_NEOBELMIN_G',
} as const

export type RecipeType = (typeof RECIPE_TYPE)[keyof typeof RECIPE_TYPE]

export const RECIPE_TYPE_TEXT = {
  [RECIPE_TYPE.NEOBELMIN]: 'ネオベルミン',
  [RECIPE_TYPE.PLUSTELIN]: 'プラステリン',
  [RECIPE_TYPE.COLLABORMIN]: 'コラボルミン',
  [RECIPE_TYPE.NEOBELMING]: 'ネオベルミンG',
} as const

export type RecipeTypeText =
  (typeof RECIPE_TYPE_TEXT)[keyof typeof RECIPE_TYPE_TEXT]

// appendixが必要なリヴリーの種類. 現状は不要だが, 今後のために一応入れておく
export const COLLABO_TYPE = {
  COLLAB_SANRIO_2023: 'CollabSanrio2023',
  COLLAB_MGP_2024: 'CollabMGP2024',
  COLLAB_NIJISANJI_2025: 'CollabN2025',
  COLLAB_NIJISANJI_2026: 'CollabN2026',
} as const

export type CollaboType = (typeof COLLABO_TYPE)[keyof typeof COLLABO_TYPE]

// サンリオコラボでは, コラボ先のキャラの名称( "HelloKitty", "MyMelody", "Hangyodon", "Kuromi" のどれか )を入れる
export const COLLABO_PARAM = {
  HELLO_KITTY: 'HelloKitty',
  MY_MELODY: 'MyMelody',
  HANGYODON: 'Hangyodon',
  KUROMI: 'Kuromi',
} as const

export type CollaboParam = (typeof COLLABO_PARAM)[keyof typeof COLLABO_PARAM]
interface CalendarDate {
  year: number
  month: number
  day?: number
}

export interface Owner {
  name: string
  info: string
  ownerImgPath: string
}

export interface Neobelmin {
  /** オリジナルのリヴリー名 */
  name: string
  /** 必要数 */
  qty: number
}

export interface Fruit {
  /** 木の実の名前 */
  fruitName: string
  /** 必要数 */
  qty: number
  /** 木の実の画像パス */
  fruitImgPath: string
  /** 木が手に入るガチャ名 */
  gachaNames: string[]
  /** 実が付く木の名前 */
  treeName: string
}

export interface Motion {
  // TODO: enum指定
  motion: string
  label: string
  thumbnailPath: string
}

export interface Npc {
  /** 個体名 */
  individualName?: string
  /** 誕生日 */
  birth: CalendarDate | null
  /** 飼い主情報 */
  owner: Owner | null
}

export interface RelatedLivly {
  id: string
  name: string
  squareImgPath: string
}

export interface KeywordIdMap {
  [key: string]: string
}

export interface Recipe {
  neobelmin: Neobelmin | null
  type: RecipeType
  fruits: Fruit[]
}

export interface Appendix {
  type: CollaboType
  param: CollaboParam
}

export interface LivlyInfo {
  id: string
  /** モノリヴリーかどうかの判別。詳細ページで利用 */
  isMono: boolean
  /** 管理リヴリーかどうかの判別 */
  isNpc: boolean
  /** 画像パス。個別詳細画面用の大きい画像 */
  firstViewImgPath: string
  /** 画像パス。リスト表示用の正方形 */
  squareImgPath: string
  /** 種名 */
  kind: string
  /** 学名。管理リヴリーならnull or "" */
  scientific: string | null
  /** 説明 */
  info: string
  /** 登場年・月 */
  release: CalendarDate
  size: Sizes
  keywords: string[]
  /**  オリジナルリヴリーかプラステリンリヴリーかの判別 */
  isOriginal: boolean
  /** オリジナルリヴリーならネオベルミンレシピ、 プラステリンリヴリーならプラステリンレシピ */
  recipe: Recipe | null
  /** 動き */
  motions: Motion[] | null
  /** 関連リヴリー */
  relatedLivlys: RelatedLivly[]
  /** 管理リヴリーの追加情報 */
  npc: Npc | null
  /** オリジナルリヴリーの場合: プラステリンリヴリー一覧 */
  plusterinLivlyIds: string[]
  /** コラボ */
  appendix: Appendix | null // [NEW] 特殊な追加情報が必要な種の設定を入れるフィールド. 何もなければnull
}

/** 更新情報 */
export interface UpdateInfo {
  /** 最終更新日 */
  updateAt: CalendarDate
  /** 追加したリヴリーの数 */
  addedLivlyCount: number
  /** 次回更新予定日 */
  nextUpdateAt: CalendarDate
}

export interface PictureBookData {
  mono: LivlyInfo[]
  classic: LivlyInfo[]
  keywordIdToTextMap: KeywordIdMap
  version: string
  updateInfo: UpdateInfo
}
