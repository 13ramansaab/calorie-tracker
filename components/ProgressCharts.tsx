import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 200;

interface DataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: number;
}

interface ProgressChartsProps {
  data: DataPoint[];
  period: 7 | 30;
}

export function ProgressCharts({ data, period }: ProgressChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.calories, d.protein * 4, d.carbs * 4, d.fat * 9, d.goal))
  );

  const getMetricValue = (dataPoint: DataPoint) => {
    switch (selectedMetric) {
      case 'calories':
        return dataPoint.calories;
      case 'protein':
        return dataPoint.protein * 4;
      case 'carbs':
        return dataPoint.carbs * 4;
      case 'fat':
        return dataPoint.fat * 9;
    }
  };

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'calories':
        return '#10b981';
      case 'protein':
        return '#3b82f6';
      case 'carbs':
        return '#f59e0b';
      case 'fat':
        return '#ef4444';
    }
  };

  const barWidth = (CHART_WIDTH - (data.length + 1) * 8) / data.length;

  return (
    <View style={styles.container}>
      <View style={styles.metricSelector}>
        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'calories' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('calories')}
        >
          <Text
            style={[
              styles.metricButtonText,
              selectedMetric === 'calories' && styles.metricButtonTextActive,
            ]}
          >
            Calories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'protein' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('protein')}
        >
          <Text
            style={[
              styles.metricButtonText,
              selectedMetric === 'protein' && styles.metricButtonTextActive,
            ]}
          >
            Protein
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'carbs' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('carbs')}
        >
          <Text
            style={[
              styles.metricButtonText,
              selectedMetric === 'carbs' && styles.metricButtonTextActive,
            ]}
          >
            Carbs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'fat' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('fat')}
        >
          <Text
            style={[
              styles.metricButtonText,
              selectedMetric === 'fat' && styles.metricButtonTextActive,
            ]}
          >
            Fat
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <Text key={ratio} style={styles.yAxisLabel}>
              {Math.round(maxValue * ratio)}
            </Text>
          ))}
        </View>

        <View style={styles.chartArea}>
          <View style={styles.gridLines}>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <View
                key={ratio}
                style={[
                  styles.gridLine,
                  { bottom: `${ratio * 100}%` },
                ]}
              />
            ))}
          </View>

          <View style={styles.bars}>
            {data.map((dataPoint, index) => {
              const value = getMetricValue(dataPoint);
              const height = (value / maxValue) * CHART_HEIGHT;
              const goalHeight = (dataPoint.goal / maxValue) * CHART_HEIGHT;
              const isAboveGoal = value > dataPoint.goal;

              return (
                <View key={index} style={[styles.barContainer, { width: barWidth }]}>
                  {dataPoint.goal > 0 && (
                    <View
                      style={[
                        styles.goalLine,
                        { bottom: goalHeight },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(height, 4),
                        backgroundColor: isAboveGoal ? '#fbbf24' : getMetricColor(),
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>
                    {period === 7
                      ? new Date(dataPoint.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })
                      : new Date(dataPoint.date).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getMetricColor() }]} />
          <Text style={styles.legendText}>
            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#6b7280' }]} />
          <Text style={styles.legendText}>Daily Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: '#10b981',
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  metricButtonTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
    marginBottom: 16,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    gap: 8,
  },
  barContainer: {
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  barLabel: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 16,
    height: 2,
    opacity: 0.5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
