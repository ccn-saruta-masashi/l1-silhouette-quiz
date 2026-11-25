import { useEffect, useState } from 'react'
import { fetchData } from './services/PictureBookApi'
import type { PictureBookData } from './types/api'
import './App.css'

function App() {
  const [data, setData] = useState<PictureBookData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchData().then(setData, setError)
  }, [])

  if (error) {
    return <p className="status">データの取得に失敗しました: {error.message}</p>
  }
  if (!data) {
    return <p className="status">読み込み中…</p>
  }

  const { mono, updateInfo } = data
  const { year, month, day } = updateInfo.updateAt

  return (
    <main className="page">
      <header className="page-header">
        <h1>リヴリー一覧</h1>
        <p className="meta">
          {mono.length}体 ・ 図鑑更新日 {year}/{month}
          {day !== undefined && `/${day}`}
        </p>
      </header>

      <ul className="livly-grid">
        {mono.map((livly) => (
          <li key={livly.id} className="livly-card">
            <img
              className="livly-image"
              src={livly.firstViewImgPath}
              alt={livly.kind}
              loading="lazy"
              decoding="async"
            />
            <span className="livly-name">{livly.kind}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
