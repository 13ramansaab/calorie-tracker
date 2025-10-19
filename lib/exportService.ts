import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface MealLogItem {
  date: string;
  meal_type: string;
  food_name: string;
  portion_grams: number;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
}

export async function exportToCSV(userId: string, startDate: Date, endDate: Date): Promise<string | null> {
  try {
    const { data: meals, error } = await supabase
      .from('meal_logs')
      .select(`
        id,
        logged_at,
        meal_type,
        meal_log_items (
          food_name,
          portion_grams,
          calories,
          protein_grams,
          carbs_grams,
          fat_grams
        )
      `)
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: true });

    if (error || !meals) {
      console.error('Error fetching meals for export:', error);
      return null;
    }

    const rows: MealLogItem[] = [];

    meals.forEach((meal: any) => {
      const date = new Date(meal.logged_at).toLocaleDateString('en-US');
      const mealType = meal.meal_type;

      if (meal.meal_log_items && meal.meal_log_items.length > 0) {
        meal.meal_log_items.forEach((item: any) => {
          rows.push({
            date,
            meal_type: mealType,
            food_name: item.food_name,
            portion_grams: item.portion_grams,
            calories: item.calories,
            protein_grams: item.protein_grams,
            carbs_grams: item.carbs_grams,
            fat_grams: item.fat_grams,
          });
        });
      }
    });

    const headers = [
      'Date',
      'Meal Type',
      'Food Item',
      'Portion (g)',
      'Calories',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        [
          row.date,
          row.meal_type,
          `"${row.food_name.replace(/"/g, '""')}"`,
          row.portion_grams.toFixed(1),
          row.calories.toFixed(1),
          row.protein_grams.toFixed(1),
          row.carbs_grams.toFixed(1),
          row.fat_grams.toFixed(1),
        ].join(',')
      ),
    ].join('\n');

    const fileName = `nutrition_log_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Nutrition Log',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return fileUri;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return null;
  }
}

export async function generateWeeklyReportHTML(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<string> {
  const { data: meals } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', weekStart.toISOString())
    .lte('logged_at', endDate.toISOString());

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const totalCalories = meals?.reduce((sum, m) => sum + (m.total_calories || 0), 0) || 0;
  const avgCalories = Math.round(totalCalories / 7);
  const totalProtein = meals?.reduce((sum, m) => sum + (m.total_protein || 0), 0) || 0;
  const totalCarbs = meals?.reduce((sum, m) => sum + (m.total_carbs || 0), 0) || 0;
  const totalFat = meals?.reduce((sum, m) => sum + (m.total_fat || 0), 0) || 0;

  const weekStartStr = weekStart.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const weekEndStr = weekEnd.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Nutrition Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .macros {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .macros h2 {
      margin-top: 0;
      color: #1f2937;
      font-size: 20px;
    }
    .macro-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .macro-row:last-child {
      border-bottom: none;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Weekly Nutrition Report</h1>
    <p>${weekStartStr} - ${weekEndStr}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${totalCalories.toLocaleString()}</div>
      <div class="stat-label">Total Calories</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${avgCalories}</div>
      <div class="stat-label">Avg Daily</div>
    </div>
  </div>

  <div class="macros">
    <h2>Macronutrient Breakdown</h2>
    <div class="macro-row">
      <span><strong>Protein</strong></span>
      <span>${Math.round(totalProtein)}g</span>
    </div>
    <div class="macro-row">
      <span><strong>Carbohydrates</strong></span>
      <span>${Math.round(totalCarbs)}g</span>
    </div>
    <div class="macro-row">
      <span><strong>Fat</strong></span>
      <span>${Math.round(totalFat)}g</span>
    </div>
  </div>

  <div class="footer">
    <p>Generated by NutriTrack</p>
    <p>${new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}</p>
  </div>
</body>
</html>
  `.trim();
}

export async function exportToPDF(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<string | null> {
  try {
    const html = await generateWeeklyReportHTML(userId, weekStart, weekEnd);

    const fileName = `weekly_report_${weekStart.toISOString().split('T')[0]}.html`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Weekly Report',
      });
    }

    return fileUri;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return null;
  }
}

export async function createShareableLink(
  fileUri: string,
  expirationDays: number = 7
): Promise<string | null> {
  try {
    const fileName = fileUri.split('/').pop() || 'export';
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const base64 = Buffer.from(fileContent).toString('base64');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const { data, error } = await supabase.from('shared_files').insert({
      file_name: fileName,
      file_content: base64,
      expires_at: expiresAt.toISOString(),
    }).select().single();

    if (error || !data) {
      console.error('Error creating shareable link:', error);
      return null;
    }

    return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/shared/${data.id}`;
  } catch (error) {
    console.error('Error creating shareable link:', error);
    return null;
  }
}
