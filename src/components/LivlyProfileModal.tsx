import { type MouseEvent, useEffect, useRef } from 'react'
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
 * ネイティブの <dialog> を使い、Esc キーやフォーカスの閉じ込めはブラウザに任せる
 */
export function LivlyProfileModal({
  livly,
  thumbnail,
  onClose,
}: LivlyProfileModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (livly && !dialog.open) dialog.showModal()
    if (!livly && dialog.open) dialog.close()
  }, [livly])

  // カードの外（<dialog> 自身＝背景側）を押したら閉じる
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    // Esc で閉じたときも onClose が呼ばれ、親の状態と揃う
    <dialog
      ref={dialogRef}
      className="profile-modal"
      aria-labelledby="profile-modal-kind"
      onClose={onClose}
      onClick={closeOnBackdrop}
    >
      {livly && (
        <div className="profile-modal-body">
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            X
          </button>
          <div className="profile-card">
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
