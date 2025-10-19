import { fetchEvents } from "../api";
import { useQuery } from "@tanstack/react-query";

interface EventListProps {
  selectedEventId: number | null;
  onSelectEvent: (id: number) => void;
}

function EventList({ selectedEventId, onSelectEvent }: EventListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents({ limit: 100 }),
  });

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <p className="text-gray-500">Loading events...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900 rounded-lg border border-red-900 p-8 text-center">
        <p className="text-red-400">Error: {error?.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <p className="text-gray-500 mb-2">No events yet</p>
        <p className="text-gray-600 text-sm">
          Webhook events will appear here when they're received
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Recent Events</h2>
        <p className="text-sm text-gray-500 mt-1">{data.length} total</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Webhook</th>
              <th className="px-6 py-3 text-left">Method</th>
              <th className="px-6 py-3 text-left">Path</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Time</th>
              <th className="px-6 py-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((event) => (
              <tr
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className={`cursor-pointer hover:bg-gray-800/50 transition-colors ${
                  selectedEventId === event.id ? "bg-gray-800/70" : ""
                }`}
              >
                <td className="px-6 py-4 text-sm font-mono text-gray-400">
                  #{event.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {event.webhookName}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-mono">
                    {event.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-400">
                  {event.path}
                </td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={event.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {event.responseTime ? `${event.responseTime}ms` : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      className={`px-2 py-1 rounded text-xs font-medium ${
        colors[status as keyof typeof colors] || colors.received
      }`}
    >
      {status}
    </span>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleString();
}

export default EventList;
