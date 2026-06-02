import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { categoryApi } from '../../lib/client';

type CategoryItem = {
  id: string | number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count: number;
};

type InsightItem = {
  id: string | number;
  question: string;
  answer: string;
  source: string;
  date: string;
};

function getCategoryTheme(name: string) {
  if (name.includes('커리어') || name.includes('진로') || name.includes('업무')) {
    return {
      icon: 'briefcase-outline' as const,
      color: '#7b5ea7',
    };
  }

  if (name.includes('개발') || name.includes('코딩') || name.includes('프로그래밍')) {
    return {
      icon: 'code-slash-outline' as const,
      color: '#3b5bdb',
    };
  }

  if (name.includes('학습') || name.includes('공부') || name.includes('학교')) {
    return {
      icon: 'book-outline' as const,
      color: '#2d9e6b',
    };
  }

  if (name.includes('감정') || name.includes('고민') || name.includes('관계')) {
    return {
      icon: 'heart-outline' as const,
      color: '#d45d79',
    };
  }

  if (name.includes('창작') || name.includes('아이디어')) {
    return {
      icon: 'bulb-outline' as const,
      color: '#e07b39',
    };
  }

  if (name.includes('일상') || name.includes('라이프')) {
    return {
      icon: 'sunny-outline' as const,
      color: '#888780',
    };
  }

  return {
    icon: 'folder-outline' as const,
    color: '#2d6a4f',
  };
}

function formatDate(raw?: string) {
  if (!raw) return '';

  if (raw.includes('T')) {
    return raw.slice(5, 10).replace('-', '/');
  }

  if (raw.includes('-')) {
    return raw.slice(5, 10).replace('-', '/');
  }

  return raw;
}

function mapCategory(item: any, index: number): CategoryItem {
  const name =
    item?.name ||
    item?.category_name ||
    item?.categoryName ||
    item?.category ||
    '기타';

  const theme = getCategoryTheme(name);

  return {
    id:
      item?.id ??
      item?.category_id ??
      item?.categoryId ??
      `category-${index}`,
    name,
    icon: theme.icon,
    color: item?.color || theme.color,
    count:
      item?.count ??
      item?.insight_count ??
      item?.insightCount ??
      item?.total ??
      item?.total_count ??
      0,
  };
}

function mapInsight(item: any, index: number): InsightItem {
  return {
    id: item?.id ?? item?.insight_id ?? item?.insightId ?? `insight-${index}`,
    question:
      item?.question_summary ||
      item?.question_original ||
      item?.question ||
      '저장된 질문',
    answer:
      item?.answer_summary ||
      item?.answer_original ||
      item?.answer ||
      '저장된 답변 요약이 없습니다.',
    source: item?.ai_source || item?.source || 'AI',
    date: formatDate(item?.created_at || item?.date),
  };
}

