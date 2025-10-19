import { DetectedFood } from '@/types/ai';

interface ConfidenceFactors {
  modelConfidence: number;
  mappingConfidence: number;
  portionHeuristic: number;
  contextScore: number;
}

export function calculateOverallConfidence(
  detectedFood: DetectedFood,
  mappingConfidence: number,
  portionHeuristic: number,
  hasContext: boolean
): number {
  const factors: ConfidenceFactors = {
    modelConfidence: detectedFood.confidence,
    mappingConfidence,
    portionHeuristic,
    contextScore: hasContext ? 90 : 70,
  };

  const weights = {
    modelConfidence: 0.4,
    mappingConfidence: 0.3,
    portionHeuristic: 0.2,
    contextScore: 0.1,
  };

  const weightedScore =
    factors.modelConfidence * weights.modelConfidence +
    factors.mappingConfidence * weights.mappingConfidence +
    factors.portionHeuristic * weights.portionHeuristic +
    factors.contextScore * weights.contextScore;

  return Math.round(weightedScore);
}

export function calculatePortionHeuristic(
  detectedPortion: number,
  expectedPortion: number
): number {
  if (expectedPortion === 0) return 50;

  const ratio = detectedPortion / expectedPortion;

  if (ratio >= 0.8 && ratio <= 1.2) return 95;
  if (ratio >= 0.6 && ratio <= 1.5) return 80;
  if (ratio >= 0.4 && ratio <= 2.0) return 60;

  return 40;
}

export function shouldRequestVerification(confidence: number): boolean {
  return confidence < 70;
}

export function shouldShowWarning(confidence: number): boolean {
  return confidence < 80;
}

export function getConfidenceLevel(
  confidence: number
): 'high' | 'medium' | 'low' | 'very-low' {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'medium';
  if (confidence >= 50) return 'low';
  return 'very-low';
}

export function getConfidenceMessage(confidence: number): string {
  const level = getConfidenceLevel(confidence);

  const messages = {
    high: 'Analysis looks accurate',
    medium: 'Please verify the details',
    low: 'Low confidence - please review carefully',
    'very-low': 'Unable to identify accurately - manual entry recommended',
  };

  return messages[level];
}

export function generateExplainabilityTrace(
  detectedFood: DetectedFood,
  factors: Partial<ConfidenceFactors>
): string {
  const traces: string[] = [];

  if (factors.modelConfidence !== undefined) {
    traces.push(
      `Model confidence: ${Math.round(factors.modelConfidence)}% (${factors.modelConfidence >= 80 ? 'good' : 'needs review'})`
    );
  }

  if (factors.mappingConfidence !== undefined) {
    traces.push(
      `Database match: ${Math.round(factors.mappingConfidence)}% (${factors.mappingConfidence >= 85 ? 'exact' : 'fuzzy'})`
    );
  }

  if (factors.portionHeuristic !== undefined) {
    traces.push(
      `Portion estimate: ${Math.round(factors.portionHeuristic)}% (${factors.portionHeuristic >= 80 ? 'typical' : 'unusual'})`
    );
  }

  if (detectedFood.confidence < 70) {
    traces.push('⚠️ Recommendation: Verify all values before saving');
  }

  return traces.join('\n');
}

export interface QualityMetrics {
  averageConfidence: number;
  lowConfidenceCount: number;
  verificationRate: number;
  correctionRate: number;
}

export function calculateQualityMetrics(
  analyses: Array<{ confidence: number; verified: boolean; corrected: boolean }>
): QualityMetrics {
  if (analyses.length === 0) {
    return {
      averageConfidence: 0,
      lowConfidenceCount: 0,
      verificationRate: 0,
      correctionRate: 0,
    };
  }

  const totalConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0);
  const lowConfidenceCount = analyses.filter((a) => a.confidence < 70).length;
  const verifiedCount = analyses.filter((a) => a.verified).length;
  const correctedCount = analyses.filter((a) => a.corrected).length;

  return {
    averageConfidence: Math.round(totalConfidence / analyses.length),
    lowConfidenceCount,
    verificationRate: Math.round((verifiedCount / analyses.length) * 100),
    correctionRate: Math.round((correctedCount / analyses.length) * 100),
  };
}
