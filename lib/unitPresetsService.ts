import { supabase } from '@/lib/supabase';

export interface UnitPreset {
  id: string;
  food_item: string;
  unit_type: string;
  min_grams: number;
  max_grams: number;
  avg_grams: number;
  region: string | null;
  category: string | null;
  notes: string | null;
}

export interface PortionPreset {
  label: string;
  grams: number;
  icon?: string;
  range?: { min: number; max: number };
}

export async function getUnitPresets(
  foodItem: string,
  userRegion?: string
): Promise<UnitPreset[]> {
  try {
    let query = supabase
      .from('unit_presets')
      .select('*')
      .ilike('food_item', foodItem);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unit presets:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const sorted = data.sort((a, b) => {
      if (userRegion) {
        if (a.region === userRegion && b.region !== userRegion) return -1;
        if (a.region !== userRegion && b.region === userRegion) return 1;
      }

      if (a.region === 'All India' && b.region !== 'All India') return -1;
      if (a.region !== 'All India' && b.region === 'All India') return 1;

      return 0;
    });

    return sorted;
  } catch (error) {
    console.error('Error in getUnitPresets:', error);
    return [];
  }
}

export async function searchUnitPresets(
  searchTerm: string,
  limit: number = 10
): Promise<UnitPreset[]> {
  try {
    const { data, error } = await supabase
      .from('unit_presets')
      .select('*')
      .or(`food_item.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching unit presets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchUnitPresets:', error);
    return [];
  }
}

export function convertToPortionPresets(
  unitPresets: UnitPreset[]
): PortionPreset[] {
  const presets: PortionPreset[] = [];

  const sizeLabels: Record<string, string> = {
    small_bowl: 'Small',
    medium_bowl: 'Medium',
    large_bowl: 'Large',
    piece: 'Per Piece',
    katori: 'Katori',
    bowl: 'Bowl',
    plate: 'Plate',
    cup: 'Cup',
    glass: 'Glass',
    cube: 'Cube',
  };

  const sizeIcons: Record<string, string> = {
    small_bowl: '🥄',
    medium_bowl: '🥣',
    large_bowl: '🍲',
    piece: '🍞',
    katori: '🥘',
    bowl: '🍜',
    plate: '🍽️',
    cup: '☕',
    glass: '🥤',
    cube: '◻️',
  };

  for (const preset of unitPresets) {
    const label = sizeLabels[preset.unit_type] || preset.unit_type;
    const icon = sizeIcons[preset.unit_type];

    presets.push({
      label,
      grams: preset.avg_grams,
      icon,
      range: {
        min: preset.min_grams,
        max: preset.max_grams,
      },
    });
  }

  if (presets.length === 0) {
    presets.push(
      { label: 'Small', grams: 50, icon: '🥄' },
      { label: 'Medium', grams: 100, icon: '🥣' },
      { label: 'Large', grams: 200, icon: '🍲' }
    );
  }

  return presets;
}

export async function findCanonicalName(
  searchTerm: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('find_canonical_name', {
      search_term: searchTerm,
    });

    if (error) {
      console.error('Error finding canonical name:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].canonical_name;
    }

    return null;
  } catch (error) {
    console.error('Error in findCanonicalName:', error);
    return null;
  }
}

export async function getPresetsForFood(
  foodName: string,
  userRegion?: string
): Promise<PortionPreset[]> {
  try {
    let searchName = foodName.toLowerCase().trim();

    const canonical = await findCanonicalName(searchName);
    if (canonical) {
      searchName = canonical;
    }

    const unitPresets = await getUnitPresets(searchName, userRegion);

    if (unitPresets.length > 0) {
      return convertToPortionPresets(unitPresets);
    }

    const searchResults = await searchUnitPresets(searchName, 5);
    if (searchResults.length > 0) {
      return convertToPortionPresets(searchResults);
    }

    return getDefaultPresets();
  } catch (error) {
    console.error('Error in getPresetsForFood:', error);
    return getDefaultPresets();
  }
}

function getDefaultPresets(): PortionPreset[] {
  return [
    { label: 'Small', grams: 50, icon: '🥄' },
    { label: 'Medium', grams: 100, icon: '🥣' },
    { label: 'Large', grams: 200, icon: '🍲' },
  ];
}

export async function getAllCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('unit_presets')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = new Set(data.map((row) => row.category).filter(Boolean));
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return [];
  }
}

export async function getPresetsByCategory(
  category: string
): Promise<UnitPreset[]> {
  try {
    const { data, error } = await supabase
      .from('unit_presets')
      .select('*')
      .eq('category', category)
      .order('food_item');

    if (error) {
      console.error('Error fetching presets by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPresetsByCategory:', error);
    return [];
  }
}
