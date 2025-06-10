'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type KanaChar = {
  character: string
  romanization: string
  char_id: string
  row: string
  type: 'hiragana' | 'katakana'
}

// Fungsi untuk menentukan baris yang tepat berdasarkan char_id
function getProperRow(char: any): string {
  // Mengambil huruf pertama dari romanisasi untuk klasifikasi baris dasar
  const firstChar = char.romanization?.[0] || '';
  
  // Klasifikasi untuk karakter kombinasi (yōon)
  if (char.romanization?.includes('y') && char.romanization?.length > 2) {
    // Karakter kombinasi seperti kya, pyo, nya, dll
    // Gunakan huruf konsonan pertama untuk klasifikasi
    return firstChar;
  }
  
  // Klasifikasi berdasarkan huruf pertama
  const rowMapping: Record<string, string> = {
    'a': 'a', 'i': 'a', 'u': 'a', 'e': 'a', 'o': 'a',
    'k': 'k', 'g': 'k', // k-gyō termasuk g-
    's': 's', 'z': 's', // s-gyō termasuk z-
    't': 't', 'd': 't', // t-gyō termasuk d-
    'n': 'n',
    'h': 'h', 'b': 'h', 'p': 'h', // h-gyō termasuk b- dan p-
    'm': 'm',
    'y': 'y',
    'r': 'r',
    'w': 'w'
  };
  
  return rowMapping[firstChar] || char.row || 'special';
}

export default function LearnPage() {
  const [data, setData] = useState<KanaChar[]>([])
  const [filter, setFilter] = useState<'hiragana' | 'katakana'>('hiragana')

  useEffect(() => {
    async function fetchData() {
      const hira = await fetch('/hiragana.json').then((res) => res.json())
      const kata = await fetch('/katakana.json').then((res) => res.json())

      const hiraData: KanaChar[] = hira.map((x: any) => ({ 
        ...x, 
        type: 'hiragana',
        row: getProperRow(x) // Menggunakan fungsi pengelompokkan row
      }))
      
      const kataData: KanaChar[] = kata.map((x: any) => ({ 
        ...x, 
        type: 'katakana',
        row: getProperRow(x) // Menggunakan fungsi pengelompokkan row
      }))

      setData([...hiraData, ...kataData])
    }

    fetchData()
  }, [])

  const filteredData = data.filter(d => d.type === filter)

  const grouped = filteredData.reduce((acc: Record<string, KanaChar[]>, item) => {
    const rowName = item.row || 'special'
    acc[rowName] = acc[rowName] || []
    acc[rowName].push(item)
    return acc
  }, {})

  // Fungsi untuk mendapatkan nama baris yang lebih deskriptif
  const getRowDisplayName = (rowId: string) => {
    const rowNames: Record<string, string> = {
      'a': 'A (あ行)',
      'k': 'K (か行/が行)',
      's': 'S (さ行/ざ行)',
      't': 'T (た行/だ行)',
      'n': 'N (な行)',
      'h': 'H (は行/ば行/ぱ行)',
      'm': 'M (ま行)',
      'y': 'Y (や行)',
      'r': 'R (ら行)',
      'w': 'W (わ行)',
      'special': 'Khusus'
    }
    return rowNames[rowId] || `Baris ${rowId.toUpperCase()}`
  }

  // Order rows in standard Japanese order
  const rowOrder = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'special']
  const orderedRows = Object.keys(grouped).sort((a, b) => {
    const aIndex = rowOrder.indexOf(a)
    const bIndex = rowOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

   const sortByJapaneseOrder = (a: KanaChar, b: KanaChar) => {
    // Urutan vokal Jepang
    const vowelOrder: Record<string, number> = { 'a': 0, 'i': 1, 'u': 2, 'e': 3, 'o': 4 };
    
    // Dapatkan vokal dari romanisasi
    const getVowel = (rom: string): string => {
      // Untuk karakter dasar (a, i, u, e, o)
      if (rom.length === 1 && vowelOrder[rom] !== undefined) {
        return rom;
      }
      // Untuk konsonan + vokal (ka, ki, dll) atau kombinasi (kya, pyo, dll)
      for (const vowel of Object.keys(vowelOrder)) {
        if (rom.includes(vowel)) {
          return vowel;
        }
      }
      return rom;
    };
    
    const aVowel = getVowel(a.romanization);
    const bVowel = getVowel(b.romanization);
    
    // Jika konsonan sama, urutkan berdasarkan vokal
    if (a.romanization[0] === b.romanization[0]) {
      return (vowelOrder[aVowel] ?? 999) - (vowelOrder[bVowel] ?? 999);
    }
    
    // Jika konsonan berbeda, biarkan diurutkan alfabetis
    return a.romanization.localeCompare(b.romanization);
  };


  return (
    <main className="p-6 max-w-5xl mx-auto bg-black min-h-screen text-white">
      {/* Link kembali kedua - untuk layar mobile atau kesederhanaan navigasi */}
            <div className="mt-8 mb-3">
              <Link href="/" className="text-gray-500 hover:text-blue-400 transition-colors inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Kembali ke Halaman Utama
              </Link>
            </div>
      <h1 className="text-3xl font-bold mb-4 site-title">Kumpulan Huruf Hiragana dan Katakana</h1>
      
      <p className="mb-6 text-gray-300 max-w-2xl">
        Pelajari huruf dasar Jepang dengan tampilan yang terorganisir berdasarkan baris vokal. 
        Setiap karakter ditampilkan dengan romanisasinya untuk memudahkan penghafalan.
      </p>
      
      <div className="flex gap-4 mb-8">
        {['hiragana', 'katakana'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-3 rounded-full transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-8 text-center site-title">
          {filter === 'hiragana' ? 'ひらがな' : 'カタカナ'}
        </h2>
        
        <div className="space-y-12">
        {orderedRows.map((row) => (
          <div key={row} className="mb-10">
            <h3 className="text-lg font-medium mb-4 text-gray-300 border-b border-gray-700 pb-2 bg-blue-900 px-3 py-2 rounded-t-md inline-block">
              {getRowDisplayName(row)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {grouped[row]
                .sort(sortByJapaneseOrder)
                .map((kana) => (
                <div 
                  key={kana.char_id} 
                  className="p-4 border border-gray-800 rounded-lg text-center hover:border-blue-500 transition-colors bg-white text-black"
                >
                  <div className="text-4xl mb-2">{kana.character}</div>
                  <div className="text-sm text-gray-600">{kana.romanization}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="mt-8 text-gray-400 text-sm">
        <h3 className="font-medium mb-2">Cara Menggunakan:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pilih "Hiragana" atau "Katakana" untuk beralih antara jenis huruf</li>
          <li>Huruf dikelompokkan berdasarkan baris vokal (あ行, か行, dll)</li>
          <li>Huruf kombinasi seperti きゃ (kya), ぴょ (pyo) dikelompokkan bersama baris dasarnya</li>
          <li>Coba ucapkan dan ingat bentuk masing-masing huruf</li>
        </ul>
      </div>
    </main>
  )
}