export default function CategoryScreen() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      setErrorMessage('');

      const data = await categoryApi.getList();
      console.log('카테고리 API 응답:', data);

      const list = Array.isArray(data)
        ? data
        : data?.categories || data?.items || data?.data || [];

      const mappedCategories = Array.isArray(list)
        ? list.map(mapCategory)
        : [];

      setCategories(mappedCategories);

      if (mappedCategories.length > 0) {
        setSelectedCategoryId(mappedCategories[0].id);
        fetchInsightsByCategory(mappedCategories[0].id);
      } else {
        setSelectedCategoryId(null);
        setInsights([]);
      }
    } catch (error: any) {
      console.log('카테고리 불러오기 실패:', error);
      setErrorMessage(error?.message || '카테고리를 불러오지 못했습니다.');
      setCategories([]);
      setSelectedCategoryId(null);
      setInsights([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchInsightsByCategory = async (categoryId: string | number) => {
    try {
      setInsightLoading(true);
      setErrorMessage('');

      const data = await categoryApi.getInsights(categoryId);
      console.log('카테고리별 인사이트 API 응답:', data);

      const list = Array.isArray(data)
        ? data
        : data?.insights || data?.items || data?.data || [];

      const mappedInsights = Array.isArray(list)
        ? list.map(mapInsight)
        : [];

      setInsights(mappedInsights);
    } catch (error: any) {
      console.log('카테고리별 인사이트 불러오기 실패:', error);
      setErrorMessage(error?.message || '카테고리별 질문을 불러오지 못했습니다.');
      setInsights([]);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleSelectCategory = (categoryId: string | number) => {
    setSelectedCategoryId(categoryId);
    fetchInsightsByCategory(categoryId);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.title}>카테고리</Text>
              <Text style={styles.subtitle}>
                주제별로 저장된 인사이트를 모아봐요
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {categoryLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#2d6a4f" />
                <Text style={styles.loadingText}>카테고리를 불러오는 중이에요...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="folder-open-outline" size={30} color="#9ca3af" />
                <Text style={styles.emptyTitle}>아직 카테고리가 없어요</Text>
                <Text style={styles.emptySub}>
                  질문을 저장하면 백엔드 분류 결과에 따라 카테고리가 표시됩니다.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.categoryGrid}>
                  {categories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <Pressable
                        key={`${category.id}-${category.name}`}
                        style={[
                          styles.categoryCard,
                          isSelected && {
                            borderColor: category.color,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => handleSelectCategory(category.id)}
                      >
                        <Ionicons
                          name={category.icon}
                          size={23}
                          color={category.color}
                        />

                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryCount}>{category.count}개</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>
                      {selectedCategory?.name || '카테고리'}
                    </Text>

                    <Text
                      style={[
                        styles.selectedCount,
                        { color: selectedCategory?.color || '#2d6a4f' },
                      ]}
                    >
                      {insights.length}개
                    </Text>
                  </View>

                  {insightLoading ? (
                    <View style={styles.insightLoadingBox}>
                      <ActivityIndicator color="#2d6a4f" />
                    </View>
                  ) : insights.length > 0 ? (
                    insights.map((item) => (
                      <View key={`${item.id}-${item.question}`} style={styles.insightCard}>
                        <Text style={styles.insightQuestion}>{item.question}</Text>
                        <Text style={styles.insightAnswer} numberOfLines={2}>
                          {item.answer}
                        </Text>

                        <View style={styles.metaRow}>
                          <View style={styles.sourceBadge}>
                            <Text style={styles.sourceText}>{item.source}</Text>
                          </View>

                          <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyBoxSmall}>
                      <Ionicons name="leaf-outline" size={28} color="#9ca3af" />
                      <Text style={styles.emptyTitle}>저장된 인사이트가 없어요</Text>
                      <Text style={styles.emptySub}>
                        이 카테고리에 저장된 질문이 아직 없습니다.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e8e4dc',
  },

  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e4dc',
  },

  phoneLikeContainer: {
    width: '100%',
    maxWidth: 360,
    height: '100%',
    minHeight: 640,
    backgroundColor: '#f5f4f0',
  },

  topbar: {
    backgroundColor: '#ffffff',
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
  },

  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a18',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },

  errorText: {
    fontSize: 11,
    color: '#d45d79',
    fontWeight: '700',
    marginBottom: 10,
    backgroundColor: '#fceeef',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  loadingBox: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  categoryCard: {
    width: '48.7%',
    backgroundColor: '#ffffff',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    padding: 13,
    minHeight: 92,
  },

  categoryName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '900',
    color: '#1a1a18',
  },

  categoryCount: {
    marginTop: 3,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    padding: 12,
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  selectedCount: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },

  insightLoadingBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
  },

  insightQuestion: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1a1a18',
    lineHeight: 18,
    marginBottom: 4,
  },

  insightAnswer: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 17,
  },

  metaRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sourceBadge: {
    backgroundColor: '#f5f4f0',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  sourceText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '700',
  },

  dateText: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },

  emptyBox: {
    paddingVertical: 120,
    alignItems: 'center',
  },

  emptyBoxSmall: {
    paddingVertical: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a18',
  },

  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});