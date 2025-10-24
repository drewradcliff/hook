import { useState } from "react";
import EventList from "./components/EventList";
import EventDetail from "./components/EventDetail";
import WebhookList from "./components/WebhookList";

function App() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">hook</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitor, inspect, and replay webhook events
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-6">
              <EventList
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
              />
              <WebhookList />
            </div>
            <div>
              {selectedEventId ? (
                <EventDetail
                  eventId={selectedEventId}
                  onClose={() => setSelectedEventId(null)}
                />
              ) : (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                  <p className="text-gray-500">Select an event to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
