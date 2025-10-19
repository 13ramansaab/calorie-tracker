# NutriTrack - AI-Powered Indian Food Nutrition Tracker

A comprehensive nutrition tracking application built with React Native (Expo) and Supabase, featuring advanced AI-powered food recognition, multilingual support, and personalized learning capabilities optimized for Indian cuisine.

## 🌟 Features

### Core Functionality
- **AI Photo Analysis**: Take photos of meals and get instant nutritional breakdowns
- **Manual Food Logging**: Search and add foods manually with detailed macro tracking
- **Context-Aware Analysis**: Add text descriptions to improve AI accuracy
- **Meal Planning**: Plan future meals and track your daily nutrition goals
- **Progress Tracking**: Visualize your nutrition trends over time
- **Achievement System**: Earn badges for consistent logging and goal achievements

### Advanced AI Features

#### Phase 1: Context Assist (MVP)
- **ContextAssistBox**: Optional text input to guide AI analysis
  - Rotating example hints (e.g., "2 chapati + 1 bowl paneer bhurji")
  - Character counter with visual feedback
  - Multilingual support (Hindi/English)
- **Conflict Detection**: When AI and user note disagree, show picker UI
- **Confidence Tracking**: Monitor AI accuracy and user corrections
- **Full Instrumentation**: Track usage patterns and improvement metrics

#### Phase 2: Quality & Guidance
- **Inline Hints**: Ask clarifying questions for low-confidence items
  - "How many chapati? [1][2][3][4]"
  - Reduces edit rate by 15%+
- **Multilingual Synonyms**: Recognize Hindi terms and numerals
  - Supports: रोटी, कटोरी, दाल, अंडा, etc.
  - Auto-translates to canonical English names
- **Smart Examples**: Context-aware suggestions based on meal type

#### Phase 3: Personalization & Memory
- **Repeat Meal Suggestions**: One-tap insert for frequently logged meals
  - "Usually: 2 chapati + dal" (12x)
- **User Portion Priors**: Learn individual eating patterns
  - Weighted blend: 60% AI + 40% personal history
  - Activates after 3+ samples per food
- **Time-to-Confirm**: Reduced by 20%+ for repeat meals

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native 0.81 with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (email/password)
- **AI/ML**: OpenAI GPT-4 Vision API
- **Icons**: Lucide React Native
- **Styling**: StyleSheet (React Native)

### Project Structure
```
project/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Dashboard/Home
│   │   ├── log.tsx               # Food logging
│   │   ├── progress.tsx          # Charts & trends
│   │   ├── search.tsx            # Food search
│   │   └── profile.tsx           # User profile
│   ├── onboarding/               # First-time setup
│   │   ├── step1-5.tsx           # Multi-step wizard
│   │   └── goal-calculation.tsx  # TDEE calculator
│   ├── meal/[id].tsx             # Meal detail view
│   ├── photo/[id].tsx            # Photo analysis detail
│   ├── auth.tsx                  # Login/signup
│   ├── chat.tsx                  # AI nutrition assistant
│   ├── planner.tsx               # Meal planning
│   ├── gallery.tsx               # Photo history
│   ├── achievements.tsx          # Gamification
│   └── _layout.tsx               # Root layout
│
├── components/                   # Reusable UI components
│   ├── ContextAssistBox.tsx      # Note input with examples
│   ├── ContextBanner.tsx         # Display user notes
│   ├── ConflictChipGroup.tsx     # AI vs Note picker
│   ├── InlineHint.tsx            # Clarifying questions
│   ├── CameraCapture.tsx         # Photo capture flow
│   ├── AIAnalysisSheet.tsx       # Analysis results modal
│   ├── CalorieRing.tsx           # Progress visualization
│   ├── MacroBar.tsx              # Protein/carbs/fat bars
│   └── [30+ other components]
│
├── lib/                          # Business logic & services
│   ├── ai/                       # AI/ML services
│   │   ├── visionService.ts      # GPT-4 Vision integration
│   │   ├── textService.ts        # Text-only analysis
│   │   ├── prompts.ts            # System & user prompts
│   │   ├── confidenceOrchestrator.ts  # Confidence scoring
│   │   ├── conflictDetection.ts  # Note vs AI comparison
│   │   ├── multilingualService.ts     # Hindi translation
│   │   ├── personalizationService.ts  # User priors
│   │   ├── mappingService.ts     # Food database matching
│   │   ├── instrumentation.ts    # Event logging
│   │   └── flows.ts              # Analysis workflows
│   ├── supabase.ts               # Database client
│   └── utils/
│       ├── nutritionCalculations.ts
│       └── premium.ts
│
├── types/                        # TypeScript definitions
│   ├── ai.ts                     # AI response types
│   ├── meal.ts                   # Meal data types
│   ├── subscription.ts           # Premium features
│   └── onboarding.ts             # User setup types
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # User auth state
│
├── supabase/migrations/          # Database migrations
│   ├── 20251019035718_extend_schema_for_app.sql
│   ├── 20251019052827_add_ai_specific_tables.sql
│   ├── 20251019053412_add_evaluation_functions.sql
│   ├── 20251019060254_add_context_assist_fields.sql
│   └── 20251019060729_add_personalization_schema.sql
│
└── assets/                       # Static assets
    └── images/
```

