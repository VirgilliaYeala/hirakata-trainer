'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type KanaChar = {
  character: string
  romanization: string
  char_id: string
  type: 'hiragana' | 'katakana'
}

type FilterType = 'hiragana' | 'katakana'

export default function FlashcardPage() {
  const [data, setData] = useState<KanaChar[]>([])
  const [filtered, setFiltered] = useState<KanaChar[]>([])
  const [current, setCurrent] = useState<KanaChar | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [filter, setFilter] = useState<FilterType>('hiragana')
  const [isFlipping, setIsFlipping] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKana() {
      setLoading(true)
      try {
        const hiraRes = await fetch('/hiragana.json')
        const kataRes = await fetch('/katakana.json')

        const hiraRaw = await hiraRes.json()
        const kataRaw = await kataRes.json()

        // Tambahkan properti "type" agar bisa difilter
        const hiraData: KanaChar[] = hiraRaw.map((item: any) => ({
          ...item,
          type: 'hiragana',
        }))
        const kataData: KanaChar[] = kataRaw.map((item: any) => ({
          ...item,
          type: 'katakana',
        }))

        const merged = [...hiraData, ...kataData]
        setData(merged)
      } catch (error) {
        console.error('Failed to fetch kana data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKana()
  }, [])

  useEffect(() => {
    if (data.length === 0) return

    const subset = data.filter((item) => item.type === filter)
    setFiltered(subset)
    
    if (subset.length > 0) {
      setCurrent(subset[Math.floor(Math.random() * subset.length)])
      setShowAnswer(false)
    }
  }, [data, filter])

  const nextCard = () => {
    if (filtered.length === 0) return
    
    setIsFlipping(true)
    setStreak(prev => prev + 1)
    
    // Delay to allow flip animation
    setTimeout(() => {
      const random = filtered[Math.floor(Math.random() * filtered.length)]
      setCurrent(random)
      setShowAnswer(false)
      setIsFlipping(false)
    }, 300)
  }

  const handleCardClick = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setShowAnswer(!showAnswer)
      setIsFlipping(false)
    }, 150)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-black text-white">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="mb-3">
              <Link href="/" className="text-gray-500 hover:text-blue-400 transition-colors inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Kembali ke Halaman Utama
              </Link>
            </div>
          <h1 className="text-3xl font-bold mb-3 flex items-center justify-center">  Flashcard
          </h1>
          
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Berlatih menghafal karakter Jepang dengan kartu flash. Klik kartu untuk 
            melihat romanisasi atau karakter aslinya.
          </p>

          {/* Filter Switch */}
          <div className="flex justify-center gap-4 mb-8">
            {['hiragana', 'katakana'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as FilterType)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-700/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f === 'hiragana' ? 'ひらがな' : 'カタカナ'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {current ? (
              <div className="mb-8">
                <div className="text-gray-400 text-sm text-center mb-2">
                  Klik kartu untuk {showAnswer ? "melihat karakter" : "melihat romanisasi"}
                </div>
                
                <div className="perspective-1000">
                  <div
                    onClick={handleCardClick}
                    className={`relative w-64 h-64 mx-auto cursor-pointer transform-style-preserve-3d
                              transition-all duration-300 ease-in-out
                              ${isFlipping ? 'scale-95' : 'scale-100 hover:scale-105'}`}
                  >
                    <div 
                      className={`absolute inset-0 flex items-center justify-center rounded-xl shadow-lg
                                ${showAnswer 
                                  ? 'bg-gradient-to-br from-blue-900 to-blue-700' 
                                  : 'bg-gradient-to-br from-gray-100 to-white'}`}
                    >
                      <span className={`text-7xl font-normal ${showAnswer ? 'text-blue-200' : 'text-gray-800'}`}>
                        {showAnswer ? current.romanization : current.character}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-center text-gray-500 text-xs">
                  {current.type === 'hiragana' ? 'ひらがな' : 'カタカナ'} • 
                  {showAnswer ? ' Romanisasi' : ' Karakter'}
                </div>
              </div>
            ) : (
              <div className="text-center p-10 text-gray-500">
                No characters found
              </div>
            )}

            <div className="text-center">
              {streak > 0 && (
                <div className="text-sm text-gray-500 mb-2">
                  Streak: <span className="text-yellow-500 font-medium">{streak}</span> kartu
                </div>
              )}
              
              <button
                onClick={nextCard}
                className="px-10 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full 
                          hover:from-blue-700 hover:to-blue-600 font-medium transform transition 
                          hover:shadow-lg hover:shadow-blue-700/20"
              >
                Kartu Berikutnya
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}