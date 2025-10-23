import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { testWebhook, saveMockData, type Webhook } from "../api";
// @ts-ignore - Type compatibility issue with React 18
import CodeEditor from "@uiw/react-textarea-code-editor";

interface WebhookTestProps {
  webhook: Webhook;
}

function WebhookTest({ webhook }: WebhookTestProps) {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(webhook.mockData, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const queryClient = useQueryClient();

  const testMutation = useMutation({
    mutationFn: async (mockData: any) => {
      const result = await testWebhook(webhook.name, mockData);
      return result;
    },
    onSuccess: (data) => {
      setTestResult({
        success: data.success,
        message: data.success ? "Test successful!" : "Test failed",
        status: data.status,
        responseTime: data.responseTime,
        data: data.data,
        error: data.error,
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      setTestResult({
        success: false,
        message: "Test failed",
        error: error.message,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (mockData: any) => {
      await saveMockData(webhook.name, mockData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setJsonError(null);
    setTestResult(null);
  };

  const validateAndParse = (): any | null => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError(
        error instanceof Error ? error.message : "Invalid JSON"
      );
      return null;
    }
  };

  const handleTest = () => {
    const mockData = validateAndParse();
    if (mockData !== null) {
      testMutation.mutate(mockData);
    }
  };

  const handleSave = () => {
    const mockData = validateAndParse();
    if (mockData !== null) {
      saveMutation.mutate(mockData);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Mock Data (JSON)
        </label>
        <div className="border border-gray-700 rounded overflow-hidden">
          {/* @ts-ignore - Type compatibility issue with React 18 */}
          <CodeEditor
            value={jsonInput}
            language="json"
            placeholder="Enter JSON mock data"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleJsonChange(e.target.value)}
            padding={12}
            style={{
              fontSize: 13,
              backgroundColor: "#1a1a1a",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
              minHeight: "150px",
            }}
          />
        </div>
        {jsonError && (
          <p className="mt-2 text-sm text-red-400">
            JSON Error: {jsonError}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending || !!jsonError}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
        >
          {testMutation.isPending ? "Testing..." : "Send Test"}
        </button>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !!jsonError}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded text-sm ${
            testResult.success
              ? "bg-green-900/30 border border-green-800 text-green-300"
              : "bg-red-900/30 border border-red-800 text-red-300"
          }`}
        >
          <div className="font-medium mb-1">{testResult.message}</div>
          {testResult.status && (
            <div className="text-xs opacity-75 mb-1">
              Status: {testResult.status} | Time: {testResult.responseTime}ms
            </div>
          )}
          {testResult.error && (
            <div className="text-xs opacity-75">Error: {testResult.error}</div>
          )}
          {testResult.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium">
                Response Data
              </summary>
              <pre className="mt-2 text-xs overflow-x-auto bg-black/30 p-2 rounded">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default WebhookTest;