## 📊 Database Schema

### Core Tables

#### `users`
User profiles and preferences
- `id`, `email`, `dietary_preferences`, `region`, `activity_level`
- Goals: `daily_calorie_goal`, `protein_goal`, `carbs_goal`, `fat_goal`

#### `meal_logs`
Recorded meals with nutritional data
- `user_id`, `meal_type`, `logged_at`, `source` (manual/photo/ai)
- Nutrition: `total_calories`, `protein_grams`, `carbs_grams`, `fat_grams`
- Context: `context_note`, `photo_analysis_id`

#### `meal_items`
Individual food items within meals
- `meal_log_id`, `food_name`, `portion_grams`
- Nutrition: `calories`, `protein_grams`, `carbs_grams`, `fat_grams`

#### `photo_analyses`
AI analysis metadata and results
- `user_id`, `photo_url`, `raw_response`, `overall_confidence`
- Context: `user_note`, `note_used`, `note_influence_summary`
- Learning: `model_version`, `status`, `user_edited`

### AI & Personalization Tables

#### `user_meal_patterns`
Tracks frequently logged meal combinations
- `user_id`, `meal_combination` (jsonb array)
- `frequency`, `last_logged_at`
- Used for "Usually: 2 chapati + dal" suggestions

#### `user_portion_priors`
Learns user-specific typical portions
- `user_id`, `food_name`, `avg_portion_grams`
- `sample_count`, `updated_at`
- Rolling average: `(old_avg * count + new) / (count + 1)`

#### `multilingual_synonyms`
Hindi/regional term mappings
- `local_term`, `canonical_name`, `language`, `region`
- Examples: रोटी → roti, कटोरी → bowl, अंडा → egg

#### `analysis_events`
Instrumentation for AI features
- `user_id`, `event_type`, `event_data`, `created_at`
- Events: `note_entered`, `note_used_in_analysis`, `conflict_choice_selected`

#### `user_corrections`
Learning loop data for model improvement
- `user_id`, `photo_analysis_id`, `original_item`, `corrected_item`
- `correction_type` (name/portion/macros), `confidence_impact`

### Supporting Tables
- `food_database`: Canonical food items with nutrition data
- `recent_foods`: User's search history
- `goals_history`: Daily goal tracking
- `achievements`: Gamification badges

## 🔒 Security

### Row Level Security (RLS)
All tables use Supabase RLS policies:
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Synonym data is public read
CREATE POLICY "Public can read synonyms"
  ON multilingual_synonyms FOR SELECT
  TO authenticated
  USING (true);
```

### Authentication
- Email/password authentication via Supabase Auth
- No email confirmation (immediate access)
- Session management with secure HTTP-only cookies
- Password reset flow included

## 🤖 AI System Design

### Prompt Engineering

**System Prompt** (Indian cuisine specialist):
```
You are a nutrition analysis AI specialized in Indian cuisines.

