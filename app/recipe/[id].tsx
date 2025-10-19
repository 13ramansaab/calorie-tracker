import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, Users, Heart, Plus } from 'lucide-react-native';
import { checkPremiumStatus } from '@/utils/premium';
import { useAuth } from '@/contexts/AuthContext';

interface Recipe {
  id: string;
  name: string;
  image: string;
  prepTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
}

export default function RecipeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const mockRecipe: Recipe = {
      id: id as string,
      name: 'Grilled Chicken Salad',
      image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
      prepTime: 25,
      servings: 2,
      calories: 450,
      protein: 40,
      carbs: 25,
      fat: 18,
      ingredients: [
        { name: 'Chicken breast', amount: '300g' },
        { name: 'Mixed greens', amount: '4 cups' },
        { name: 'Cherry tomatoes', amount: '1 cup' },
        { name: 'Cucumber', amount: '1 medium' },
        { name: 'Olive oil', amount: '2 tbsp' },
        { name: 'Lemon juice', amount: '2 tbsp' },
        { name: 'Salt and pepper', amount: 'to taste' },
      ],
      steps: [
        'Season chicken breast with salt, pepper, and your favorite herbs',
        'Preheat grill to medium-high heat',
        'Grill chicken for 6-7 minutes per side until cooked through',
        'Let chicken rest for 5 minutes, then slice',
        'Wash and prepare all vegetables',
        'In a large bowl, combine mixed greens, tomatoes, and cucumber',
        'Whisk together olive oil and lemon juice for dressing',
        'Add sliced chicken to salad',
        'Drizzle with dressing and toss gently',
        'Serve immediately and enjoy!',
      ],
    };
    setRecipe(mockRecipe);
  }, [id]);

  const handleAddToMeal = () => {
    if (!recipe) return;
    Alert.alert('Coming Soon', 'Adding recipes to meals will be available soon');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (!recipe) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <View style={styles.backButtonCircle}>
              <ChevronLeft size={24} color="#1f2937" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <View style={styles.favoriteButtonCircle}>
              <Heart
                size={24}
                color={isFavorite ? '#ef4444' : '#6b7280'}
                fill={isFavorite ? '#ef4444' : 'none'}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.recipeContent}>
          <Text style={styles.recipeName}>{recipe.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={18} color="#6b7280" />
              <Text style={styles.metaText}>{recipe.prepTime} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={18} color="#6b7280" />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
          </View>

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition per serving</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>{' '}
                    {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.stepsList}>
              {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addToMealButton} onPress={handleAddToMeal}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addToMealButtonText}>Add to Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  favoriteButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeContent: {
    padding: 24,
    gap: 24,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  nutritionCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 7,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  ingredientAmount: {
    fontWeight: '600',
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    paddingTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addToMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addToMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
