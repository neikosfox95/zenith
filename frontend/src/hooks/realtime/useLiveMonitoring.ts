import { useState, useEffect } from 'react';

export interface LiveEvent {
  id: string;
  type: 'gift' | 'comment' | 'like' | 'share' | 'follow';
  username: string;
  text?: string;
  value?: number;
  timestamp: number;
}

export interface LiveCreator {
  username: string;
  viewer_count: number;
  is_live: boolean;
}

export function useLiveMonitoring() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [liveCreators, setLiveCreators] = useState<LiveCreator[]>([]);

  useEffect(() => {
    // Mock data for now - will be replaced with real Socket.IO integration
    const mockEvents: LiveEvent[] = [
      {
        id: '1',
        type: 'gift',
        username: 'user123',
        text: 'Sent a Rose',
        value: 100,
        timestamp: Date.now() - 5000,
      },
      {
        id: '2',
        type: 'comment',
        username: 'user456',
        text: 'Great stream!',
        timestamp: Date.now() - 10000,
      },
      {
        id: '3',
        type: 'like',
        username: 'user789',
        timestamp: Date.now() - 15000,
      },
      {
        id: '4',
        type: 'follow',
        username: 'user101',
        timestamp: Date.now() - 20000,
      },
      {
        id: '5',
        type: 'gift',
        username: 'user202',
        text: 'Sent a Diamond',
        value: 500,
        timestamp: Date.now() - 25000,
      },
    ];

    setEvents(mockEvents);

    setLiveCreators([
      { username: 'creator1', viewer_count: 5234, is_live: true },
      { username: 'creator2', viewer_count: 3421, is_live: true },
      { username: 'creator3', viewer_count: 1892, is_live: true },
    ]);
  }, []);

  return { events, liveCreators };
}
