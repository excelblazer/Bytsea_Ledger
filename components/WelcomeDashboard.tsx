import React, { useState, useEffect } from 'react';
import { UploadIcon, PlusIcon, ChartBarIcon, DocumentTextIcon, CogIcon, BookOpenIcon } from './icons';
import * as dataService from '../services/dataService';

interface DashboardMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'client' | 'book' | 'industry' | 'training' | 'processing';
  description: string;
  timestamp: Date;
}

interface WelcomeDashboardProps {
  onUploadFile?: () => void;
  onAddClient?: () => void;
  onOpenSettings?: () => void;
  onStartDemo?: () => void;
  onStartRealData?: () => void;
}

const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  onUploadFile,
  onAddClient,
  onOpenSettings,
  onStartDemo,
  onStartRealData
}) => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setIsLoading(true);

    // Load basic data
    const clients = dataService.getClients();
    const books = dataService.getBooks();
    const industries = dataService.getIndustries();

    // Calculate training data count
    let totalTrainingTransactions = 0;
    clients.forEach(client => {
      const clientBooks = books.filter(b => b.clientId === client.id);
      clientBooks.forEach(book => {
        const transactions = dataService.getTrainingTransactions(client.id, book.id);
        totalTrainingTransactions += transactions.length;
      });
    });

    // Create metrics
    const dashboardMetrics: DashboardMetric[] = [
      {
        label: 'Clients',
        value: clients.length,
        icon: <ChartBarIcon className="w-6 h-6" />,
        color: 'text-blue-400'
      },
      {
        label: 'Books',
        value: books.length,
        icon: <DocumentTextIcon className="w-6 h-6" />,
        color: 'text-green-400'
      },
      {
        label: 'Industries',
        value: industries.length,
        icon: <CogIcon className="w-6 h-6" />,
        color: 'text-purple-400'
      },
      {
        label: 'Training Transactions',
        value: totalTrainingTransactions,
        icon: <UploadIcon className="w-6 h-6" />,
        color: 'text-orange-400'
      }
    ];

    setMetrics(dashboardMetrics);

    // Generate recent activity (mock data for now - in real implementation, this would come from a log)
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'client',
        description: 'Added new client "ABC Corp"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        type: 'training',
        description: 'Processed 150 training transactions for "Main Book"',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        id: '3',
        type: 'book',
        description: 'Created new book "Q4 2024" for "XYZ Ltd"',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    setRecentActivity(activities);
    setIsLoading(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'client':
        return <ChartBarIcon className="w-4 h-4 text-blue-400" />;
      case 'book':
        return <DocumentTextIcon className="w-4 h-4 text-green-400" />;
      case 'industry':
        return <CogIcon className="w-4 h-4 text-purple-400" />;
      case 'training':
      case 'processing':
        return <UploadIcon className="w-4 h-4 text-orange-400" />;
      default:
        return <DocumentTextIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-textSecondary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Clear Choice */}
      <div className="text-center bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
        <h1 className="text-4xl font-bold text-textPrimary mb-4">
          Welcome to <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Bytsea Ledger</span>
        </h1>
        <p className="text-xl text-textSecondary mb-8 max-w-3xl mx-auto">
          Transform your bookkeeping with AI-powered transaction categorization. Choose your path to get started:
        </p>
        
        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={onStartDemo}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <BookOpenIcon className="w-12 h-12 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Explore Demo Mode</h3>
              <p className="text-blue-100 mb-4">
                Experience our AI categorization system with sample transactions. Learn how it works without any setup.
              </p>
              <div className="text-sm text-blue-200">
                ✓ Interactive walkthrough<br/>
                ✓ See categorization methods<br/>
                ✓ No data required
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={onStartRealData}
            className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white p-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <UploadIcon className="w-12 h-12 text-green-200" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Process Your Data</h3>
              <p className="text-green-100 mb-4">
                Upload your actual financial files and let AI categorize your transactions intelligently.
              </p>
              <div className="text-sm text-green-200">
                ✓ Upload CSV/Excel files<br/>
                ✓ AI + Rules categorization<br/>
                ✓ Review and export results
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onUploadFile}
          className="flex items-center justify-center p-6 bg-primary hover:bg-primary-dark rounded-xl shadow-lg transition-colors"
        >
          <UploadIcon className="w-8 h-8 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Upload File</div>
            <div className="text-sm opacity-75">Process transactions</div>
          </div>
        </button>

        <button
          onClick={onAddClient}
          className="flex items-center justify-center p-6 bg-slate-700 hover:bg-slate-600 rounded-xl shadow-lg transition-colors"
        >
          <PlusIcon className="w-8 h-8 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Add Client</div>
            <div className="text-sm opacity-75">Create new client</div>
          </div>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center p-6 bg-slate-700 hover:bg-slate-600 rounded-xl shadow-lg transition-colors"
        >
          <CogIcon className="w-8 h-8 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Settings</div>
            <div className="text-sm opacity-75">Configure app</div>
          </div>
        </button>
      </div>

      {/* Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-textPrimary">{metric.value}</div>
                  <div className="text-sm text-textSecondary">{metric.label}</div>
                </div>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Recent Activity</h2>
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-textSecondary">
              No recent activity. Start by uploading a file or adding a client!
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="text-textPrimary">{activity.description}</div>
                    <div className="text-sm text-textSecondary">{formatTimestamp(activity.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Tips */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Getting Started</h2>
        <div className="space-y-3 text-textSecondary">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-semibold mt-0.5">1</div>
            <div>Set up your Google Gemini API key in Settings</div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-semibold mt-0.5">2</div>
            <div>Create a client and book for your transactions</div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-semibold mt-0.5">3</div>
            <div>Upload a CSV or Excel file to start processing</div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-semibold mt-0.5">4</div>
            <div>Review and override AI categorizations as needed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;