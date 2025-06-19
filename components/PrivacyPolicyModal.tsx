import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl border border-slate-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Privacy Policy & Data Processing</h2>
          <p className="text-blue-100 text-sm mt-1">Please review how we handle your data</p>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            
            {/* Data Processing Flow Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Processing Flow
              </h3>
              <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                    <div>
                      <h4 className="font-semibold text-cyan-300">Local File Upload</h4>
                      <p className="text-slate-300 text-sm">Your Ledger statement file is processed entirely in your browser. No file is uploaded to our servers.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                    <div>
                      <h4 className="font-semibold text-cyan-300">Your API Key</h4>
                      <p className="text-slate-300 text-sm">You provide your own Google Gemini API key, which is stored locally in your browser only.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                    <div>
                      <h4 className="font-semibold text-cyan-300">Direct Google Search Processing</h4>
                      <p className="text-slate-300 text-sm">Specific text content (only, if keyword is not found in historical data) is sent directly from your browser to Google Gemini AI using your API key.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
                    <div>
                      <h4 className="font-semibold text-cyan-300">Local Results</h4>
                      <p className="text-slate-300 text-sm">Generated Categorisation data is displayed in your browser and never stored on our servers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What We Collect */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">What We Don't Collect</h3>
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <ul className="text-slate-300 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Your Ledger statement files or data
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Your API keys or credentials
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Your configuration data or any financial information and logic
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Personal identification information like names, addresses, or contact details from any files
                  </li>
                </ul>
              </div>
            </div>            {/* Your Rights */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">Your Rights & Control</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <ul className="text-slate-300 space-y-2">
                  <li>• Your data stays on your device and is never uploaded to our servers</li>
                  <li>• You can clear all local data by clearing your browser's local storage</li>
                  <li>• You can stop using the service at any time</li>
                  <li>• You control your own API keys and can revoke them anytime</li>
                </ul>
              </div>
            </div>

            {/* Third Party Services */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">Third-Party Services</h3>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-slate-300">
                  This application uses <strong>Google Gemini Search API</strong> through your own API key. 
                  Your data processing by Google is subject to Google's Privacy Policy and Terms of Service. 
                  We recommend reviewing Google's policies regarding Search data processing.
                </p>
              </div>
            </div>

            {/* Security */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">Security</h3>
              <div className="text-slate-300">
                <p>
                  All processing happens locally in your browser or directly between your browser and Google's servers. 
                  We use HTTPS encryption and follow security best practices. However, please ensure you're using 
                  this service on a secure, trusted device.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-3">Questions?</h3>
              <p className="text-slate-300">
                If you have questions about this privacy policy or data processing, 
                please contact us through our GitHub repository or email provided on top of the application bar.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer with buttons */}
        <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400 text-center sm:text-left">
              By continuing, you acknowledge that you understand how your data is processed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDecline}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
