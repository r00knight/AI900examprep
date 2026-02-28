import { useState, useEffect } from 'react';
import { Question, TestConfig, SavedState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, ArrowRight, Save, Flag, Home, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface QuizInterfaceProps {
  questions: Question[];
  config: TestConfig;
  initialState?: SavedState;
  onComplete: (score: number, total: number, answers: any[]) => void;
  onExit: () => void;
  onAbort: () => void;
}

export default function QuizInterface({
  questions,
  config,
  initialState,
  onComplete,
  onExit,
  onAbort,
}: QuizInterfaceProps) {
  const { saveUserState } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialState?.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>(initialState?.answers || {});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(initialState?.score || 0);
  const [showAbortDialog, setShowAbortDialog] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Load saved answer if returning to a question (though we currently just move forward)
  useEffect(() => {
    if (answers[currentQuestion.id]) {
      setSelectedOption(answers[currentQuestion.id]);
      setIsAnswered(true);
    } else {
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [currentIndex, currentQuestion.id]);

  // Save state on every change
  useEffect(() => {
    const state: SavedState = {
      questions,
      currentQuestionIndex: currentIndex,
      answers,
      score,
      config,
    };
    saveUserState(state);
  }, [currentIndex, answers, score]);

  const handleOptionSelect = (key: string) => {
    if (isAnswered) return;
    setSelectedOption(key);
    
    const isCorrect = key === currentQuestion.correct_answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: key,
    }));
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finish
      const resultAnswers = questions.map((q) => ({
        questionId: q.id,
        isCorrect: answers[q.id] === q.correct_answer,
        selectedAnswer: answers[q.id],
      }));
      onComplete(score, questions.length, resultAnswers);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full relative">
      {/* Header / Progress */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAbortDialog(true)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            Score: {score}
          </span>
          <button 
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save & Exit
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5 mb-8">
        <motion.div
          className="bg-indigo-600 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 dark:border-zinc-700"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-xs font-semibold text-gray-600 dark:text-gray-300 rounded uppercase tracking-wide">
              {currentQuestion.module_topic.split(':')[0]}
            </span>
            <span className={cn(
              "px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide",
              currentQuestion.difficulty === 'easy' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              currentQuestion.difficulty === 'medium' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, text]) => {
              const isSelected = selectedOption === key;
              const isCorrect = key === currentQuestion.correct_answer;
              const showCorrect = isAnswered && isCorrect;
              const showWrong = isAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                    !isAnswered && "hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50",
                    isSelected && !isAnswered && "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
                    showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500",
                    showWrong && "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500",
                    !isSelected && isAnswered && !isCorrect && "opacity-50 border-gray-200 dark:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                      showCorrect ? "bg-green-500 border-green-500 text-white" :
                      showWrong ? "bg-red-500 border-red-500 text-white" :
                      isSelected ? "bg-indigo-600 border-indigo-600 text-white" :
                      "border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-gray-400"
                    )}>
                      {key}
                    </span>
                    <span className={cn(
                      "font-medium",
                      showCorrect ? "text-green-700 dark:text-green-300" :
                      showWrong ? "text-red-700 dark:text-red-300" :
                      "text-gray-700 dark:text-gray-200"
                    )}>
                      {text}
                    </span>
                  </div>
                  
                  {showCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {showWrong && <XCircle className="w-6 h-6 text-red-500" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 overflow-hidden"
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Flag className="w-4 h-4" /> Explanation
                  </h4>
                  <p className="text-blue-700 dark:text-blue-200/80 text-sm leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg",
                isAnswered
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 transform hover:-translate-y-1"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Abort Confirmation Dialog */}
      <AnimatePresence>
        {showAbortDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-700"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Exit to Home Screen?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Are you sure you want to return to the home screen? The progress of the current test will be lost.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbortDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onAbort}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-lg shadow-red-500/20"
                >
                  Yes, Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
