import { useState, useEffect } from 'react';
import { Question, TestConfig } from '../types';
import data from '../data/questions.json';
import { useAuth } from '../contexts/AuthContext';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface TestGeneratorProps {
  onStartTest: (questions: Question[], config: TestConfig) => void;
}

export default function TestGenerator({ onStartTest }: TestGeneratorProps) {
  const { user } = useAuth();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [struggleFocus, setStruggleFocus] = useState(false);
  const [error, setError] = useState('');

  // Extract unique modules
  const allModules = Array.from(new Set(data.database.map((q) => q.module_topic))).sort();

  useEffect(() => {
    // Default select all modules
    setSelectedModules(allModules);
  }, []);

  const handleStart = () => {
    let filteredQuestions = data.database.filter((q) => selectedModules.includes(q.module_topic));

    if (difficulty !== 'mixed') {
      filteredQuestions = filteredQuestions.filter((q) => q.difficulty === difficulty);
    }

    if (struggleFocus && user?.history) {
      const wrongQuestionIds = new Set<string>();
      user.history.forEach((test) => {
        test.answers.forEach((ans) => {
          if (!ans.isCorrect) wrongQuestionIds.add(ans.questionId);
        });
      });
      filteredQuestions = filteredQuestions.filter((q) => wrongQuestionIds.has(q.id));
      
      if (filteredQuestions.length === 0) {
        setError("No incorrect questions found in your history! Great job!");
        return;
      }
    }

    if (filteredQuestions.length === 0) {
      setError("No questions match your criteria. Try selecting more modules or a different difficulty.");
      return;
    }

    // Shuffle and slice
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    onStartTest(selected as Question[], {
      questionCount,
      modules: selectedModules,
      difficulty,
      struggleFocus,
    });
  };

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Practice Test</h2>
      </div>

      <div className="space-y-8">
        {/* Question Count */}
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Number of Questions
          </label>
          <div className="flex gap-4">
            {[10, 20, 50].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                  questionCount === count
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-500"
                    : "border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Difficulty
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['easy', 'medium', 'hard', 'mixed'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff as any)}
                className={cn(
                  "py-2 px-4 rounded-lg border capitalize transition-all",
                  difficulty === diff
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-500"
                    : "border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Modules
          </label>
          <div className="space-y-2">
            {allModules.map((mod) => (
              <div
                key={mod}
                onClick={() => toggleModule(mod)}
                className={cn(
                  "flex items-center p-3 rounded-xl border cursor-pointer transition-all",
                  selectedModules.includes(mod)
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500"
                    : "border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center mr-3",
                  selectedModules.includes(mod)
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300 dark:border-zinc-500"
                )}>
                  {selectedModules.includes(mod) && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-gray-700 dark:text-gray-200 text-sm">{mod}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Struggle Focus */}
        {user?.username !== 'Guest' && (
          <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">Struggle Focus</h3>
              <p className="text-sm text-orange-600 dark:text-orange-300/70">Only include questions you've missed before</p>
            </div>
            <button
              onClick={() => setStruggleFocus(!struggleFocus)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                struggleFocus ? "bg-orange-500" : "bg-gray-300 dark:bg-zinc-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  struggleFocus ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Generate Test
        </button>
      </div>
    </motion.div>
  );
}