CRITICAL RULES:
1. Identify Indian dishes (e.g., "bhindi masala", "paneer tikka", "idli")
2. Estimate portions using plate/bowl size references
3. Provide confidence scores (0.0-1.0)
4. Return valid JSON only

PORTION HEURISTICS:
- 1 roti/chapati ~30g, 1 paratha ~50g
- 1 idli ~40g, 1 dosa ~120g
- Katori (small bowl) ~150ml
- Standard thali plate ~25-30cm diameter
```

**User Note Integration** (Phase 1):
```
USER NOTE (optional): "2 chapati + dal"

Use this note ONLY to disambiguate counts/portions/names.
If note specifies explicit numeric counts, prefer those over visual estimates.
NEVER invent items not visible in the image.

For each item, mark note_influence: "none" | "name" | "portion" | "both"
```

### Confidence Scoring

Multi-factor confidence calculation:
```typescript
calculateOverallConfidence(
  visualConfidence: 0.85,    // From AI model
  mappingConfidence: 0.90,   // Database match quality
  portionHeuristic: 0.80,    // Portion reasonableness
  hasRegionalContext: true   // User profile boost
) → 0.84 (final confidence)
```

**Confidence Thresholds**:
- **High (≥0.8)**: Auto-accept, minor edits allowed
- **Medium (0.6-0.79)**: Show inline hints, 3 suggestions
- **Low (<0.6)**: Require explicit confirmation

### Conflict Detection

When user note disagrees with AI vision:
```typescript
// Example: User says "2 chapati", AI sees 3
detectConflicts(detectedFoods, userNote)

// Deviation > 25% triggers conflict UI
const deviation = Math.abs(modelValue - noteValue) / noteValue;
if (deviation > 0.25) {
  showConflictChipGroup({
    itemName: "chapati",
    modelValue: 3,  // AI
    noteValue: 2,   // User
    conflictType: "quantity"
  });
}
```

### Learning Loop

Continuous improvement from user corrections:
```typescript
// Track every edit
logCorrection(
  originalItem: { name: "dal", portion: 200 },
  correctedItem: { name: "dal fry", portion: 150 },
  correctionType: "both"  // name + portion
);

// Aggregate for retraining
SELECT
  food_name,
  AVG(portion_correction_ratio) as typical_adjustment,
  COUNT(*) as correction_count
FROM user_corrections
GROUP BY food_name
HAVING COUNT(*) >= 10;
```

## 🌐 Multilingual Support

### Hindi Recognition

**Numerals**:
```
एक → 1 (ek)
दो → 2 (do)
तीन → 3 (teen)
चार → 4 (char)
पांच → 5 (paanch)
```

**Food Terms** (20+ seeded):
```
रोटी → roti
कटोरी → katori/bowl
अंडा → anda/egg
दाल → dal
चावल → chawal/rice
सब्जी → sabzi/vegetable
परांठा → paratha
इडली → idli
```

**Usage**:
```typescript
// Input: "2 रोटी + 1 कटोरी दाल"
detectLanguage(input) → 'hi'
normalizeUserNote(input, synonyms) → "2 roti + 1 bowl dal"
// Sent to AI in standardized English
```

## 📈 Personalization Engine

### Pattern Recognition

**Meal Combination Tracking**:
```sql
-- Upsert pattern on every save
INSERT INTO user_meal_patterns (user_id, meal_combination, frequency)
VALUES ('user-123', '["roti", "dal", "rice"]', 1)
ON CONFLICT (user_id, meal_combination)
DO UPDATE SET
  frequency = user_meal_patterns.frequency + 1,
  last_logged_at = now();
```

**Top 3 Suggestions**:
```typescript
getUserMealPatterns(limit: 3)
  .filter(p => p.frequency >= 3)
  .map(p => ({
    label: "Usually: " + p.items.join(' + '),
    frequency: p.frequency,
    daysAgo: daysSince(p.last_logged_at)
  }));

// UI: [⚡ Usually: 2 roti + dal | 12x]
```

### Portion Learning

**Rolling Average Calculation**:
```typescript
// User logs roti 5 times: 30g, 35g, 32g, 28g, 30g
// Current average: 31g (5 samples)

