/**
 * フォーカスの枠線を、Tab キーで移動したときだけ出すための印を付ける。
 *
 * ブラウザの :focus-visible は、モーダルを閉じたあとに元のボタンへフォーカスを戻すときなど、
 * 直前に Esc などのキーを押しただけでも枠線を出すことがあり、判断もブラウザごとに違う。
 * そこで、最後の操作が Tab キーなら <html data-keyboard> を付け、クリック・タップで外す。
 * 枠線を出すかどうかは index.css でこの印を見て決める
 */
export function trackKeyboardFocus() {
  const root = document.documentElement
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') root.dataset.keyboard = ''
    },
    true,
  )
  window.addEventListener(
    'pointerdown',
    () => {
      delete root.dataset.keyboard
    },
    true,
  )
}
