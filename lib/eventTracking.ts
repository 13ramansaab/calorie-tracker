import { supabase } from '@/lib/supabase';

export interface AppEvent {
  user_id: string;
  event_name: string;
  event_data?: Record<string, any>;
  timestamp: string;
}

const events: AppEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL = 5000;
const MAX_BATCH_SIZE = 50;

export async function trackEvent(
  userId: string,
  eventName: string,
  metadata?: Record<string, any>
): Promise<void> {
  const event: AppEvent = {
    user_id: userId,
    event_name: eventName,
    event_data: metadata,
    timestamp: new Date().toISOString(),
  };

  events.push(event);

  console.log(`[Event] ${eventName}`, metadata || {});

  if (events.length >= MAX_BATCH_SIZE) {
    await flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushEvents();
    }, FLUSH_INTERVAL);
  }
}

async function flushEvents(): Promise<void> {
  if (events.length === 0) return;

  const eventsToFlush = events.splice(0, events.length);

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    const { error } = await supabase.from('app_events').insert(eventsToFlush);

    if (error) {
      console.error('Error flushing events:', error);
      events.push(...eventsToFlush);
    } else {
      console.log(`Flushed ${eventsToFlush.length} events`);
    }
  } catch (error) {
    console.error('Error flushing events:', error);
    events.push(...eventsToFlush);
  }
}

export async function trackMealSaved(userId: string, mealId: string, source: string): Promise<void> {
  await trackEvent(userId, 'meal_saved', { meal_id: mealId, source });
}

export async function trackAIStarted(userId: string, type: 'photo' | 'chat'): Promise<void> {
  await trackEvent(userId, 'ai_started', { type });
}

export async function trackAICompleted(
  userId: string,
  type: 'photo' | 'chat',
  durationMs: number
): Promise<void> {
  await trackEvent(userId, 'ai_completed', { type, duration_ms: durationMs });
}

export async function trackAIFailed(
  userId: string,
  type: 'photo' | 'chat',
  error: string
): Promise<void> {
  await trackEvent(userId, 'ai_failed', { type, error });
}

export async function trackPaywallImpression(userId: string, feature: string): Promise<void> {
  await trackEvent(userId, 'paywall_impression', { feature });
}

export async function trackPaywallConversion(
  userId: string,
  plan: string,
  isTrial: boolean
): Promise<void> {
  await trackEvent(userId, 'paywall_conversion', { plan, is_trial: isTrial });
}

export async function getEventFunnel(
  timeRangeHours: number = 24
): Promise<{
  meal_saved: number;
  ai_started: number;
  ai_completed: number;
  ai_failed: number;
  paywall_impression: number;
  paywall_conversion: number;
}> {
  const since = new Date();
  since.setHours(since.getHours() - timeRangeHours);

  const { data, error } = await supabase
    .from('app_events')
    .select('event_name')
    .gte('timestamp', since.toISOString());

  if (error || !data) {
    console.error('Error fetching event funnel:', error);
    return {
      meal_saved: 0,
      ai_started: 0,
      ai_completed: 0,
      ai_failed: 0,
      paywall_impression: 0,
      paywall_conversion: 0,
    };
  }

  const counts = data.reduce(
    (acc, event) => {
      if (event.event_name in acc) {
        acc[event.event_name as keyof typeof acc]++;
      }
      return acc;
    },
    {
      meal_saved: 0,
      ai_started: 0,
      ai_completed: 0,
      ai_failed: 0,
      paywall_impression: 0,
      paywall_conversion: 0,
    }
  );

  return counts;
}

export async function getAIFailureRate(timeRangeMinutes: number = 15): Promise<number> {
  const since = new Date();
  since.setMinutes(since.getMinutes() - timeRangeMinutes);

  const { data, error } = await supabase
    .from('app_events')
    .select('event_name')
    .in('event_name', ['ai_started', 'ai_completed', 'ai_failed'])
    .gte('timestamp', since.toISOString());

  if (error || !data || data.length === 0) {
    return 0;
  }

  const started = data.filter((e) => e.event_name === 'ai_started').length;
  const failed = data.filter((e) => e.event_name === 'ai_failed').length;

  if (started === 0) return 0;

  return (failed / started) * 100;
}
