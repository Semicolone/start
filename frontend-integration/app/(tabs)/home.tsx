import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { homeApi } from '../../lib/client';

const logoLeaf = require('../../assets/images/logo_leaf.png');

const heatmapRows = [
  [1, 0, 1, 0, 2, 1, 1, 0, 2, 1, 3, 0, 1, 2, 1, 3],
  [0, 1, 1, 2, 1, 0, 1, 3, 1, 2, 0, 1, 3, 1, 2, 1],
  [1, 0, 2, 1, 3, 1, 0, 1, 2, 0, 1, 3, 1, 2, 0, 1],
  [0, 1, 2, 0, 1, 1, 2, 1, 3, 1, 0, 1, 2, 1, 3, 0],
  [1, 1, 0, 2, 1, 3, 1, 0, 1, 2, 1, 3, 0, 1, 2, 1],
  [0, 1, 0, 1, 2, 1, 0, 1, 1, 2, 0, 1, 3, 1, 0, 1],
  [0, 0, 1, 0, 1, 1, 0, 0, 2, 1, 0, 1, 1, 0, 2, 0],
];

const heatmapColors = ['#EEF4EA', '#DCEACF', '#BFD8A9', '#6FA46C'];

type HomeData = {
  username: string;
  totalQuestions: number;
  activeDays: number;
  aiToolCount: number;
};

