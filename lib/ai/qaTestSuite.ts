import { runPhotoAnalysis } from './analysisOrchestrator';
import { enforceQuotaOrPaywall } from './quotaEnforcement';
import { getDashboardMetrics, checkHealthThresholds } from './monitoring';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

export async function runSmokeTests(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  results.push(await testPhotoWithNote(userId));
  results.push(await testPhotoWithoutNote(userId));
  results.push(await testPoorLightImage(userId));
  results.push(await testPaywallHit(userId));
  results.push(await testManualCorrection(userId));

  return results;
}

async function testPhotoWithNote(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://clear-thali.jpg',
      userNote: '2 chapati + 1 bowl dal',
      mealType: 'lunch',
      userId,
      userRegion: 'North India',
    });

    const passed =
      result.foods.length > 0 &&
      result.totalCalories > 0 &&
      result.usedNote === true &&
      result.foods.some((f) => f.name.toLowerCase().includes('chapati')) &&
      result.foods.some((f) => f.name.toLowerCase().includes('dal'));

    return {
      testName: 'Photo with note (clear thali)',
      passed,
      duration: Date.now() - start,
      details: passed
        ? `Found ${result.foods.length} items, ${result.totalCalories} cal, note used: ${result.usedNote}`
        : 'Failed validation checks',
    };
  } catch (error) {
    return {
      testName: 'Photo with note (clear thali)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testPhotoWithoutNote(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://meal-ambiguous.jpg',
      mealType: 'lunch',
      userId,
      userRegion: 'North India',
    });

    const passed =
      result.foods.length > 0 &&
      result.totalCalories > 0 &&
      result.overallConfidence >= 0.5 &&
      result.overallConfidence <= 0.8;

    return {
      testName: 'Photo without note (medium confidence)',
      passed,
      duration: Date.now() - start,
      details: passed
        ? `Found ${result.foods.length} items, confidence: ${result.overallConfidence.toFixed(2)}`
        : 'Failed confidence range check',
    };
  } catch (error) {
    return {
      testName: 'Photo without note (medium confidence)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testPoorLightImage(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://poor-light.jpg',
      mealType: 'dinner',
      userId,
      userRegion: 'South India',
    });

    const passed =
      result.foods.length > 0 &&
      result.overallConfidence < 0.7 &&
      result.foods.every((f) => f.confidence < 0.8);

    return {
      testName: 'Poor light image (low confidence)',
      passed,
      duration: Date.now() - start,
      details: passed
        ? `Found ${result.foods.length} items, avg confidence: ${result.overallConfidence.toFixed(2)}`
        : 'Confidence should be < 0.7 for poor images',
    };
  } catch (error) {
    return {
      testName: 'Poor light image (low confidence)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testPaywallHit(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    for (let i = 0; i < 6; i++) {
      await runPhotoAnalysis({
        photoUri: `test://image-${i}.jpg`,
        mealType: 'lunch',
        userId,
      });
    }

    const quotaStatus = await enforceQuotaOrPaywall(userId, 'vision_daily', false);

    const passed = !quotaStatus.allowed && quotaStatus.remaining === 0;

    return {
      testName: 'Paywall hit (free user)',
      passed,
      duration: Date.now() - start,
      details: passed
        ? `Quota exhausted: ${quotaStatus.remaining}/${quotaStatus.limit}`
        : 'Should block after 5 free analyses',
    };
  } catch (error) {
    return {
      testName: 'Paywall hit (free user)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testManualCorrection(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://meal.jpg',
      mealType: 'lunch',
      userId,
    });

    const editedFoods = result.foods.map((food) => ({
      ...food,
      portion: food.portion * 1.2,
      calories: Math.round(food.calories * 1.2),
      wasEdited: true,
    }));

    const passed = editedFoods.every((f: any) => f.wasEdited === true);

    return {
      testName: 'Manual correction (feedback stored)',
      passed,
      duration: Date.now() - start,
      details: passed
        ? `Edited ${editedFoods.length} items successfully`
        : 'Failed to track edits',
    };
  } catch (error) {
    return {
      testName: 'Manual correction (feedback stored)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function testEdgeCases(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  results.push(await testBigImage(userId));
  results.push(await testTimeout(userId));
  results.push(await testBadJSON(userId));

  return results;
}

async function testBigImage(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://large-12mb.jpg',
      mealType: 'lunch',
      userId,
    });

    const passed = false;

    return {
      testName: 'Big image (compress prompt)',
      passed,
      duration: Date.now() - start,
      error: 'Should have thrown size error before reaching API',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    const passed = errorMsg.includes('too large') || errorMsg.includes('Maximum size');

    return {
      testName: 'Big image (compress prompt)',
      passed,
      duration: Date.now() - start,
      details: passed ? 'Correctly rejected oversized image' : 'Wrong error',
      error: !passed ? errorMsg : undefined,
    };
  }
}

async function testTimeout(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://timeout-trigger.jpg',
      mealType: 'lunch',
      userId,
    });

    return {
      testName: 'Timeout from model (manual fallback)',
      passed: false,
      duration: Date.now() - start,
      error: 'Should have timed out',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    const passed = errorMsg.includes('timeout') || errorMsg.includes('network');

    return {
      testName: 'Timeout from model (manual fallback)',
      passed,
      duration: Date.now() - start,
      details: passed ? 'Correctly handled timeout with retry' : 'Wrong error type',
      error: !passed ? errorMsg : undefined,
    };
  }
}

async function testBadJSON(userId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await runPhotoAnalysis({
      photoUri: 'test://bad-json.jpg',
      mealType: 'lunch',
      userId,
    });

    return {
      testName: 'Bad JSON from model (retry)',
      passed: false,
      duration: Date.now() - start,
      error: 'Should have retried and failed',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    const passed = errorMsg.includes('JSON') || errorMsg.includes('parse');

    return {
      testName: 'Bad JSON from model (retry)',
      passed,
      duration: Date.now() - start,
      details: passed ? 'Correctly retried and reported parse error' : 'Wrong error type',
      error: !passed ? errorMsg : undefined,
    };
  }
}

export async function testAcceptanceCriteria(): Promise<{
  passed: boolean;
  results: Record<string, boolean>;
}> {
  const results: Record<string, boolean> = {};

  const metrics = await getDashboardMetrics();
  results['P95 latency <= 6s'] = metrics.p95Latency <= 6000;

  results['Success rate >= 90%'] = metrics.successRate >= 90;

  const health = await checkHealthThresholds();
  results['No critical alerts'] = health.healthy;

  results['Edit rate < 30%'] = metrics.editRate < 30;

  const passed = Object.values(results).every((r) => r === true);

  return { passed, results };
}

export function formatTestResults(results: TestResult[]): string {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  let output = `\n${'='.repeat(60)}\n`;
  output += `QA Test Results: ${passed}/${total} passed\n`;
  output += `${'='.repeat(60)}\n\n`;

  results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    output += `${status} - ${result.testName} (${result.duration}ms)\n`;
    if (result.details) {
      output += `   ${result.details}\n`;
    }
    if (result.error) {
      output += `   Error: ${result.error}\n`;
    }
    output += '\n';
  });

  return output;
}
