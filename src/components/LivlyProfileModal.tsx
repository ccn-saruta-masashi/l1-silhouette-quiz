import {
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
} from 'react'
import { playPoinSound } from '../services/SoundEffects'
import { CloseIcon } from './CloseIcon'
import type { LivlyInfo } from '../types/api'

interface LivlyProfileModalProps {
  /** 表示するリヴリー。null の間は閉じている */
  livly: LivlyInfo | null
  /** サムネイル画像のパス（開くときに utils/quiz の pickProfileThumbnail で選ぶ） */
  thumbnail: string
  onClose: () => void
}

/** 登場年月を「2000年7月」の形にする */
function formatRelease({ year, month }: LivlyInfo['release']) {
  return `${year}年${month}月`
}

/**
 * リヴリーの紹介モーダル（種名・学名・大きさ・登場日・解説）。
 * ネイティブの <dialog> を使い、Esc キーやフォーカスの閉じ込めはブラウザに任せる。
 * 閉じるときは data-closing を付けてフェードアウトさせ、終わってから実際に閉じる
 */
export function LivlyProfileModal({
  livly,
  thumbnail,
  onClose,
}: LivlyProfileModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (livly && !dialog.open) {
      dialog.showModal()
      // ブラウザは開いたときに最初のボタン（「X」）へフォーカスを移し、Safari ではタップで
      // 開いてもフォーカスの枠線が出てしまう。代わりに枠線を出さないカード本体へ移す。
      // キーボードの人は Tab で「X」に移れて、そのときは枠線が出る
      cardRef.current?.focus({ preventScroll: true })
    }
    if (!livly && dialog.open) dialog.close()
  }, [livly])

  /**
   * 「ぽいん」と鳴らし、フェードアウトしてから閉じる。消えている途中にもう一度呼ばれても二重に処理しない。
   * 視差効果を減らす設定などでアニメーションがなければ、すぐ閉じる
   */
  const requestClose = async () => {
    const dialog = dialogRef.current
    if (!dialog?.open || 'closing' in dialog.dataset) return
    dialog.dataset.closing = ''
    // 開くときと同じ「ぽいん」を鳴らす（二重に呼ばれても上で止まるので 1 回だけ）
    playPoinSound()
    // ::backdrop の分も含めて、フェードアウトのアニメーションが終わるのを待つ
    // （ボタンのホバー色の変化などは待たない）
    const animations = dialog
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === 'animation-modal-fade-out',
      )
    await Promise.allSettled(animations.map((animation) => animation.finished))
    dialog.close()
  }

  // 閉じ終わったら印を外し、親の状態と揃える（Esc を連打してブラウザが直接閉じた場合もここに来る）
  const handleClose = () => {
    delete dialogRef.current?.dataset.closing
    onClose()
  }

  // Esc キーではブラウザがすぐ閉じてしまうので、止めてフェードアウトさせる
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    void requestClose()
  }

  // 中身の外（<dialog> 自身と、中身を中央に置く白い部分）を押したら閉じる
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (
      event.target === event.currentTarget ||
      event.target === bodyRef.current
    ) {
      void requestClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="profile-modal"
      aria-labelledby="profile-modal-kind"
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={closeOnBackdrop}
    >
      {livly && (
        <div ref={bodyRef} className="profile-modal-body">
          <button
            type="button"
            className="profile-modal-close"
            onClick={() => void requestClose()}
            aria-label="閉じる"
          >
            <CloseIcon />
          </button>
          <div ref={cardRef} className="profile-card" tabIndex={-1}>
            <img
              className="profile-thumbnail"
              src={thumbnail}
              alt=""
              draggable={false}
            />
            <dl className="profile-specs">
              <dt>種名</dt>
              <dd id="profile-modal-kind">{livly.kind}</dd>
              {livly.scientific && (
                <>
                  <dt>学名</dt>
                  <dd className="profile-scientific">{livly.scientific}</dd>
                </>
              )}
              <dt>大きさ</dt>
              <dd>{livly.size}</dd>
              <dt>登場日</dt>
              <dd>{formatRelease(livly.release)}</dd>
            </dl>
            <p className="profile-info">{livly.info}</p>
          </div>
        </div>
      )}
    </dialog>
  )
}