type CategoryItem = {
  name: string;
  percent: number;
  count: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type RecentQuestion = {
  question: string;
  answer: string;
  source: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  date: string;
};

type AiToolItem = {
  name: string;
  percent: number;
  count: number;
  color: string;
};

const mockCategoryData: CategoryItem[] = [
  {
    name: '자기계발',
    percent: 34,
    count: 0,
    color: '#1F7A4D',
    icon: 'leaf-outline',
  },
  {
    name: '업무 / 커리어',
    percent: 28,
    count: 0,
    color: '#8B6CC7',
    icon: 'briefcase-outline',
  },
  {
    name: '관계 / 소통',
    percent: 18,
    count: 0,
    color: '#D45D79',
    icon: 'heart-outline',
  },
  {
    name: '건강 / 라이프',
    percent: 12,
    count: 0,
    color: '#888780',
    icon: 'sunny-outline',
  },
  {
    name: '기타',
    percent: 8,
    count: 0,
    color: '#2D6A4F',
    icon: 'folder-outline',
  },
];

const mockRecentQuestions: RecentQuestion[] = [
  {
    question: '개발자 취업 vs 대학원 진학',
    answer: '취업은 빠른 실무 경험, 대학원은 연구 역량 강화에 유리해요.',
    source: 'Claude',
    category: '커리어/진로',
    categoryColor: '#8B6CC7',
    categoryBg: '#F2EAFE',
    date: '5/14',
  },
  {
    question: 'Zustand vs Redux 비교',
    answer: '소규모 프로젝트는 Zustand, 대형 프로젝트는 Redux가 유리할 수 있어요.',
    source: 'ChatGPT',
    category: '개발',
    categoryColor: '#4267D9',
    categoryBg: '#EEF2FF',
    date: '5/13',
  },
  {
    question: '자기소개서 지원 동기 작성법',
    answer: '구체적인 경험과 지원 회사의 특징을 연결해 작성하는 것이 좋아요.',
    source: 'Claude',
    category: '커리어/진로',
    categoryColor: '#8B6CC7',
    categoryBg: '#F2EAFE',
    date: '5/12',
  },
];

const mockAiToolData: AiToolItem[] = [
  { name: 'ChatGPT', percent: 58, count: 0, color: '#15966B' },
  { name: 'Claude', percent: 32, count: 0, color: '#D97706' },
  { name: 'Gemini', percent: 10, count: 0, color: '#3B82F6' },
];

function getCategoryStyle(categoryName?: string) {
  if (!categoryName) {
    return {
      category: '기타',
      categoryColor: '#2D6A4F',
      categoryBg: '#EAF7F0',
    };
  }

  if (
    categoryName.includes('커리어') ||
    categoryName.includes('진로') ||
    categoryName.includes('업무')
  ) {
    return {
      category: categoryName,
      categoryColor: '#8B6CC7',
      categoryBg: '#F2EAFE',
    };
  }

  if (
    categoryName.includes('개발') ||
    categoryName.includes('코딩') ||
    categoryName.includes('프로그래밍')
  ) {
    return {
      category: categoryName,
      categoryColor: '#4267D9',
      categoryBg: '#EEF2FF',
    };
  }

  if (
    categoryName.includes('학습') ||
    categoryName.includes('공부') ||
    categoryName.includes('학교')
  ) {
    return {
      category: categoryName,
      categoryColor: '#2D9E6B',
      categoryBg: '#EAF7F0',
    };
  }

  if (
    categoryName.includes('감정') ||
    categoryName.includes('고민') ||
    categoryName.includes('관계')
  ) {
    return {
      category: categoryName,
      categoryColor: '#D45D79',
      categoryBg: '#FCEEEF',
    };
  }

  if (categoryName.includes('일상')) {
    return {
      category: categoryName,
      categoryColor: '#888780',
      categoryBg: '#F5F4F0',
    };
  }

  if (categoryName.includes('창작') || categoryName.includes('아이디어')) {
    return {
      category: categoryName,
      categoryColor: '#F4A261',
      categoryBg: '#FFF4E8',
    };
  }

  if (categoryName.includes('기타')) {
    return {
      category: categoryName,
      categoryColor: '#2D6A4F',
      categoryBg: '#EAF7F0',
    };
  }

  return {
    category: categoryName,
    categoryColor: '#9CA3AF',
    categoryBg: '#F3F4F6',
  };
}

function getCategoryTheme(name: string, index: number) {
  if (name.includes('커리어') || name.includes('진로') || name.includes('업무')) {
    return { color: '#8B6CC7', icon: 'briefcase-outline' as const };
  }

  if (name.includes('개발') || name.includes('코딩') || name.includes('프로그래밍')) {
    return { color: '#4267D9', icon: 'code-slash-outline' as const };
  }

  if (name.includes('학습') || name.includes('공부') || name.includes('학교')) {
    return { color: '#2D9E6B', icon: 'book-outline' as const };
  }

  if (name.includes('감정') || name.includes('고민') || name.includes('관계')) {
    return { color: '#D45D79', icon: 'heart-outline' as const };
  }

  if (name.includes('일상')) {
    return { color: '#888780', icon: 'sunny-outline' as const };
  }

  if (name.includes('창작') || name.includes('아이디어')) {
    return { color: '#F4A261', icon: 'bulb-outline' as const };
  }

  if (name.includes('기타')) {
    return { color: '#2D6A4F', icon: 'folder-outline' as const };
  }

  const themes = [
    { color: '#4267D9', icon: 'code-slash-outline' as const },
    { color: '#888780', icon: 'sunny-outline' as const },
    { color: '#8B6CC7', icon: 'briefcase-outline' as const },
    { color: '#D45D79', icon: 'heart-outline' as const },
    { color: '#2D9E6B', icon: 'book-outline' as const },
    { color: '#F4A261', icon: 'bulb-outline' as const },
    { color: '#2D6A4F', icon: 'folder-outline' as const },
  ];

  return themes[index % themes.length];
}

function getAiToolColor(name: string, index: number) {
  const lower = name.toLowerCase();

  if (lower.includes('chatgpt') || lower.includes('gpt')) return '#15966B';
  if (lower.includes('claude')) return '#D97706';
  if (lower.includes('gemini')) return '#3B82F6';

  const colors = ['#15966B', '#D97706', '#3B82F6', '#8B6CC7', '#6B7280'];
  return colors[index % colors.length];
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

export default function HomeScreen() {
  const [homeData, setHomeData] = useState<HomeData>({
    username: '채원',
    totalQuestions: 0,
    activeDays: 0,
    aiToolCount: 0,
  });

  const [categoryData, setCategoryData] = useState<CategoryItem[]>(mockCategoryData);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>(mockRecentQuestions);
  const [aiToolData, setAiToolData] = useState<AiToolItem[]>(mockAiToolData);

  const fetchHomeData = async () => {
    try {
      const data = await homeApi.getHome();
      console.log('홈 API 응답:', data);

      const greetingText = data?.greeting || '';
      const extractedName =
        data?.username ||
        data?.name ||
        data?.user?.username ||
        data?.user?.name ||
        (greetingText.includes('님') ? greetingText.split('님')[0] : '채원');

      setHomeData({
        username: extractedName,
        totalQuestions:
          data?.total_insights ??
          data?.totalQuestions ??
          data?.total_questions ??
          0,
        activeDays:
          data?.active_days ??
          data?.activeDays ??
          data?.monthly_active_days ??
          data?.this_month_active_days ??
          0,
        aiToolCount:
          data?.ai_tool_count ??
          data?.aiToolCount ??
          data?.used_ai_tool_count ??
          data?.ai_source_count ??
          0,
      });

      if (Array.isArray(data?.recent_insights)) {
        const mappedRecent = data.recent_insights.slice(0, 3).map((item: any) => {
          const categoryInfo = getCategoryStyle(
            item?.category_name ||
              item?.category ||
              item?.categoryName ||
              item?.category?.name
          );

          return {
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
            category: categoryInfo.category,
            categoryColor: categoryInfo.categoryColor,
            categoryBg: categoryInfo.categoryBg,
            date: formatDate(item?.created_at || item?.date),
          };
        });

        setRecentQuestions(mappedRecent);
      }

      if (Array.isArray(data?.category_distribution)) {
        const mappedCategories = data.category_distribution.map(
          (item: any, index: number) => {
            const name = item?.name || item?.category || item?.category_name || '기타';
            const theme = getCategoryTheme(name, index);

            return {
              name,
              percent: Number(item?.percent ?? 0),
              count: Number(item?.count ?? 0),
              color: theme.color,
              icon: theme.icon,
            };
          }
        );

        setCategoryData(mappedCategories);
      }

      if (Array.isArray(data?.ai_tool_distribution)) {
        const mappedAiTools = data.ai_tool_distribution.map(
          (item: any, index: number) => {
            const name = item?.name || item?.ai_source || item?.source || 'AI';

            return {
              name,
              count: Number(item?.count ?? 0),
              percent: Number(item?.percent ?? 0),
              color: getAiToolColor(name, index),
            };
          }
        );

        setAiToolData(mappedAiTools);
      }
    } catch (error) {
      console.log('홈 데이터 불러오기 실패:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View style={styles.phone}>
          <View style={styles.topLeafBg} />

          <View style={styles.header}>
            <View style={styles.headerSide} />

            <View style={styles.logoRow}>
              <Image source={logoLeaf} style={styles.logoLeaf} resizeMode="contain" />
              <Text style={styles.logoText}>FLOW</Text>
            </View>

            <Pressable style={styles.searchButton}>
              <Ionicons name="search-outline" size={21} color="#1F5F3F" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.greetingArea}>
              <Text style={styles.greeting}>안녕하세요, {homeData.username}님 👋</Text>
              <Text style={styles.greetingSub}>
                이번 달 총{' '}
                <Text style={styles.greenStrong}>{homeData.totalQuestions}</Text>개
                질문했어요.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="leaf-outline" size={21} color="#1F7A4D" />
                </View>
                <Text style={styles.statLabel}>전체 질문</Text>
                <Text style={styles.statNumber}>
                  {homeData.totalQuestions}
                  <Text style={styles.statUnit}> 개</Text>
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="calendar-outline" size={21} color="#1F7A4D" />
                </View>
                <Text style={styles.statLabel}>질문한 날짜</Text>
                <Text style={styles.statNumber}>
                  {homeData.activeDays}
                  <Text style={styles.statUnit}> 일</Text>
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="settings-outline" size={21} color="#1F7A4D" />
                </View>
                <Text style={styles.statLabel}>AI 도구 사용</Text>
                <Text style={styles.statNumber}>
                  {homeData.aiToolCount}
                  <Text style={styles.statUnit}> 개</Text>
                </Text>
              </View>
            </View>

            <View style={styles.heatmapCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>활동 히트맵</Text>

                <Pressable onPress={() => router.push('/calendar')}>
                  <Text style={styles.viewAllText}>전체보기</Text>
                </Pressable>
              </View>

              <Text style={styles.mockNoticeText}>
                히트맵은 MVP 이후 실제 데이터 연동 예정이에요.
              </Text>

              <View style={styles.monthRow}>
                <View style={styles.weekLabelSpace} />
                <Text style={styles.monthText}>이번 달</Text>
              </View>

              <View style={styles.heatmapBody}>
                <View style={styles.weekLabels}>
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                    <Text key={day} style={styles.weekLabel}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.heatmapGrid}>
                  {heatmapRows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.heatmapRow}>
                      {row.map((level, index) => (
                        <View
                          key={`${rowIndex}-${index}`}
                          style={[
                            styles.heatCell,
                            { backgroundColor: heatmapColors[level] },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.legendRow}>
                <Text style={styles.legendText}>적음</Text>

                <View style={styles.legendCells}>
                  {heatmapColors.map((color) => (
                    <View
                      key={color}
                      style={[styles.legendCell, { backgroundColor: color }]}
                    />
                  ))}
                </View>

                <Text style={styles.legendText}>많음</Text>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>카테고리 분포</Text>

              {categoryData.length > 0 ? (
                categoryData.map((item) => (
                  <View key={item.name} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name={item.icon} size={19} color={item.color} />
                      <Text style={styles.categoryName}>{item.name}</Text>
                    </View>

                    <View style={styles.categoryProgressTrack}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${Math.min(item.percent, 100)}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.categoryPercent}>{item.percent}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySmallText}>아직 카테고리 데이터가 없어요.</Text>
              )}
            </View>

            <View style={styles.recentCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.recentTitle}>최근 질문</Text>

                <Pressable onPress={() => router.push('/recent')}>
                  <Text style={styles.viewAllText}>전체 보기 →</Text>
                </Pressable>
              </View>

              {recentQuestions.length > 0 ? (
                recentQuestions.map((item, index) => (
                  <View
                    key={`${item.question}-${index}`}
                    style={[
                      styles.recentItem,
                      index !== recentQuestions.length - 1 && styles.recentDivider,
                    ]}
                  >
                    <Text style={styles.recentQuestion}>{item.question}</Text>
                    <Text style={styles.recentAnswer}>{item.answer}</Text>

                    <View style={styles.recentMetaRow}>
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceBadgeText}>{item.source}</Text>
                      </View>

                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: item.categoryBg,
                            borderColor: item.categoryColor + '55',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBadgeText,
                            { color: item.categoryColor },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>

                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySmallText}>아직 최근 질문이 없어요.</Text>
              )}
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>AI 툴 사용 비율</Text>

              {aiToolData.length > 0 ? (
                aiToolData.map((item) => (
                  <View key={item.name} style={styles.aiRow}>
                    <Text style={styles.aiName}>{item.name}</Text>

                    <View style={styles.aiProgressTrack}>
                      <View
                        style={[
                          styles.aiProgressFill,
                          {
                            width: `${Math.min(item.percent, 100)}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.aiPercent}>{item.percent}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySmallText}>아직 AI 툴 사용 데이터가 없어요.</Text>
              )}
            </View>
          </ScrollView>

          <Pressable style={styles.floatingButton} onPress={() => router.push('/add')}>
            <Ionicons name="add" size={34} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAE5DA',
  },

  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE5DA',
  },

  phone: {
    width: '100%',
    maxWidth: 360,
    height: '100%',
    minHeight: 640,
    backgroundColor: '#F7F6F1',
    position: 'relative',
    overflow: 'hidden',
  },

  topLeafBg: {
    position: 'absolute',
    top: 70,
    right: -40,
    width: 205,
    height: 82,
    borderRadius: 80,
    backgroundColor: '#EAF3E8',
    opacity: 0.7,
    transform: [{ rotate: '-15deg' }],
  },

  header: {
    height: 76,
    paddingTop: 34,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },

  headerSide: {
    width: 34,
    height: 34,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoLeaf: {
    width: 23,
    height: 23,
    marginRight: 5,
  },

  logoText: {
    fontSize: 17,
    color: '#1F5F3F',
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 105,
  },

  greetingArea: {
    marginTop: 4,
    marginBottom: 14,
  },

  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },

  greetingSub: {
    marginTop: 5,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  greenStrong: {
    color: '#1F7A4D',
    fontWeight: '900',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#EAF4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 4,
  },

  statNumber: {
    fontSize: 27,
    color: '#1F7A4D',
    fontWeight: '900',
    lineHeight: 32,
  },

  statUnit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },

  heatmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  viewAllText: {
    fontSize: 12,
    color: '#1F7A4D',
    fontWeight: '800',
  },

  mockNoticeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 10,
  },

  monthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  weekLabelSpace: {
    width: 26,
  },

  monthText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '900',
  },

  heatmapBody: {
    flexDirection: 'row',
  },

  weekLabels: {
    width: 26,
    gap: 5,
  },

  weekLabel: {
    height: 13,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    lineHeight: 13,
  },

  heatmapGrid: {
    flex: 1,
    gap: 5,
  },

  heatmapRow: {
    flexDirection: 'row',
    gap: 5,
  },

  heatCell: {
    flex: 1,
    height: 13,
    borderRadius: 4,
  },

  legendRow: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 7,
  },

  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },

  legendCells: {
    flexDirection: 'row',
    gap: 4,
  },

  legendCell: {
    width: 14,
    height: 8,
    borderRadius: 2,
  },

  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  categoryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 18,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  categoryLeft: {
    width: 118,
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '900',
  },

  categoryProgressTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#EEF0ED',
    borderRadius: 999,
    overflow: 'hidden',
  },

  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },

  categoryPercent: {
    width: 48,
    textAlign: 'right',
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '900',
  },

  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9CA3AF',
    marginBottom: 15,
  },

  recentItem: {
    paddingVertical: 14,
  },

  recentDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8DF',
  },

  recentQuestion: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 8,
  },

  recentAnswer: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 9,
  },

  recentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sourceBadge: {
    backgroundColor: '#F7F7F4',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginRight: 7,
  },

  sourceBadgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '900',
  },

  categoryBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },

  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },

  dateText: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '800',
  },

  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  aiTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9CA3AF',
    marginBottom: 15,
  },

  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  aiName: {
    width: 72,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '800',
  },

  aiProgressTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#F0F0EF',
    borderRadius: 999,
    overflow: 'hidden',
  },

  aiProgressFill: {
    height: '100%',
    borderRadius: 999,
  },

  aiPercent: {
    width: 42,
    textAlign: 'right',
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '800',
  },

  emptySmallText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '700',
    lineHeight: 20,
  },

  floatingButton: {
    position: 'absolute',
    right: 22,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#0F6B3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F6B3D',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
});