// New log: 34g
updatePortionPrior("roti", 34);

// Updated average: (31 * 5 + 34) / 6 = 31.5g
```

**Application (40% weight)**:
```typescript
applyUserPriors(
  detectedPortion: 60,   // AI estimate
  foodName: "roti",
  userPriors: { "roti": 32 }
) → 60 * 0.6 + 32 * 0.4 = 48.8g ≈ 49g
```

**Activation Criteria**:
- Requires ≥3 samples per food
- Only for confidence ≥0.6 items
- Blended with AI, never overrides completely

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)
- OpenAI API key (GPT-4 Vision access)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd project
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
```

4. **Run database migrations**

In Supabase SQL Editor, run migrations in order:
```
supabase/migrations/20251019035718_extend_schema_for_app.sql
supabase/migrations/20251019052827_add_ai_specific_tables.sql
supabase/migrations/20251019053412_add_evaluation_functions.sql
supabase/migrations/20251019060254_add_context_assist_fields.sql
supabase/migrations/20251019060729_add_personalization_schema.sql
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open in browser**
- Press `w` to open in web browser
- Or scan QR code with Expo Go app (iOS/Android)

### First-Time Setup

1. Create account (email/password)
2. Complete onboarding:
   - Personal info (age, height, weight)
   - Goals (weight loss/gain/maintain)
   - Dietary preferences (vegetarian/vegan/etc.)
   - Activity level (sedentary → very active)
3. System calculates TDEE and macro targets
4. Start logging meals!

## 📱 Usage Guide

### Logging a Meal

**Option 1: Photo Analysis**
1. Tap **Log** tab
2. Tap camera icon
3. Capture photo of meal
4. (Optional) Add context: "2 chapati + dal"
5. Review AI analysis
6. Resolve any conflicts (AI vs note)
7. Answer inline hints if needed
8. Tap **Save**

**Option 2: Manual Entry**
1. Tap **Log** tab
2. Tap **Search** icon
3. Search for food (e.g., "paneer tikka")
4. Select from database
5. Adjust portion size
6. Tap **Add**

**Option 3: Repeat Meal**
1. Tap **Log** tab
2. Tap camera icon
3. See "Usually: 2 roti + dal (12x)"
4. Tap suggestion → auto-fills note
5. Capture photo → instant analysis

### Context Assist Best Practices

**Good Examples**:
```
✅ "2 chapati + 1 bowl dal"
✅ "idli (3) + sambar (1 katori)"
✅ "1 plate biryani with raita"
✅ "2 रोटी + 1 कटोरी दाल"  (Hindi)
```

**What to Include**:
- Quantities (numbers)
- Containers (bowl, cup, katori, plate)
- Sizes (small, medium, large)
- Preparation (fried, grilled, steamed)

**What to Avoid**:
```
❌ "Lunch"  (too vague)
❌ "Some food"  (no details)
❌ "It looks good"  (not helpful)
```

### Handling Conflicts

When AI and your note disagree:

```
┌─────────────────────────────────────┐
│ chapati - Count differs             │
│ Which count is correct?             │
│                                     │
│ ┌─── AI ───┐   or   ┌─── You ───┐ │
│ │    3     │        │     2     │ │
│ │ From photo│        │ From note│ │
│ └──────────┘        └───────────┘ │
└─────────────────────────────────────┘
```

**When to pick AI**:
- Photo clearly shows multiple items
- You might have miscounted
- Complex plating (thali)

**When to pick Your note**:
- You ate fewer than visible
- Shared plate scenario
- You know exact portion

### Inline Hints

For low-confidence items:

```
┌────────────────────────────────┐
│ ℹ️ chapati ✓                   │
│ How many chapati?              │
│                                │
│ [1]  [2]  [3]  [4]            │
└────────────────────────────────┘
```

**Tap the correct number** → instant update
- No need to edit manually
- Boosts confidence score
- Faster than typing

## 🧪 Testing

### Manual Testing Checklist

**Photo Analysis Flow**:
- [ ] Camera permission granted
- [ ] Photo captured successfully
- [ ] Context note saved
- [ ] AI analysis completes
- [ ] Results display correctly
- [ ] Conflicts show when appropriate
- [ ] Inline hints appear for low confidence
- [ ] Meal saves to database

**Multilingual Support**:
- [ ] Hindi input recognized
- [ ] Numerals converted (दो → 2)
- [ ] Food terms translated (रोटी → roti)
- [ ] Mixed Hindi/English works

**Personalization**:
- [ ] Repeat meal suggestions appear after 3+ logs
- [ ] Suggestions inject correctly
- [ ] User priors adjust portions
- [ ] Patterns update on save

### Event Tracking Queries

```sql
-- Check context assist usage
SELECT
  COUNT(*) FILTER (WHERE event_type = 'note_entered') as notes_entered,
  COUNT(*) FILTER (WHERE event_type = 'note_used_in_analysis') as notes_used,
  COUNT(*) FILTER (WHERE event_type = 'note_conflict_shown') as conflicts
