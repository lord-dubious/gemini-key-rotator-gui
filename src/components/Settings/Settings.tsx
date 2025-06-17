import { useState, useEffect } from 'react';
import { Save, TestTube, AlertCircle, CheckCircle, Eye, EyeOff, Monitor } from 'lucide-react';
import { apiService } from '@/services/api';
import { cn, validateUrl } from '@/utils';

interface SettingsProps {
  onSave: () => void;
  onNotification: (type: 'success' | 'error', title: string, message: string) => void;
}

export function Settings({ onSave, onNotification }: SettingsProps) {
  const [config, setConfig] = useState({
    endpoint: '',
    accessToken: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<'success' | 'error' | 'pending' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current configuration
  useEffect(() => {
    const currentConfig = apiService.getConfig();
    setConfig({
      endpoint: currentConfig.endpoint,
      accessToken: currentConfig.accessToken,
    });
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.endpoint.trim()) {
      newErrors.endpoint = 'API endpoint is required';
    } else if (!validateUrl(config.endpoint)) {
      newErrors.endpoint = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Update API service configuration
      apiService.updateConfig(config.endpoint, config.accessToken);

      // Test the connection
      const isConnected = await apiService.testConnection();

      if (!isConnected) {
        onNotification('error', 'Connection Failed', 'Settings saved but unable to connect to the API endpoint');
        return;
      }
      
      onNotification('success', 'Settings Saved', 'Configuration updated successfully');
      onSave();
    } catch (error) {
      onNotification('error', 'Save Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Temporarily update config for testing
      apiService.updateConfig(config.endpoint, config.accessToken);
      const isConnected = await apiService.testConnection();
      
      setTestResult(isConnected ? 'success' : 'error');
      
      if (isConnected) {
        onNotification('success', 'Connection Test', 'Successfully connected to the API endpoint');
      } else {
        onNotification('error', 'Connection Test', 'Failed to connect to the API endpoint');
      }
    } catch (error) {
      setTestResult('error');
      onNotification('error', 'Connection Test', error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestGemini = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    setGeminiTestResult('pending');
    try {
      // Temporarily update config for testing
      apiService.updateConfig(config.endpoint, config.accessToken);

      const response = await apiService.testGeminiRequest('Test message from GUI');
      setGeminiTestResult('success');
      onNotification('success', 'Gemini Test', 'Successfully tested Gemini API through rotator');
      console.log('Gemini test response:', response);
    } catch (error) {
      setGeminiTestResult('error');
      onNotification('error', 'Gemini Test', error instanceof Error ? error.message : 'Gemini test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your API endpoint and access credentials
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <>
            {/* API Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Endpoint URL
              </label>
              <input
                type="url"
                value={config.endpoint}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://your-project.deno.dev"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg",
                  "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                  "placeholder-gray-500 dark:placeholder-gray-400",
                  errors.endpoint
                    ? "border-error-300 dark:border-error-600 focus:ring-error-500 focus:border-error-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500",
                  "focus:outline-none focus:ring-2"
                )}
              />
              {errors.endpoint && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                  {errors.endpoint}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The URL of your deployed Deno Edge Function
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Token (Optional)
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={config.accessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="Enter your access token"
                  className={cn(
                    "w-full px-3 py-2 pr-10 border rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                    "placeholder-gray-500 dark:placeholder-gray-400",
                    "border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500",
                    "focus:outline-none focus:ring-2"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Required if your edge function has ACCESS_TOKEN protection enabled
              </p>
            </div>
          </>
        )}

        {/* Test Connection */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Connection Test
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Test your API endpoint configuration
              </p>
            </div>
            
            {testResult && (
              <div className="flex items-center space-x-2">
                {testResult === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-success-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-error-500" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  testResult === 'success' ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"
                )}>
                  {testResult === 'success' ? 'Connected' : 'Failed'}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary-600 hover:bg-primary-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <TestTube className="h-4 w-4" />
              <span>{isTesting ? 'Testing...' : 'Test Health'}</span>
            </button>

            <button
              onClick={handleTestGemini}
              disabled={isTesting}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-success-600 hover:bg-success-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <TestTube className="h-4 w-4" />
              <span>{isTesting ? 'Testing...' : 'Test Gemini'}</span>
            </button>
          </div>

          {/* Gemini Test Result */}
          {geminiTestResult && (
            <div className="mt-3 flex items-center space-x-2">
              {geminiTestResult === 'pending' && (
                <span className="text-sm text-gray-600 dark:text-gray-400">Testing Gemini...</span>
              )}
              {geminiTestResult === 'success' && (
                <>
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span className="text-sm text-success-600 dark:text-success-400">Gemini test succeeded</span>
                </>
              )}
              {geminiTestResult === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-error-500" />
                  <span className="text-sm text-error-600 dark:text-error-400">Gemini test failed</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors",
              "bg-primary-600 hover:bg-primary-700 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
