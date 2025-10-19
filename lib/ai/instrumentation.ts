import { supabase } from '@/lib/supabase';
import { AnalysisEvent } from '@/types/ai';

export async function logAnalysisEvent(
  eventType: AnalysisEvent['eventType'],
  eventData: Record<string, any> = {}
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('log_analysis_event', {
      p_event_type: eventType,
      p_event_data: eventData,
    });

    if (error) {
      console.error('Failed to log event:', error);
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

export function logNoteEntered(noteLength: number, mealType: string): void {
  logAnalysisEvent('note_entered', {
    note_length: noteLength,
    meal_type: mealType,
    timestamp: new Date().toISOString(),
  });
}

export function logNoteUsedInAnalysis(
  analysisId: string,
  itemsInfluenced: number,
  influenceTypes: string[]
): void {
  logAnalysisEvent('note_used_in_analysis', {
    analysis_id: analysisId,
    items_influenced: itemsInfluenced,
    influence_types: influenceTypes,
    timestamp: new Date().toISOString(),
  });
}

export function logNoteConflictShown(
  analysisId: string,
  conflicts: Array<{
    itemName: string;
    conflictType: string;
  }>
): void {
  logAnalysisEvent('note_conflict_shown', {
    analysis_id: analysisId,
    conflict_count: conflicts.length,
    conflicts,
    timestamp: new Date().toISOString(),
  });
}

export function logConflictChoiceSelected(
  analysisId: string,
  itemName: string,
  source: 'model' | 'note',
  conflictType: string
): void {
  logAnalysisEvent('conflict_choice_selected', {
    analysis_id: analysisId,
    item_name: itemName,
    selected_source: source,
    conflict_type: conflictType,
    timestamp: new Date().toISOString(),
  });
}

export async function getEventStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  noteEntered: number;
  noteUsed: number;
  conflictsShown: number;
  conflictsResolved: number;
}> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('event_type')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    const stats = {
      noteEntered: 0,
      noteUsed: 0,
      conflictsShown: 0,
      conflictsResolved: 0,
    };

    data?.forEach((event) => {
      if (event.event_type === 'note_entered') stats.noteEntered++;
      if (event.event_type === 'note_used_in_analysis') stats.noteUsed++;
      if (event.event_type === 'note_conflict_shown') stats.conflictsShown++;
      if (event.event_type === 'conflict_choice_selected') stats.conflictsResolved++;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return {
      noteEntered: 0,
      noteUsed: 0,
      conflictsShown: 0,
      conflictsResolved: 0,
    };
  }
}