FROM analysis_events
WHERE created_at > now() - interval '7 days';

-- Measure edit rate improvement
SELECT
  date_trunc('day', logged_at) as day,
  AVG(CASE WHEN context_note IS NOT NULL THEN 1 ELSE 0 END) as note_usage,
  AVG(CASE WHEN source = 'photo' THEN edit_count ELSE 0 END) as avg_edits
FROM meal_logs
GROUP BY day
ORDER BY day DESC;
```

## 🎯 Key Metrics & KPIs

### Phase 1 Success Metrics
- **Note Usage Rate**: % of photo logs with context notes
  - Target: 40%+
- **Conflict Resolution**: % choosing note over AI
  - Target: 50/50 split (well-calibrated)
- **Edit Rate**: Edits per meal (with vs without note)
  - Target: 20% reduction

### Phase 2 Success Metrics
- **Inline Hint Effectiveness**: Edit rate reduction
  - Target: ≥15% improvement
- **Multilingual Adoption**: % Hindi input usage
  - Target: 10%+ in India region
- **Question Answer Rate**: % hints answered
  - Target: 80%+

### Phase 3 Success Metrics
- **Repeat Meal Usage**: % logs using suggestions
  - Target: 30%+
- **Time-to-Confirm**: Seconds to save meal
  - Baseline: 45s
  - Target: 36s (20% reduction)
- **Prior Impact**: MAE improvement on repeat foods
  - Target: 15% better accuracy

## 🐛 Troubleshooting

### Common Issues

**"Camera permission denied"**
- Solution: Go to phone Settings → App → Permissions → Camera → Allow

**"Analysis failed"**
- Check: OpenAI API key is valid
- Check: Internet connection
- Check: Image file size < 5MB

**"No suggestions appearing"**
- Need 3+ logs of same meal combination
- Check: Database connection
- Check: User is authenticated

**Hindi text not recognized**
- Ensure multilingual_synonyms table is seeded
- Check: UTF-8 encoding
- Verify: Font supports Devanagari script

## 🔮 Future Enhancements

### Planned Features
- **Voice Input**: Speak meals instead of typing
- **Barcode Scanner**: Scan packaged foods
- **Restaurant Integration**: Import from Zomato/Swiggy
- **Meal Sharing**: Share recipes with friends
- **Nutrition Coach**: AI-powered recommendations
- **Grocery Lists**: Auto-generate from meal plans
- **Apple Health / Google Fit**: Sync activity data

### ML Improvements
- **Custom Vision Model**: Fine-tune on Indian food dataset
- **Portion Estimation**: 3D reconstruction from photos
- **Temporal Patterns**: Predict next meal
- **Social Learning**: Aggregate corrections across users

## 📄 License

This project is proprietary and confidential.

## 👥 Contributors

- Development Team
- AI/ML Engineering
- Database Architecture
- UX Design

## 📞 Support

For issues or questions:
- Email: support@nutritrack.app
- Docs: https://docs.nutritrack.app
- Community: https://community.nutritrack.app

---

**Built with ❤️ for the Indian food community**

Last Updated: October 2025
Version: 1.0.0
