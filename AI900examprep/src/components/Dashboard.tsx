import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Question, TestConfig, SavedState } from '../types';
import TestGenerator from './TestGenerator';
import QuizInterface from './QuizInterface';
import AdminPanel from './AdminPanel';
import { PlayCircle, History, Trophy, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, updateUserHistory, saveUserState } = useAuth();
  const [view, setView] = useState<'dashboard' | 'test' | 'results'>('dashboard');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeConfig, setActiveConfig] = useState<TestConfig | null>(null);
  const [testResult, setTestResult] = useState<{ score: number; total: number } | null>(null);

  const handleStartTest = (questions: Question[], config: TestConfig) => {
    setActiveQuestions(questions);
    setActiveConfig(config);
    setView('test');
  };

  const handleResumeTest = () => {
    if (user?.savedState) {
      setActiveQuestions(user.savedState.questions);
      setActiveConfig(user.savedState.config);
      setView('test');
    }
  };

  const handleTestComplete = (score: number, total: number, answers: any[]) => {
    const resultId = Date.now().toString();
    const result = {
      id: resultId,
      date: new Date().toISOString(),
      score,
      totalQuestions: total,
      answers,
    };
    
    updateUserHistory(result);
    // saveUserState(null); // Handled by updateUserHistory
    setTestResult({ score, total });
    setView('results');
  };

  const handleExitTest = () => {
    // State is already saved by QuizInterface
    setView('dashboard');
    setActiveQuestions([]);
    setActiveConfig(null);
  };

  const handleAbortTest = () => {
    saveUserState(null); // Clear saved state to lose progress
    setView('dashboard');
    setActiveQuestions([]);
    setActiveConfig(null);
  };

  if (view === 'test' && activeQuestions.length > 0 && activeConfig) {
    return (
      <QuizInterface
        questions={activeQuestions}
        config={activeConfig}
        initialState={user?.savedState || undefined}
        onComplete={handleTestComplete}
        onExit={handleExitTest}
        onAbort={handleAbortTest}
      />
    );
  }

  if (view === 'results' && testResult) {
    const percentage = Math.round((testResult.score / testResult.total) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-xl text-center border border-gray-100 dark:border-zinc-700"
      >
        <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Here's how you did</p>
        
        <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-4">
          {percentage}%
        </div>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          You got <span className="font-bold">{testResult.score}</span> out of <span className="font-bold">{testResult.total}</span> correct.
        </p>

        <button
          onClick={() => setView('dashboard')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          Back to Dashboard
        </button>
      </motion.div>
    );
  }

  // Calculate stats
  const totalTests = user?.history.length || 0;
  const avgScore = totalTests > 0
    ? Math.round(user!.history.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / totalTests)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
          <p className="text-indigo-100 mb-6">Ready to crush your AI-900 certification?</p>
          
          {user?.savedState && (
            <button
              onClick={handleResumeTest}
              className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Resume Test ({user.savedState.currentQuestionIndex + 1}/{user.savedState.questions.length})
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <History className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tests Taken</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg. Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TestGenerator onStartTest={handleStartTest} />
        </div>
        <div className="space-y-6">
          <AdminPanel />
          
          {/* Recent History */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            {user?.history && user.history.length > 0 ? (
              <div className="space-y-4">
                {user.history.slice(-5).reverse().map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Practice Test</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-sm font-bold",
                      (h.score / h.totalQuestions) >= 0.7 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {Math.round((h.score / h.totalQuestions) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No tests taken yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
