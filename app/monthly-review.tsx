import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { homeApi, myApi } from '../lib/client';

const fallbackReviewData = {
  month: '이번 달 회고',
  title: '아직 월간 회고 데이터가 준비 중이에요',
  totalQuestions: 0,
  activeDays: 0,
  maxQuestions: '-',
  summary:
    '질문 기록이 충분히 쌓이면 한 달 동안의 질문 흐름을 요약해드릴게요.',
  highlight:
    '가장 많이 질문한 날, 자주 등장한 키워드, 관심 분야 변화를 기반으로 회고가 생성됩니다.',
  insight:
    'AI 툴 사용 패턴과 카테고리 분포를 바탕으로 나만의 질문 습관을 돌아볼 수 있어요.',
  timeline: [
    {
      week: '1주차',
      text: '질문 기록을 기반으로 주간 관심사를 분석합니다.',
      bold: '질문 기록',
    },
    {
      week: '2주차',
      text: '카테고리별 질문 흐름을 정리해 보여줍니다.',
      bold: '카테고리별 질문',
    },
    {
      week: '3주차',
      text: 'AI 툴 사용 비율과 질문 스타일 변화를 분석합니다.',
      bold: 'AI 툴 사용 비율',
    },
    {
      week: '4주차',
      text: '한 달간의 핵심 키워드와 인사이트를 회고로 정리합니다.',
      bold: '핵심 키워드',
    },
  ],
};

function unwrapReviewData(data: any) {
  if (!data) return null;

  if (data?.review && typeof data.review === 'object') {
    return data.review;
  }

  if (data?.monthly_review && typeof data.monthly_review === 'object') {
    return data.monthly_review;
  }

  if (data?.data && typeof data.data === 'object') {
    return data.data;
  }

  return data;
}

function normalizeTimeline(rawTimeline: any) {
  if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) {
    return fallbackReviewData.timeline;
  }

  return rawTimeline.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return {
        week: `${index + 1}주차`,
        text: item,
        bold: item.split(' ')[0] || '질문',
      };
    }

    return {
      week: item?.week || item?.period || `${index + 1}주차`,
      text:
        item?.text ||
        item?.summary ||
        item?.content ||
        item?.description ||
        '질문 흐름을 분석했습니다.',
      bold:
        item?.bold ||
        item?.keyword ||
        item?.main_keyword ||
        item?.title ||
        '질문 흐름',
    };
  });
}

