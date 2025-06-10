'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useLocalStorage } from 'usehooks-ts'

type KanaChar = {
  character: string
  romanization: string
  char_id: string
  type: 'hiragana' | 'katakana'
}

type QuizMode = 'hiragana' | 'katakana' | 'mixed'
type QuizStats = {
  totalAnswered: number
  correctAnswers: number
  streak: number
  bestStreak: number
  lastPlayed: string
  characterStats: Record<string, { correct: number, attempts: number }>
}

export default function QuizPage() {
  // Quiz data states
  const [data, setData] = useState<KanaChar[]>([])
  const [filteredData, setFilteredData] = useState<KanaChar[]>([])
  const [question, setQuestion] = useState<KanaChar | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [quizMode, setQuizMode] = useState<QuizMode>('hiragana')
  const [isStarted, setIsStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // User interaction states
  const [input, setInput] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  
  // Progress tracking
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionsPerSession, setQuestionsPerSession] = useState(10)
  const [quizCompleted, setQuizCompleted] = useState(false)
  
  // Stats storage
  const [stats, setStats] = useLocalStorage<QuizStats>('kana-quiz-stats', {
    totalAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    lastPlayed: new Date().toISOString(),
    characterStats: {}
  })

  // Di bagian atas komponen
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    async function fetchKana() {
      setIsLoading(true)
      try {
        const hira = await fetch('/hiragana.json').then((r) => r.json())
        const kata = await fetch('/katakana.json').then((r) => r.json())
        const hiraData = hira.map((x: any) => ({ ...x, type: 'hiragana' }))
        const kataData = kata.map((x: any) => ({ ...x, type: 'katakana' }))
        const merged = [...hiraData, ...kataData]
        setData(merged)
      } catch (error) {
        console.error('Failed to fetch kana data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchKana()
  }, [])

  // Filter data based on selected quiz mode
  useEffect(() => {
    if (data.length === 0) return

    let filtered = data
    if (quizMode === 'hiragana') {
      filtered = data.filter(item => item.type === 'hiragana')
    } else if (quizMode === 'katakana') {
      filtered = data.filter(item => item.type === 'katakana')
    }

    // Shuffle the data
    const shuffled = [...filtered].sort(() => 0.5 - Math.random())
    setFilteredData(shuffled)
    
    // Set jumlah pertanyaan berdasarkan seluruh karakter yang ada
    setQuestionsPerSession(shuffled.length)
  }, [data, quizMode])

  // Generate a new question when quiz starts or when moving to next question
  const generateQuestion = () => {
    if (filteredData.length === 0) return
    
    // Check if quiz is complete
    if (currentQuestionIndex >= questionsPerSession) {
      setQuizCompleted(true)
      return
    }

    // Get question character
    const newQuestion = filteredData[currentQuestionIndex % filteredData.length]
    setQuestion(newQuestion)
    
    // Generate multiple choice options (3 wrong + 1 correct)
    const correctAnswer = newQuestion.romanization
    const wrongOptions = data
      .filter(item => item.romanization !== correctAnswer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(item => item.romanization)
    
    const allOptions = [...wrongOptions, correctAnswer].sort(() => 0.5 - Math.random())
    setOptions(allOptions)
    
    // Reset states for new question
    setInput('')
    setSelectedOption(null)
    setIsCorrect(null)
    setShowFeedback(false)
    
    // Focus on input if using text entry mode
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 0)
  }

  // Start or restart the quiz
  const startQuiz = () => {
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setIsStarted(true)
    setStats(prev => ({
      ...prev,
      lastPlayed: new Date().toISOString()
    }))
    generateQuestion()
  }

  // Informasi mode dan jumlah pertanyaan
  const getModeInfo = () => {
    switch(quizMode) {
      case 'hiragana':
        return `${filteredData.length} huruf Hiragana`;
      case 'katakana':
        return `${filteredData.length} huruf Katakana`;
      case 'mixed':
        return 'Campuran Hiragana & Katakana';
      default:
        return '';
    }
  }

  // Handle checking answer
  const checkAnswer = (submittedAnswer?: string) => {
    if (!question) return
    
    const userAnswer = submittedAnswer || input.trim().toLowerCase()
    const correctAnswer = question.romanization.toLowerCase()
    const correct = userAnswer === correctAnswer
    
    // Update UI feedback
    setIsCorrect(correct)
    setShowFeedback(true)
    setSelectedOption(userAnswer)
    
    // Update stats
    const updatedStats = {...stats}
    updatedStats.totalAnswered++
    
    if (correct) {
      updatedStats.correctAnswers++
      updatedStats.streak++
      if (updatedStats.streak > updatedStats.bestStreak) {
        updatedStats.bestStreak = updatedStats.streak
      }
    } else {
      updatedStats.streak = 0
    }
    
    // Track per-character stats
    if (!updatedStats.characterStats[question.char_id]) {
      updatedStats.characterStats[question.char_id] = { correct: 0, attempts: 0 }
    }
    updatedStats.characterStats[question.char_id].attempts++
    if (correct) {
      updatedStats.characterStats[question.char_id].correct++
    }
    
    setStats(updatedStats)
    
    // Move to next question after delay
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1)
      generateQuestion()
    }, 1500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkAnswer()
  }

  // Tambahkan fungsi resetStats di dalam komponen QuizPage
  const resetStats = () => {
    // Konfirmasi pengguna ingin mereset
    if (window.confirm('Yakin ingin menghapus semua statistik kuis? Data tidak dapat dikembalikan.')) {
      // Reset stats ke nilai awal
      setStats({
        totalAnswered: 0,
        correctAnswers: 0,
        streak: 0,
        bestStreak: 0,
        lastPlayed: new Date().toISOString(),
        characterStats: {}
      });
    }
  };
  
  const handleOptionSelect = (option: string) => {
    if (showFeedback) return // Prevent changing answer during feedback
    checkAnswer(option)
  }
  
  // Calculate progress percentage
  const progressPercentage = isStarted ? 
    Math.min(100, (currentQuestionIndex / questionsPerSession) * 100) : 0

  return (
    <main className="flex flex-col items-center min-h-screen bg-black text-white p-6">
      <div className="max-w-xl w-full mx-auto">
        <div className="mt-8 mb-3">
              <Link href="/" className="text-gray-500 hover:text-blue-400 transition-colors inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Kembali ke Halaman Utama
              </Link>
            </div>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          Kuis Kana
        </h1>

        {/* Tambahkan deskripsi di bawah judul */}
        <p className="text-gray-400 mb- flex items-center">
          Uji pemahaman Anda tentang huruf Jepang dengan menjawab romanisasi yang tepat. 
          Semakin banyak Anda berlatih, semakin baik penguasaan Anda!
        </p>
        
        {/* Quiz mode selector (before starting) */}
        {!isStarted && !quizCompleted && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg mt-6">
            <h2 className="text-xl font-semibold mb-4">Pilih Mode Kuis:</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => setQuizMode('hiragana')}
                className={`p-4 rounded-lg transition-all ${
                  quizMode === 'hiragana' 
                    ? 'bg-blue-600 shadow-lg' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-lg font-medium">ひらがな</div>
                <div className="text-sm text-gray-300">Hiragana</div>
                <div className="text-xs text-gray-400 mt-1">
                  {data.filter(item => item.type === 'hiragana').length} karakter
                </div>
              </button>
              
              <button 
                onClick={() => setQuizMode('katakana')}
                className={`p-4 rounded-lg transition-all ${
                  quizMode === 'katakana' 
                    ? 'bg-blue-600 shadow-lg' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-lg font-medium">カタカナ</div>
                <div className="text-sm text-gray-300">Katakana</div>
                <div className="text-xs text-gray-400 mt-1">
                  {data.filter(item => item.type === 'katakana').length} karakter
                </div>
              </button>
              
              <button 
                onClick={() => setQuizMode('mixed')}
                className={`p-4 rounded-lg transition-all ${
                  quizMode === 'mixed' 
                    ? 'bg-blue-600 shadow-lg' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-lg font-medium">混合</div>
                <div className="text-sm text-gray-300">Campuran</div>
                <div className="text-xs text-gray-400 mt-1">
                  {data.length} karakter total
                </div>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Statistik Kuis:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Jawaban</div>
                  <div className="text-xl font-semibold">
                    {isClient ? stats.totalAnswered : ''}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Jawaban Benar</div>
                  <div className="text-xl font-semibold text-green-400">
                    {isClient ? stats.correctAnswers : 0} 
                    <span className="text-sm text-gray-400 ml-1">
                      ({isClient && stats.totalAnswered > 0 
                        ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) 
                        : 0}%)
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Streak Saat Ini</div>
                  <div className="text-xl font-semibold text-yellow-400">{isClient ? stats.streak : 0}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Streak Terbaik</div>
                  <div className="text-xl font-semibold text-yellow-500">{isClient ? stats.bestStreak : 0}</div>
                </div>
              </div>

                {/* Tombol reset statistik */}
                {isClient && stats.totalAnswered > 0 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={resetStats}
                      className="text-red-400 hover:text-red-300 text-sm inline-flex items-center transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Reset Statistik
                    </button>
                  </div>
                )}
            </div>
            
            <button 
              onClick={startQuiz}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                        text-white font-medium py-3 rounded-lg transition-colors shadow-lg"
            >
              {isLoading ? 'Loading...' : `Mulai Kuis (${getModeInfo()})`}
            </button>
          </div>
        )}
        
        {/* Quiz in progress */}
        {isStarted && !quizCompleted && question && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg my-6">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Karakter {currentQuestionIndex + 1} dari {questionsPerSession}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Kana character display */}
            <div className="flex flex-col items-center my-8">
              <div className="text-9xl mb-2 font-light">{question.character}</div>
              <div className="text-sm text-gray-400">{question.type === 'hiragana' ? 'Hiragana' : 'Katakana'}</div>
            </div>
            
            {/* Multiple choice options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-4 text-lg rounded-lg transition-all ${
                    showFeedback && selectedOption === option
                      ? isCorrect
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : showFeedback && question.romanization === option && !isCorrect
                        ? 'bg-green-600 text-white' // Show correct answer
                        : selectedOption === option
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                  disabled={showFeedback}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Typing answer (alternative) */}
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-full p-3 rounded-l-lg bg-gray-800 text-white border ${
                    showFeedback 
                      ? isCorrect 
                        ? 'border-green-500' 
                        : 'border-red-500'
                      : 'border-gray-700'
                  }`}
                  placeholder="Atau ketik romaji di sini..."
                  disabled={showFeedback}
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-5 py-3 rounded-r-lg hover:bg-blue-700 transition-colors"
                  disabled={showFeedback || !input.trim()}
                >
                  Jawab
                </button>
              </div>
            </form>
            
            {/* Feedback area */}
            {showFeedback && (
              <div className={`mt-4 p-4 rounded-lg text-center ${
                isCorrect ? 'bg-green-700/20' : 'bg-red-700/20'
              }`}>
                <div className="text-xl font-bold mb-1">
                  {isCorrect ? '✅ Benar!' : '❌ Salah!'}
                </div>
                {!isCorrect && (
                  <div className="text-gray-300">
                    Jawaban benar: <span className="font-semibold">{question.romanization}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Quiz completed */}
        {quizCompleted && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg my-6 text-center">
            <div className="mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Kuis Selesai!</h2>
            <p className="text-gray-400 mb-6">
              Anda telah menyelesaikan seluruh {questionsPerSession} karakter {quizMode === 'mixed' ? 'campuran' : quizMode === 'hiragana' ? 'hiragana' : 'katakana'}.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{stats.streak}</div>
                <div className="text-sm text-gray-400">Streak Saat Ini</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">
                  {stats.correctAnswers}
                </div>
                <div className="text-sm text-gray-400">Jawaban Benar</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-400">
                  {stats.totalAnswered > 0 
                    ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) 
                    : 0}%
                </div>
                <div className="text-sm text-gray-400">Akurasi</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={startQuiz}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Mulai Kuis Baru
              </button>
              
              <Link 
                href="/"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}