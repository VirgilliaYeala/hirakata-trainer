import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 text-center p-6 bg-background">
      <h1 className="text-5xl font-bold mb-2 site-title">Hirakata Trainer</h1>
      <p className="text-gray-300 max-w-lg mb-6">
        Learn and memorize Japanese Hiragana and Katakana with
        flashcards, quizzes, and progress tracking.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Link href="/learn" className="menu-card group">
          <div className="h-full flex flex-col justify-between p-8 border border-white/20 rounded-lg bg-black backdrop-blur-sm transition-all duration-300 hover:bg-black hover:border-white/40">
            <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90">Belajar Kana</h2>
            <p className="text-sm text-gray-400 group-hover:text-gray-300">Lihat semua hiragana dan katakana per baris</p>
          </div>
        </Link>
        
        <Link href="/flashcard" className="menu-card group">
          <div className="h-full flex flex-col justify-between p-8 border border-white/20 rounded-lg bg-black backdrop-blur-sm transition-all duration-300 hover:bg-black hover:border-white/40">
            <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90">Flashcard</h2>
            <p className="text-sm text-gray-400 group-hover:text-gray-300">Berlatih menghafal huruf dengan kartu acak</p>
          </div>
        </Link>
        
        <Link href="/quiz" className="menu-card group">
          <div className="h-full flex flex-col justify-between p-8 border border-white/20 rounded-lg bg-black backdrop-blur-sm transition-all duration-300 hover:bg-black hover:border-white/40">
            <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90">Kuis</h2>
            <p className="text-sm text-gray-400 group-hover:text-gray-300">Tes kemampuan kamu dengan soal hiragana dan katakana</p>
          </div>
        </Link>
      </div>
    </main>
  )
}