export default function MonthlyReviewScreen() {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [reviewData, setReviewData] = useState(fallbackReviewData);
  const [loading, setLoading] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState('');

  const fetchMonthlyReview = async () => {
    try {
      setLoading(true);
      setNoticeMessage('');

      let homeData: any = null;

      try {
        homeData = await homeApi.getHome();
      } catch {
        homeData = null;
      }

      const rawReviewApiData = await myApi.getMonthlyReview({
        year,
        month,
      });

      console.log('월간회고 API 응답:', rawReviewApiData);

      const reviewApiData = unwrapReviewData(rawReviewApiData);

      if (
        reviewApiData?.review === '준비 중입니다' ||
        rawReviewApiData?.review === '준비 중입니다'
      ) {
        setNoticeMessage('월간 회고 API는 아직 준비 중 응답을 반환하고 있습니다.');
      }

      const totalQuestions =
        reviewApiData?.total_questions ??
        reviewApiData?.totalQuestions ??
        reviewApiData?.total_insights ??
        homeData?.total_insights ??
        homeData?.totalQuestions ??
        homeData?.total_questions ??
        0;

      const activeDays =
        reviewApiData?.active_days ??
        reviewApiData?.activeDays ??
        reviewApiData?.monthly_active_days ??
        homeData?.active_days ??
        homeData?.activeDays ??
        homeData?.monthly_active_days ??
        0;

      const maxQuestions =
        reviewApiData?.max_questions ??
        reviewApiData?.maxQuestions ??
        reviewApiData?.most_questions ??
        reviewApiData?.max_question_day ??
        '-';

      const title =
        reviewApiData?.title ||
        reviewApiData?.review_title ||
        reviewApiData?.monthly_title ||
        fallbackReviewData.title;

      const summary =
        reviewApiData?.summary ||
        reviewApiData?.review_summary ||
        reviewApiData?.monthly_summary ||
        reviewApiData?.message ||
        fallbackReviewData.summary;

      const highlight =
        reviewApiData?.highlight ||
        reviewApiData?.most_active_day_summary ||
        reviewApiData?.main_highlight ||
        fallbackReviewData.highlight;

      const insight =
        reviewApiData?.insight ||
        reviewApiData?.ai_tool_insight ||
        reviewApiData?.final_insight ||
        reviewApiData?.comment ||
        fallbackReviewData.insight;

      const timeline = normalizeTimeline(reviewApiData?.timeline);

      setReviewData({
        month: `${year}년 ${month}월 회고`,
        title,
        totalQuestions,
        activeDays,
        maxQuestions,
        summary,
        highlight,
        insight,
        timeline,
      });
    } catch (error: any) {
      console.log('월간회고 불러오기 실패:', error);
      setNoticeMessage(error?.message || '월간 회고 정보를 불러오지 못했습니다.');
      setReviewData({
        ...fallbackReviewData,
        month: `${year}년 ${month}월 회고`,
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMonthlyReview();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.header}>
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.replace('/(tabs)/my')}
>
            <Ionicons name="arrow-back" size={21} color="#6b7280" />
        </Pressable>

            <Text style={styles.headerTitle}>월간 회고</Text>

            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{month}월</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2d6a4f" />
              <Text style={styles.loadingText}>월간 회고를 불러오는 중이에요...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{reviewData.totalQuestions}</Text>
                  <Text style={styles.statLabel}>총 질문</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{reviewData.activeDays}</Text>
                  <Text style={styles.statLabel}>활동일</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{reviewData.maxQuestions}</Text>
                  <Text style={styles.statLabel}>최다 질문</Text>
                </View>
              </View>

              <View style={styles.reviewCard}>
                <Text style={styles.monthText}>{reviewData.month}</Text>
                <Text style={styles.reviewTitle}>{reviewData.title}</Text>

                <Text style={styles.reviewBody}>{reviewData.summary}</Text>

                <View style={styles.highlightBox}>
                  <Text style={styles.highlightText}>{reviewData.highlight}</Text>
                </View>

                <Text style={styles.reviewBody}>{reviewData.insight}</Text>
              </View>

              <View style={styles.timelineCard}>
                <Text style={styles.sectionLabel}>이달의 질문 흐름</Text>

                <View style={styles.timeline}>
                  {reviewData.timeline.map((item, index) => (
                    <View key={`${item.week}-${index}`} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      {index !== reviewData.timeline.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}

                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineWeek}>{item.week}</Text>
                        <Text style={styles.timelineText}>
                          <Text style={styles.timelineBold}>{item.bold}</Text>
                          {item.text.includes(item.bold)
                            ? item.text.replace(item.bold, '')
                            : ` ${item.text}`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noticeCard}>
                <Ionicons name="information-circle-outline" size={18} color="#2d6a4f" />
                <Text style={styles.noticeText}>
                  {noticeMessage ||
                    '월별 질문 기록과 카테고리 흐름을 기반으로 생성된 회고입니다.'}
                </Text>
              </View>
            </ScrollView>
          )}
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

  header: {
    height: 92,
    paddingTop: 34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
    backgroundColor: '#ffffff',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a18',
  },

  monthBadge: {
    marginLeft: 'auto',
    backgroundColor: '#e8f5ee',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },

  monthBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1a4a35',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 12,
    paddingBottom: 40,
  },

  statGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },

  statItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e6e0',
  },

  statNumber: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1a1a18',
    lineHeight: 24,
  },

  statLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },

  reviewCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  monthText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  reviewTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a18',
    lineHeight: 21,
    marginBottom: 9,
  },

  reviewBody: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 20,
  },

  highlightBox: {
    backgroundColor: '#e8f5ee',
    borderLeftWidth: 3,
    borderLeftColor: '#2d6a4f',
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: 11,
  },

  highlightText: {
    fontSize: 12,
    color: '#1a4a35',
    fontWeight: '800',
    lineHeight: 19,
  },

  timelineCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  timeline: {
    paddingLeft: 4,
  },

  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 16,
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e8f5ee',
    borderWidth: 2,
    borderColor: '#2d6a4f',
    marginTop: 4,
    zIndex: 2,
  },

  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 14,
    bottom: 0,
    width: 2,
    backgroundColor: '#e8e6e0',
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },

  timelineWeek: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '900',
    marginBottom: 3,
  },

  timelineText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },

  timelineBold: {
    color: '#1a1a18',
    fontWeight: '900',
  },

  noticeCard: {
    backgroundColor: '#e8f5ee',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },

  noticeText: {
    flex: 1,
    fontSize: 11,
    color: '#1a4a35',
    lineHeight: 17,
    fontWeight: '600',
  },
});