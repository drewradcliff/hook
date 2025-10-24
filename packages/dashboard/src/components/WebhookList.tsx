import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWebhooks, scanWebhooks } from "../api";
import WebhookTest from "./WebhookTest";

function WebhookList() {
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["webhooks"],
    queryFn: fetchWebhooks,
  });

  const scanMutation = useMutation({
    mutationFn: scanWebhooks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const handleRefresh = () => {
    scanMutation.mutate();
  };

  const toggleWebhook = (name: string) => {
    setExpandedWebhook(expandedWebhook === name ? null : name);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Webhooks</h2>
        </div>
        <p className="text-gray-500 text-sm">Loading webhooks...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Webhooks</h2>
        </div>
        <p className="text-red-400 text-sm">Error: {error?.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <button
            onClick={handleRefresh}
            disabled={scanMutation.isPending}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
          >
            {scanMutation.isPending ? "Scanning..." : "Refresh"}
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-2">No webhooks detected</p>
        <p className="text-gray-600 text-xs">
          Make sure your webhooks directory is configured correctly
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-gray-500 mt-1">{data.length} detected</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={scanMutation.isPending}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
        >
          {scanMutation.isPending ? "Scanning..." : "Refresh"}
        </button>
      </div>

      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {data.map((webhook) => (
          <div
            key={webhook.name}
            className="border-b border-gray-800 last:border-b-0"
          >
            <button
              onClick={() => toggleWebhook(webhook.name)}
              className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white mb-1">
                    {webhook.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {webhook.path}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${
                    expandedWebhook === webhook.name ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {expandedWebhook === webhook.name && (
              <div className="px-6 pb-4">
                <WebhookTest webhook={webhook} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WebhookList;

