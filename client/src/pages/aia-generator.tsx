import { useState } from "react";
import { Smartphone, Cog, Key, Edit, Puzzle, Settings, HelpCircle } from "lucide-react";
import { AiaForm } from "@/components/aia-form";
import { StatusPanel } from "@/components/status-panel";

export default function AiaGenerator() {
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessages, setStatusMessages] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: Date;
  }>>([]);

  const addStatusMessage = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date()
    };
    setStatusMessages(prev => [...prev, newMessage]);
    setShowStatus(true);
  };

  const clearStatus = () => {
    setStatusMessages([]);
    setShowStatus(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Smartphone className="text-primary-foreground w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MIT App Inventor AIA Generator</h1>
              <p className="text-sm text-gray-600">Create MIT App Inventor 2 compliant AIA files from your specifications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AiaForm 
          onStatusMessage={addStatusMessage}
          onClearStatus={clearStatus}
        />

        {showStatus && (
          <StatusPanel 
            messages={statusMessages} 
            onClear={clearStatus}
          />
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <HelpCircle className="text-blue-500 w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">API Setup:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Enable Custom Search API in Google Cloud Console</li>
                    <li>• Create a Custom Search Engine at cse.google.com</li>
                    <li>• Copy your API key and CSE ID</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">File Requirements:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Extensions must be .aix files</li>
                    <li>• Project names should be alphanumeric</li>
                    <li>• Generated files comply with MIT AI2 standards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 MIT App Inventor AIA Generator. Built for educational and development purposes.</p>
            <p className="mt-2">
              <a href="#" className="text-primary hover:underline">Documentation</a> • 
              <a href="#" className="text-primary hover:underline">MIT AI2 Specs</a> • 
              <a href="#" className="text-primary hover:underline">Support</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}