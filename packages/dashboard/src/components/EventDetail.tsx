import { useState } from "react";
import { fetchEvent, replayEvent } from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";

interface EventDetailProps {
  eventId: number;
  onClose: () => void;
}

function EventDetail({ eventId, onClose }: EventDetailProps) {
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId),
  });

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const result = await replayEvent(eventId);
      return result;
    },
    onSuccess: (result) => {
      setReplayResult({
        success: result.success,
        message: result.success
          ? `Replayed successfully`
          : `Failed: ${result.error}`,
      });
    },
    onError: (error) => {
      setReplayResult({
        success: false,
        message: `Failed: ${error.message}`,
      });
    },
    onSettled: () => {
      setReplaying(false);
    },
  });

  const handleReplay = async () => {
    setReplaying(true);
    await mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900 rounded-lg border border-red-900 p-8">
        <p className="text-red-400">Error: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden sticky top-6">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Event #{data.id}</h2>
          <p className="text-sm text-gray-500 mt-1">{data.webhookName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
            Status
          </h3>
          <div className="flex items-center gap-3">
            <StatusBadge status={data.status} />
            {data.responseTime && (
              <span className="text-sm text-gray-500">
                {data.responseTime}ms
              </span>
            )}
          </div>
          {data.error && (
            <p className="mt-2 text-sm text-red-400">{data.error}</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
            Request
          </h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Method:</span>{" "}
              <span className="font-mono text-blue-400">{data.method}</span>
            </div>
            <div>
              <span className="text-gray-500">Path:</span>{" "}
              <span className="font-mono text-gray-300">{data.path}</span>
            </div>
            <div>
              <span className="text-gray-500">Timestamp:</span>{" "}
              <span className="text-gray-300">
                {new Date(data.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
            Headers
          </h3>
          <pre className="bg-gray-950 rounded p-4 text-xs font-mono overflow-x-auto border border-gray-800">
            {JSON.stringify(data.headers, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
            Body
          </h3>
          <pre className="bg-gray-950 rounded p-4 text-xs font-mono overflow-x-auto border border-gray-800">
            {JSON.stringify(data.body, null, 2)}
          </pre>
        </div>

        {replayResult && (
          <div
            className={`p-4 rounded border ${
              replayResult.success
                ? "bg-green-900/20 border-green-800 text-green-400"
                : "bg-red-900/20 border-red-800 text-red-400"
            }`}
          >
            {replayResult.message}
          </div>
        )}

        <button
          onClick={handleReplay}
          disabled={replaying}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-medium text-white transition-colors"
        >
          {replaying ? "Replaying..." : "🔄 Replay Event"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    received: "bg-gray-700 text-gray-300",
    success: "bg-green-900/30 text-green-400",
    failed: "bg-red-900/30 text-red-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded text-sm font-medium ${
        colors[status as keyof typeof colors] || colors.received
      }`}
    >
      {status}
    </span>
  );
}

export default EventDetail;
