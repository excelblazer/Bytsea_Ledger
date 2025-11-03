import React, { useState } from 'react';
import { PlayIcon, BookOpenIcon, LightBulbIcon, ChartBarIcon } from './icons';

interface DemoModeProps {
  onStartDemo: () => void;
  onSwitchToActual: () => void;
}

const DemoMode: React.FC<DemoModeProps> = ({ onStartDemo, onSwitchToActual }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: "Welcome to Bytsea Ledger",
      content: "Learn how our AI-powered bookkeeping system automatically categorizes your transactions using historical data and intelligent pattern recognition.",
      icon: <BookOpenIcon className="w-8 h-8 text-primary" />
    },
    {
      title: "How Transaction Mapping Works",
      content: "Our system uses a hierarchical approach: Book History → Client History → Industry Rules → Global Rules → AI Fallback. Each transaction is matched against your training data first, then industry standards, and finally AI analysis.",
      icon: <ChartBarIcon className="w-8 h-8 text-primary" />
    },
    {
      title: "Historical Data Matching",
      content: "Upload training transactions to teach the system your unique categorization patterns. The more data you provide, the smarter the system becomes at recognizing your business patterns.",
      icon: <LightBulbIcon className="w-8 h-8 text-primary" />
    },
    {
      title: "AI-Powered Intelligence",
      content: "When rules-based matching isn't enough, our Google Gemini AI analyzes transaction descriptions, amounts, and context to provide accurate categorizations. AI features are optional and work alongside your rules.",
      icon: <PlayIcon className="w-8 h-8 text-primary" />
    }
  ];

  const sampleTransactions = [
    { description: "Office Depot Purchase", amount: -45.67, category: "Office Supplies", method: "Historical Match" },
    { description: "Starbucks Coffee", amount: -12.45, category: "Meals & Entertainment", method: "Industry Rule" },
    { description: "Client Payment - ABC Corp", amount: 2500.00, category: "Service Revenue", method: "Book History" },
    { description: "Amazon Web Services", amount: -89.32, category: "Technology Services", method: "AI Analysis" },
    { description: "Business Insurance Premium", amount: -350.00, category: "Insurance", method: "Global Rule" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
              Bytsea Ledger Demo
            </span>
          </h1>
          <p className="text-xl text-textSecondary max-w-2xl mx-auto">
            Experience how our intelligent bookkeeping system categorizes transactions using historical data, industry rules, and AI analysis.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-surface rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setCurrentStep(0)}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                currentStep < 4 ? 'bg-primary text-white' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Learn First
            </button>
            <button
              onClick={onSwitchToActual}
              className="px-6 py-2 rounded-md font-medium text-textSecondary hover:text-textPrimary transition-colors"
            >
              Skip to Real Data
            </button>
          </div>
        </div>

        {currentStep < 4 ? (
          /* Educational Steps */
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-xl shadow-2xl p-8 mb-8">
              <div className="flex items-center mb-6">
                {demoSteps[currentStep].icon}
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-textPrimary">{demoSteps[currentStep].title}</h2>
                  <div className="flex items-center mt-2">
                    {demoSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full mx-1 ${
                          index <= currentStep ? 'bg-primary' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-textSecondary text-lg leading-relaxed mb-8">
                {demoSteps[currentStep].content}
              </p>
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  {currentStep === 3 ? 'Try Demo' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Demo Interface */
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sample Transactions */}
              <div className="bg-surface rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-textPrimary">Sample Transaction Processing</h3>
                <p className="text-textSecondary mb-6">
                  Watch how different transactions are categorized using various methods:
                </p>
                <div className="space-y-3">
                  {sampleTransactions.map((transaction, index) => (
                    <div key={index} className="border border-borderNeutral rounded-lg p-4 bg-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-textPrimary">{transaction.description}</span>
                        <span className={`font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-primary font-medium">{transaction.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.method === 'Historical Match' ? 'bg-blue-500/20 text-blue-400' :
                          transaction.method === 'Industry Rule' ? 'bg-green-500/20 text-green-400' :
                          transaction.method === 'Book History' ? 'bg-purple-500/20 text-purple-400' :
                          transaction.method === 'AI Analysis' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {transaction.method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onStartDemo}
                  className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  Start Processing Real Data
                </button>
              </div>

              {/* How It Works */}
              <div className="bg-surface rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-textPrimary">How Categorization Works</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-textPrimary">1. Historical Data Matching</h4>
                    <p className="text-sm text-textSecondary">
                      First, we check your uploaded training transactions for exact or similar matches based on description and vendor patterns.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-textPrimary">2. Industry Rules</h4>
                    <p className="text-sm text-textSecondary">
                      If no historical match, we apply industry-specific rules based on your business type and common accounting practices.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-textPrimary">3. Global Accounting Rules</h4>
                    <p className="text-sm text-textSecondary">
                      Standard accounting principles are applied for common transaction types like utilities, insurance, and office supplies.
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-textPrimary">4. AI Analysis (Optional)</h4>
                    <p className="text-sm text-textSecondary">
                      When enabled, Google Gemini AI analyzes the transaction context, description, and amount patterns for intelligent categorization.
                    </p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                  <h4 className="font-semibold text-textPrimary mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-textSecondary">
                    The more training data you upload, the smarter the system becomes. Start with your most common transactions to build a strong foundation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMode;