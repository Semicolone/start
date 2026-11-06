/**
 * FLOW Home — 2026-11-06 API integration
 * GET /api/home: user name, category distribution, recent insights
 * GET /api/home/review_queue: real review queue, progress and review streak
 * POST /api/insights/{id}/review: save answer and schedule the next review
 * No mock reviews or local review progress. Push tokens use existing
 * lib/notifications.ts (the backend schedules actual reminders).
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiCall, { homeApi } from '../../lib/client';
import { registerPushNotifications } from '../../lib/notifications';

const logoLeaf = require('../../assets/images/logo_leaf.png');

const C = {
  bg: '#F7F6F2',
  paper: '#FFFFFF',
  forest: '#195C3E',
  forestDark: '#134F35',
  forestLight: '#E8F1E8',
  forestMuted: '#7EAC92',
  ink: '#242623',
  muted: '#8D938D',
  line: '#E7E9E3',
  purple: '#9C8AC5',
  rose: '#C78694',
  sage: '#83AC91',
};

type ReviewChoice = 'forgot' | 'unsure' | 'remember';
type ReviewOutcome = '전혀기억안남' | '헷갈림' | '기억남';
type ReviewState = 'empty' | 'complete' | 'in_progress';

type ReviewItem = {
  id: number;
  question: string;
  category: string;
  savedLabel: string;
  bullets: string[];
};

type CategoryItem = {
  name: string;
  percentage: number;
  color: string;
};

type RecentInsight = {
  id: number | null;
  question: string;
  bullets: string[];
};

type ReviewProgress = { completed: number; total: number };

const OUTCOME_BY_CHOICE: Record<ReviewChoice, ReviewOutcome> = {
  forgot: '전혀기억안남',
  unsure: '헷갈림',
  remember: '기억남',
};

function formatSavedLabel(createdAt?: string): string {
  if (!createdAt) return '저장된 인사이트';
  const parsed = new Date(createdAt.endsWith('Z') || /[+-]\d\d:\d\d$/.test(createdAt) ? createdAt : createdAt + 'Z');
  if (!Number.isFinite(parsed.getTime())) return '저장된 인사이트';
  const days = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000));
  if (days === 0) return '오늘 저장';
  return `${days}일 전 저장`;
}

function toBulletList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((s): s is string => typeof s === 'string' && Boolean(s.trim())).map((s) => s.trim())
    : [];
}

function categoryColor(name: string, index: number): string {
  if (/학습|공부|학교|교육/.test(name)) return C.forest;
  if (/진로|커리어|취업/.test(name)) return C.purple;
  if (/감정|고민|관계/.test(name)) return C.rose;
  if (/개발|코딩/.test(name)) return '#5B9C88';
  return [C.sage, '#B7A789', '#8D9AA7', '#ABB797'][index % 4];
}

function summaryBullets(text?: string): string[] {
  if (!text || !text.trim()) return ['요약된 내용을 확인해 보세요.'];
  return text
    .replace(/^[\s\-•·]+/gm, '')
    .split(/\n+|\s*•\s*|\s*·\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function ProgressCard({ completed, total }: { completed: number; total: number }) {
  const ratio = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  return (
    <View style={styles.progressCard}>
      <View style={styles.decorCircle} />
      <View style={styles.progressHeadingRow}>
        <Text style={styles.progressEyebrow}>오늘의 복습</Text>
      </View>
      {total > 0 ? (
        <>
          <View style={styles.progressCountRow}>
            <Text style={styles.progressCount}>{completed}</Text>
            <Text style={styles.progressCountSmall}>/ {total}개 완료</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${ratio}%` }]} />
          </View>
          {completed === total && <Text style={styles.progressDone}>🎉 오늘 복습 끝!</Text>}
        </>
      ) : (
        <>
          <Text style={styles.noReviewLarge}>복습할 게 없어요</Text>
          <Text style={styles.noReviewCaption}>인사이트를 쌓으면 복습이 시작돼요</Text>
        </>
      )}
    </View>
  );
}

function ReviewEmpty({ completed }: { completed: boolean }) {
  return (
    <View style={styles.emptyReviewCard}>
      <View style={styles.emptySymbol}>
        {completed ? <Ionicons name="checkmark" size={34} color={C.forest} /> : <Text style={styles.coffee}>☕</Text>}
      </View>
      <Text style={styles.emptyTitle}>
        {completed ? '오늘 복습을 모두 완료했어요' : '오늘은 복습할 게 없어요'}
      </Text>
      <Text style={styles.emptyDescription}>
        {completed
          ? '다음 복습은 내일 확인해 보세요.\n그 사이 새로운 인사이트를 쌓아보세요.'
          : '저장한 지 며칠 지난 인사이트가 생기면\n복습 알림으로 알려드려요.'}
      </Text>
    </View>
  );
}

function ReviewCard({
  review, choice, remaining, submitting, error, onChoose, onNext,
}: {
  review: ReviewItem;
  choice?: ReviewChoice;
  remaining: number;
  submitting: boolean;
  error: string;
  onChoose: (choice: ReviewChoice) => void;
  onNext: () => void;
}) {
  const choices: { id: ReviewChoice; label: string; sub: string }[] = [
    { id: 'forgot', label: '전혀 기억 안 남', sub: '내일 다시' },
    { id: 'unsure', label: '헷갈림', sub: '2일 뒤 다시' },
    { id: 'remember', label: '기억남', sub: '다시 알리지 않음' },
  ];
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewMetaRow}>
        <View style={styles.categoryPill}><Text style={styles.categoryPillText}>{review.category}</Text></View>
        <Text style={styles.savedLabel}>{review.savedLabel}</Text>
      </View>
      <Text style={styles.reviewQuestion}>{review.question}</Text>
      <View style={styles.optionsRow}>
        {choices.map((item) => (
          <View key={item.id} style={styles.optionWrapper}>
            <Pressable
              onPress={() => onChoose(item.id)}
              disabled={submitting || Boolean(choice)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={[styles.optionButton, choice === item.id && styles.optionButtonActive]}
            >
              <Text style={[styles.optionText, choice === item.id && styles.optionTextActive]}>
                {item.label}
              </Text>
            </Pressable>
            <Text style={[styles.optionSub, choice === item.id && styles.optionSubActive]}>{item.sub}</Text>
          </View>
        ))}
      </View>
      {submitting ? <ActivityIndicator size="small" color={C.forest} style={{ marginTop: 12 }} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {choice ? (
        <>
          {choice !== 'remember' && (
            <View style={styles.bulletBox}>
              <Text style={styles.bulletTitle}>📝 개조식 요약</Text>
              {(review.bullets.length ? review.bullets : ['이전 기록에는 개조식 요약이 없습니다.']).map((line, i) => (
                <Text key={`${i}-${line}`} style={styles.bulletText}>•  {line}</Text>
              ))}
            </View>
          )}
          <Text style={styles.schedulingNote}>
            {choice === 'forgot'
              ? '🔔 내일 다시 볼 항목으로 저장했어요'
              : choice === 'unsure'
              ? '🔔 2일 뒤 다시 볼 항목으로 저장했어요'
              : '✅ 이 인사이트의 복습이 종료됐어요'}
          </Text>
          <Pressable style={styles.nextReviewButton} onPress={onNext} accessibilityRole="button">
            <Text style={styles.nextReviewButtonText}>
              {remaining > 1 ? `다음 복습 (${remaining - 1}개 남음) →` : '오늘 복습 완료 보기 →'}
            </Text>
          </Pressable>

        </>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const [username, setUsername] = useState('사용자');
  const [streak, setStreak] = useState(0);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recent, setRecent] = useState<RecentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress>({ completed: 0, total: 0 });
  const [reviewState, setReviewState] = useState<ReviewState>('empty');
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<ReviewChoice | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const submittingLock = useRef(false);

  // 로그인 직후뿐 아니라 기존 로그인 세션으로 홈에 진입한 경우에도
  // 기존 푸시 토큰 등록 로직을 사용합니다. 웹에서는 아무 작업도 하지 않습니다.
  useEffect(() => {
    if (Platform.OS !== 'web') void registerPushNotifications();
  }, []);

  const fetchHome = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data: any = await homeApi.getHome();
      const greeting: string = typeof data?.greeting === 'string' ? data.greeting : '';
      const nameFromGreeting = greeting.match(/^(.+?)님[,\s]/)?.[1];
      setUsername(data?.username || data?.name || data?.user?.username || data?.user?.name || nameFromGreeting || '사용자');

      const rawCategories = Array.isArray(data?.category_distribution) ? data.category_distribution : [];
      setCategories(rawCategories.map((item: any, index: number) => ({
        name: String(item?.name || '기타'),
        percentage: Number(item?.percent ?? 0),
        color: categoryColor(String(item?.name || '기타'), index),
      })).filter((item: CategoryItem) => item.percentage > 0)
         .sort((a: CategoryItem, b: CategoryItem) => b.percentage - a.percentage).slice(0, 4));

      const rawRecent = Array.isArray(data?.recent_insights) ? data.recent_insights : [];
      setRecent(rawRecent.slice(0, 2).map((item: any) => ({
        id: typeof item?.id === 'number' ? item.id : null,
        question: item?.question_summary || item?.question_original || '저장된 인사이트',
        bullets: summaryBullets(item?.answer_summary || item?.answer_original || item?.answer),
      })));
    } catch (error: any) {
      setLoadError(error?.message || '홈 데이터를 불러오지 못했어요.');
      setCategories([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviewQueue = useCallback(async (showLoader = true) => {
    if (showLoader) setReviewLoading(true);
    try {
      setReviewError('');
      const data: any = await apiCall('GET', '/api/home/review_queue');
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const progress = data?.progress;
      setReviewItems(rawItems.map((item: any) => ({
        id: Number(item.id),
        question: item?.question_summary || item?.question_original || '저장된 질문',
        category: item?.category_name || '기타',
        savedLabel: formatSavedLabel(item?.created_at),
        bullets: toBulletList(item?.bullet_summary),
      })).filter((item: ReviewItem) => Number.isInteger(item.id) && item.id > 0));
      setReviewProgress({
        completed: Math.max(0, Number(progress?.completed || 0)),
        total: Math.max(0, Number(progress?.total || 0)),
      });
      setReviewState(data?.state === 'complete' ? 'complete' : data?.state === 'in_progress' ? 'in_progress' : 'empty');
      setStreak(Math.max(0, Number(data?.current_streak || 0)));
      setSelectedChoice(undefined);
    } catch (error: any) {
      setReviewError(error?.message || '복습 목록을 불러오지 못했어요.');
      if (showLoader) {
        setReviewItems([]);
        setReviewProgress({ completed: 0, total: 0 });
      }
    } finally {
      if (showLoader) setReviewLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void fetchHome();
    void fetchReviewQueue();
  }, [fetchHome, fetchReviewQueue]));

  const activeReview = reviewItems[0] ?? null;
  const remaining = reviewItems.length;

  // 복습 결과 버튼을 누르면 즉시 서버에 저장합니다.
  // 성공해야 선택 상태와 진행률을 바꿔, 중복 제출이나 가짜 진행을 방지합니다.
  const submitReview = async (choice: ReviewChoice) => {
    if (!activeReview || selectedChoice || submittingLock.current) return;
    submittingLock.current = true;
    setSubmitting(true);
    setReviewError('');
    try {
      const result: any = await apiCall('POST', `/api/insights/${activeReview.id}/review`, {
        body: { outcome: OUTCOME_BY_CHOICE[choice] },
      });
      // 다음 버튼을 누르기 전까지는 현재 카드를 그대로 보여 줍니다.
      setSelectedChoice(choice);
      setReviewProgress((previous) => ({
        ...previous,
        completed: Math.min(previous.total, previous.completed + 1),
      }));
      if (Number.isFinite(Number(result?.current_streak))) {
        setStreak(Math.max(0, Number(result.current_streak)));
      }
    } catch (error: any) {
      setReviewError(error?.message || '복습 결과 저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      submittingLock.current = false;
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (!selectedChoice || submittingLock.current) return;
    // 기록은 이미 서버에 저장되었으므로, 큐를 다시 읽어 다음 항목을 보여 줍니다.
    setSelectedChoice(undefined);
    void fetchReviewQueue();
  };

  const categoriesTotal = categories.reduce((sum, c) => sum + c.percentage, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 탐색 화면과 동일한 모바일 폭/중앙 정렬 레이아웃 */}
      <View style={styles.outer}>
        <View style={styles.phone}>
          <View style={styles.brandHeader}>
            <Image source={logoLeaf} style={styles.brandLeaf} resizeMode="contain" />
            <Text style={styles.brandWord}>FLOW</Text>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.greeting} numberOfLines={1}>안녕하세요, {username}님 👋</Text>
            <Text style={styles.introCaption}>오늘도 배운 걸 내 것으로 만들어봐요</Text>
          </View>
          {streak > 0 ? <View style={styles.streakPill}><Text style={styles.streakText}>🔥 {streak}일 연속</Text></View> : null}
        </View>

        {!reviewLoading && !(reviewError && reviewItems.length === 0) ? (
          <ProgressCard completed={reviewProgress.completed} total={reviewProgress.total} />
        ) : null}

        {reviewLoading ? (
          <View style={styles.emptyReviewCard}><ActivityIndicator color={C.forest} /></View>
        ) : reviewError && reviewItems.length === 0 ? (
          <View style={styles.emptyReviewCard}>
            <Text style={styles.emptyTitle}>복습 목록을 불러오지 못했어요</Text>
            <Text style={styles.errorText}>{reviewError}</Text>
            <Pressable onPress={() => { void fetchReviewQueue(); }}><Text style={styles.viewAll}>다시 시도 →</Text></Pressable>
          </View>
        ) : activeReview ? (
          <ReviewCard
            review={activeReview}
            choice={selectedChoice}
            remaining={remaining}
            submitting={submitting}
            error={reviewError}
            onChoose={(choice) => { void submitReview(choice); }}
            onNext={goNext}
          />
        ) : (
          <ReviewEmpty completed={reviewState === 'complete'} />
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>무엇을 공부했나요</Text>
            <Text style={styles.sectionHint}>전체 기록</Text>
          </View>
          {categories.length > 0 && categoriesTotal > 0 ? (
            <>
              <View style={styles.segmentBar}>
                {categories.map((item) => (
                  <View key={item.name} style={{ flex: item.percentage, backgroundColor: item.color }} />
                ))}
              </View>
              <View style={styles.legendWrap}>
                {categories.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.name} {Math.round(item.percentage)}%</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>아직 저장된 주제 통계가 없어요.</Text>
          )}
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>최근 인사이트</Text>
          <Pressable onPress={() => router.push('/recent')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.viewAll}>전체 보기 →</Text>
          </Pressable>
        </View>
        {recent.length ? recent.map((item, idx) => (
          <View key={item.id == null ? `recent-${idx}` : String(item.id)} style={styles.recentCard}>
            <View style={styles.recentHeadingRow}>
              <Text style={styles.recentQuestion} numberOfLines={2}>{item.question}</Text>
            </View>
            {(item.bullets.length ? item.bullets.slice(0, 2) : ['개조식 요약이 없는 이전 인사이트입니다.']).map((bullet, i) => (
              <View style={styles.recentBulletRow} key={`${i}-${bullet}`}>
                <Text style={styles.recentBulletSymbol}>•</Text>
                <Text style={styles.recentBulletText} numberOfLines={2}>{bullet}</Text>
              </View>
            ))}
          </View>
        )) : (
          <View style={styles.recentCard}>
            <Text style={styles.noDataText}>최근 인사이트가 없어요. 아래 + 버튼으로 추가해 보세요.</Text>
          </View>
        )}

        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {loading ? <ActivityIndicator size="small" color={C.forest} style={{ marginVertical: 8 }} /> : null}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAE5DA' },
  outer: { flex: 1, alignItems: 'center', backgroundColor: '#EAE5DA' },
  phone: {
    width: '100%',
    maxWidth: 360, // app/(tabs)/explore.tsx 의 phone과 동일
    flex: 1,
    backgroundColor: C.bg,
  },
  brandHeader: { height: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.bg },
  brandLeaf: { width: 22, height: 22 },
  brandWord: { color: C.forest, fontSize: 17, fontWeight: '900', letterSpacing: 3.0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 36 },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  introCopy: { flex: 1, minWidth: 0, paddingRight: 6 },
  greeting: { fontSize: 20, color: C.ink, fontWeight: '900', letterSpacing: -0.8 },
  introCaption: { fontSize: 11.5, color: C.muted, marginTop: 4, fontWeight: '500' },
  streakPill: { backgroundColor: '#E8F1E8', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  streakText: { fontSize: 10, fontWeight: '800', color: C.forest },
  progressCard: { minHeight: 120, borderRadius: 23, backgroundColor: C.forest, padding: 19, overflow: 'hidden', marginBottom: 14 },
  decorCircle: { position: 'absolute', width: 170, height: 170, borderRadius: 100, right: -38, top: -56, backgroundColor: 'rgba(255,255,255,0.065)' },
  progressHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressEyebrow: { color: '#B9D3C4', fontSize: 12, fontWeight: '600' },
  progressCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 9, marginBottom: 10 },
  progressCount: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1.4 },
  progressCountSmall: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  progressTrack: { width: '100%', height: 8, backgroundColor: '#598D73', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#FFFFFF', borderRadius: 99 },
  progressDone: { color: '#D8EDE0', fontWeight: '800', marginTop: 11, fontSize: 12 },
  noReviewLarge: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 15 },
  noReviewCaption: { color: '#D8E9DE', fontSize: 12, marginTop: 9 },
  reviewCard: { backgroundColor: C.paper, borderColor: C.forest, borderWidth: 1.2, borderRadius: 22, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 15, marginBottom: 14 },
  reviewMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: { backgroundColor: C.forest, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  categoryPillText: { color: 'white', fontSize: 11, fontWeight: '800' },
  savedLabel: { color: C.muted, fontSize: 11 },
  reviewQuestion: { color: C.ink, fontWeight: '900', fontSize: 16.5, marginTop: 12, marginBottom: 15, lineHeight: 24 },
  optionsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  optionWrapper: { flex: 1 },
  optionButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  optionButtonActive: { backgroundColor: C.forest, borderColor: C.forest },
  optionText: { fontSize: 11.2, fontWeight: '900', color: C.ink, textAlign: 'center' },
  optionTextActive: { color: C.paper },
  optionSub: { textAlign: 'center', color: C.muted, fontSize: 10, marginTop: 7 },
  optionSubActive: { color: C.forest, fontWeight: '900' },
  bulletBox: { backgroundColor: '#E9F1E9', borderRadius: 14, marginTop: 18, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 10 },
  bulletTitle: { fontSize: 12.2, fontWeight: '900', color: C.forest, marginBottom: 9 },
  bulletText: { fontSize: 12, lineHeight: 19, color: '#383E39', marginBottom: 3 },
  schedulingNote: { textAlign: 'center', fontSize: 11.5, color: C.forest, fontWeight: '800', marginTop: 14, marginBottom: 11 },
  nextReviewButton: { height: 46, backgroundColor: C.forest, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  nextReviewButtonText: { fontSize: 13, color: C.paper, fontWeight: '900' },
  localNote: { textAlign: 'center', fontSize: 9.4, color: C.muted, lineHeight: 15, marginTop: 8 },
  emptyReviewCard: { minHeight: 188, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 23, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptySymbol: { width: 67, height: 67, backgroundColor: '#E8F1E9', borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  coffee: { fontSize: 26 },
  emptyTitle: { fontSize: 19, fontWeight: '900', color: C.ink, marginBottom: 8, textAlign: 'center' },
  emptyDescription: { fontSize: 12, lineHeight: 19, textAlign: 'center', color: C.muted },
  sectionCard: { backgroundColor: C.paper, borderColor: C.line, borderWidth: 1, borderRadius: 21, padding: 16, marginBottom: 15 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: C.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  sectionHint: { color: C.muted, fontSize: 11 },
  segmentBar: { flexDirection: 'row', width: '100%', height: 11, borderRadius: 8, overflow: 'hidden' },
  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 99 },
  legendLabel: { fontSize: 10.8, color: '#525A54', fontWeight: '600' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1, marginBottom: 11, paddingHorizontal: 2 },
  recentTitle: { fontSize: 17, fontWeight: '900', color: C.ink },
  viewAll: { color: C.forest, fontSize: 11.5, fontWeight: '800' },
  recentCard: { backgroundColor: C.paper, borderColor: C.line, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  recentHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 9, gap: 6 },
  recentQuestion: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '900', color: C.ink },
  editArea: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3 },
  editText: { fontSize: 11, color: C.muted },
  recentBulletRow: { flexDirection: 'row', marginVertical: 2, paddingRight: 4 },
  recentBulletSymbol: { color: C.forest, fontSize: 13, fontWeight: '900', width: 15 },
  recentBulletText: { flex: 1, color: '#5A635C', fontSize: 11.8, lineHeight: 18 },
  noDataText: { color: C.muted, fontSize: 12, lineHeight: 20 },
  errorText: { marginTop: 8, fontSize: 11, color: '#BE5262', textAlign: 'center' },
});
