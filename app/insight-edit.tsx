/**
 * FLOW 인사이트 수정 화면
 * 위치: app/insight-edit.tsx
 * 진입: router.push({ pathname: '/insight-edit', params: { id: String(insightId) } })
 * API: GET /api/insights/{id} / PATCH /api/insights/{id}
 * PATCH 허용: question_summary, answer_summary, bullet_summary, keywords
 * 원문/AI 출처/카테고리/복습일정은 수정하지 않습니다.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoryApi, insightApi } from '../lib/client';

type InsightDetail = {
  id: number;
  category_name?: string | null;
  ai_source?: string | null;
  question_original?: string | null;
  answer_original?: string | null;
  created_at?: string | null;
};

type UpdatePayload = {
  question_summary: string;
  answer_summary: string;
  bullet_summary: string[];
  keywords: string[];
};

const C = {
  backdrop: '#EAE5DA',
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#195C3E',
  greenSoft: '#EAF3EA',
  greenLine: '#CDE2D3',
  ink: '#262925',
  secondary: '#767E77',
  border: '#E7E8E2',
  red: '#B65559',
};

function makePayload(
  question: string,
  answer: string,
  bulletLines: string[],
  keywordItems: string[],
): UpdatePayload {
  return {
    question_summary: question.trim(),
    answer_summary: answer.trim(),
    bullet_summary: bulletLines.map((line) => line.trim()).filter(Boolean),
    keywords: keywordItems.map((tag) => tag.trim()).filter(Boolean),
  };
}

function formatDate(value?: string | null): string {
  return value ? value.slice(0, 10).replace(/-/g, '.') : '';
}

export default function InsightEditScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const insightId = Number(rawId);
  const validId = Number.isInteger(insightId) && insightId > 0;

  const [detail, setDetail] = useState<InsightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [retry, setRetry] = useState(0);

  const [questionSummary, setQuestionSummary] = useState('');
  const [answerSummary, setAnswerSummary] = useState('');
  const [bulletLines, setBulletLines] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [originalExpanded, setOriginalExpanded] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [initialPayload, setInitialPayload] = useState('');

  useEffect(() => {
    let active = true;
    const loadInsight = async () => {
      setLoading(true);
      setLoadError('');
      try {
        if (!validId) throw new Error('올바른 인사이트 번호가 없어요.');
        const response = await insightApi.getOne(insightId);
        const data = response?.insight ?? response?.data ?? response;
        if (!data || data?.id == null) throw new Error('인사이트를 찾을 수 없어요.');
        const nextQuestion = String(data.question_summary ?? '');
        const nextAnswer = String(data.answer_summary ?? '');
        const nextBullets = Array.isArray(data.bullet_summary)
          ? data.bullet_summary.filter((x: unknown): x is string => typeof x === 'string')
          : [];
        const nextKeywords = Array.isArray(data.keywords)
          ? data.keywords.filter((x: unknown): x is string => typeof x === 'string')
          : [];
        // GET /api/insights/{id}는 category_name이 null일 수 있으므로
        // 실제 사용자의 category_id에 맞춰 기존 카테고리 API에서 이름을 조회해요.
        let categoryName: string | null = data.category_name ?? null;
        if (!categoryName && data.category_id != null) {
          try {
            const categoriesData = await categoryApi.getList();
            const categories = Array.isArray(categoriesData)
              ? categoriesData
              : (categoriesData?.categories ?? []);
            const matched = categories.find((c: any) => Number(c.id) === Number(data.category_id));
            categoryName = matched?.name ?? null;
          } catch {
            categoryName = null;
          }
        }
        if (!active) return;
        setDetail({
          id: Number(data.id),
          category_name: categoryName,
          ai_source: data.ai_source,
          question_original: data.question_original,
          answer_original: data.answer_original,
          created_at: data.created_at,
        });
        setQuestionSummary(nextQuestion);
        setAnswerSummary(nextAnswer);
        setBulletLines(nextBullets);
        setKeywords(nextKeywords);
        setNewKeyword('');
        setInitialPayload(JSON.stringify(makePayload(nextQuestion, nextAnswer, nextBullets, nextKeywords)));
      } catch (error: any) {
        if (active) setLoadError(error?.message || '인사이트를 불러오지 못했어요.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInsight();
    return () => { active = false; };
  }, [insightId, validId, retry]);

  const payload = useMemo(
    () => makePayload(questionSummary, answerSummary, bulletLines, keywords),
    [questionSummary, answerSummary, bulletLines, keywords],
  );
  const isChanged = detail !== null && JSON.stringify(payload) !== initialPayload;

  const back = () => {
    if (saving) return;
    if (isChanged) setShowDiscardModal(true);
    else router.back();
  };

  const updateBullet = (index: number, text: string) => {
    setBulletLines((previous) => previous.map((item, i) => i === index ? text : item));
    setSaveError('');
  };

  const addKeyword = () => {
    const keyword = newKeyword.trim().replace(/^#+/, '').trim();
    if (!keyword) return;
    if (keyword.length > 40) {
      setSaveError('키워드는 40자 이내로 입력해 주세요.');
      return;
    }
    if (keywords.includes(keyword)) {
      setNewKeyword('');
      return;
    }
    if (keywords.length >= 15) {
      setSaveError('키워드는 최대 15개까지 추가할 수 있어요.');
      return;
    }
    setKeywords((prev) => [...prev, keyword]);
    setNewKeyword('');
    setSaveError('');
  };

  const save = async () => {
    if (saving || !detail || !isChanged) return;
    if (bulletLines.some((line) => line.length > 500)) {
      setSaveError('개조식 요약은 항목당 500자 이내로 입력해 주세요.');
      return;
    }
    try {
      setSaving(true);
      setSaveError('');
      // 백엔드 InsightUpdateRequest에서 허용한 필드 4개만 전송합니다.
      await insightApi.update(detail.id, payload);
      setInitialPayload(JSON.stringify(payload));
      // 기존 목록은 useFocusEffect로 최신 내용을 다시 가져옵니다.
      router.back();
    } catch (error: any) {
      setSaveError(error?.message || '저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.avoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.outer}>
          <View style={styles.phone}>
            <View style={styles.header}>
              <Pressable onPress={back} style={styles.headerButton} accessibilityLabel="뒤로 가기">
                <Ionicons name="chevron-back" size={24} color={C.ink} />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>인사이트 수정</Text>
                <Text style={styles.headerSubtitle}>배운 내용을 나만의 언어로 다듬기</Text>
              </View>
              <View style={styles.headerButton} />
            </View>

            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={C.green} />
                <Text style={styles.stateText}>인사이트를 불러오는 중이에요...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.centerState}>
                <Ionicons name="cloud-offline-outline" size={35} color={C.secondary} />
                <Text style={styles.stateText}>{loadError}</Text>
                <Pressable style={styles.retryButton} onPress={() => setRetry((n) => n + 1)}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.content}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.introCard}>
                    <View style={styles.introTop}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{detail?.category_name || '기타'}</Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(detail?.created_at)}</Text>
                    </View>
                    <Text style={styles.readonlyTitle} numberOfLines={3}>
                      {detail?.question_original || '저장된 질문'}
                    </Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="lock-closed-outline" size={13} color={C.secondary} />
                      <Text style={styles.infoText}>원문과 카테고리는 수정할 수 없어요</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>요약 수정</Text>
                  <Text style={styles.sectionHint}>질문과 답변의 핵심 내용을 더 정확하게 정리해 보세요.</Text>
                  <View style={styles.fieldCard}>
                    <View style={styles.fieldLabelRow}>
                      <Ionicons name="help-circle-outline" size={18} color={C.green} />
                      <Text style={styles.fieldLabel}>질문 요약</Text>
                    </View>
                    <TextInput
                      style={[styles.textArea, styles.questionInput]}
                      value={questionSummary}
                      onChangeText={(value) => { setQuestionSummary(value); setSaveError(''); }}
                      placeholder="질문을 한두 문장으로 정리해 주세요"
                      placeholderTextColor="#A5AAA4"
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="질문 요약 수정"
                    />
                    <View style={styles.fieldDivider} />
                    <View style={styles.fieldLabelRow}>
                      <Ionicons name="document-text-outline" size={18} color={C.green} />
                      <Text style={styles.fieldLabel}>답변 요약 (줄글)</Text>
                    </View>
                    <TextInput
                      style={[styles.textArea, styles.answerInput]}
                      value={answerSummary}
                      onChangeText={(value) => { setAnswerSummary(value); setSaveError(''); }}
                      placeholder="답변 내용을 2~4문장으로 정리해 주세요"
                      placeholderTextColor="#A5AAA4"
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="답변 줄글 요약 수정"
                    />
                  </View>

                  <View style={styles.bulletHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="list-outline" size={21} color={C.green} />
                      <Text style={styles.sectionTitle}>개조식 요약</Text>
                      <View style={styles.countPill}>
                        <Text style={styles.countText}>{payload.bullet_summary.length}개</Text>
                      </View>
                    </View>
                    <Text style={styles.sectionHint}>복습할 때 빠르게 읽을 핵심 포인트예요.</Text>
                  </View>
                  <View style={styles.bulletCard}>
                    {bulletLines.length === 0 ? (
                      <Text style={styles.emptyBulletText}>아직 개조식 요약이 없어요. 핵심 포인트를 추가해 보세요!</Text>
                    ) : bulletLines.map((line, index) => (
                      <View key={`bullet-${index}`} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <TextInput
                          value={line}
                          onChangeText={(value) => updateBullet(index, value)}
                          placeholder={`핵심 포인트 ${index + 1}`}
                          placeholderTextColor="#A5AAA4"
                          multiline
                          style={styles.bulletInput}
                          textAlignVertical="top"
                          accessibilityLabel={`개조식 요약 ${index + 1}번`}
                        />
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => setBulletLines((previous) => previous.filter((_, i) => index !== i))}
                          accessibilityLabel={`개조식 요약 ${index + 1}번 삭제`}
                        >
                          <Ionicons name="close-circle-outline" color="#A7ADA6" size={21} />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      style={styles.addBulletButton}
                      onPress={() => {
                        if (bulletLines.length >= 10) {
                          setSaveError('개조식 요약은 최대 10개까지 추가할 수 있어요.');
                          return;
                        }
                        setBulletLines((prev) => [...prev, '']);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={19} color={C.green} />
                      <Text style={styles.addBulletText}>핵심 포인트 추가</Text>
                    </Pressable>
                  </View>

                  <View style={styles.keywordHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="pricetag-outline" size={19} color={C.green} />
                      <Text style={styles.sectionTitle}>키워드</Text>
                    </View>
                    <Text style={styles.sectionHint}>태그를 누르면 삭제할 수 있어요.</Text>
                  </View>
                  <View style={styles.keywordCard}>
                    <View style={styles.keywordWrap}>
                      {keywords.map((keyword) => (
                        <Pressable
                          key={keyword}
                          style={styles.keywordTag}
                          onPress={() => setKeywords((prev) => prev.filter((tag) => tag !== keyword))}
                          accessibilityLabel={`${keyword} 키워드 삭제`}
                        >
                          <Text style={styles.keywordTagText}>#{keyword}</Text>
                          <Ionicons name="close" color={C.green} size={13} />
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.keywordInputRow}>
                      <TextInput
                        value={newKeyword}
                        onChangeText={(value) => { setNewKeyword(value); setSaveError(''); }}
                        onSubmitEditing={addKeyword}
                        style={styles.keywordInput}
                        placeholder="키워드를 입력해 주세요"
                        placeholderTextColor="#A5AAA4"
                        returnKeyType="done"
                        accessibilityLabel="키워드 추가 입력"
                      />
                      <Pressable style={styles.keywordAddButton} onPress={addKeyword} accessibilityLabel="키워드 추가">
                        <Ionicons name="add" color={C.white} size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={styles.originalToggle}
                    onPress={() => setOriginalExpanded((prev) => !prev)}
                    accessibilityLabel="원문 보기 접기 펼치기"
                  >
                    <View style={styles.originalToggleLeft}>
                      <Ionicons name="document-outline" size={17} color={C.secondary} />
                      <Text style={styles.originalToggleText}>질문·답변 원문 보기</Text>
                    </View>
                    <Ionicons
                      name={originalExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={C.secondary}
                    />
                  </Pressable>
                  {originalExpanded ? (
                    <View style={styles.originalCard}>
                      <Text style={styles.originalLabel}>질문 원문</Text>
                      <Text selectable style={styles.originalText}>{detail?.question_original || '없음'}</Text>
                      <View style={styles.originalDivider} />
                      <Text style={styles.originalLabel}>답변 원문</Text>
                      <Text selectable style={styles.originalText}>{detail?.answer_original || '없음'}</Text>
                    </View>
                  ) : null}

                  {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
                </ScrollView>

                <View style={styles.footer}>
                  <Pressable style={styles.cancelButton} onPress={back} disabled={saving}>
                    <Text style={styles.cancelText}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveButton, (!isChanged || saving) && styles.saveDisabled]}
                    onPress={() => { void save(); }}
                    disabled={!isChanged || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={C.white} />
                    ) : (
                      <Ionicons name="checkmark" color={C.white} size={19} />
                    )}
                    <Text style={styles.saveText}>{saving ? '저장 중...' : '변경사항 저장'}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showDiscardModal} transparent animationType="fade" onRequestClose={() => setShowDiscardModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={28} color={C.green} />
            </View>
            <Text style={styles.modalTitle}>수정을 취소할까요?</Text>
            <Text style={styles.modalDescription}>저장하지 않은 변경사항은 사라져요.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBack} onPress={() => setShowDiscardModal(false)}>
                <Text style={styles.modalBackText}>계속 수정</Text>
              </Pressable>
              <Pressable style={styles.modalDiscard} onPress={() => { setShowDiscardModal(false); router.back(); }}>
                <Text style={styles.modalDiscardText}>나가기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.backdrop },
  avoiding: { flex: 1 },
  outer: { flex: 1, alignItems: 'center', backgroundColor: C.backdrop },
  phone: { width: '100%', maxWidth: 360, flex: 1, backgroundColor: C.bg },
  header: { height: 72, backgroundColor: C.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: C.ink },
  headerSubtitle: { fontSize: 10.5, color: C.secondary, fontWeight: '600' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 15 },
  stateText: { color: C.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { backgroundColor: C.green, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12 },
  retryText: { color: C.white, fontWeight: '800', fontSize: 13 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 32 },
  introCard: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 23 },
  introTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryPill: { borderRadius: 99, backgroundColor: C.greenSoft, paddingVertical: 6, paddingHorizontal: 11 },
  categoryPillText: { color: C.green, fontSize: 11, fontWeight: '800' },
  dateText: { color: C.secondary, fontSize: 11, fontWeight: '600' },
  readonlyTitle: { fontSize: 15.5, fontWeight: '900', color: C.ink, lineHeight: 23 },
  infoRow: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 13, paddingTop: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: 10.5, color: C.secondary },
  sectionTitle: { color: C.ink, fontSize: 17, fontWeight: '900' },
  sectionHint: { color: C.secondary, fontSize: 11, lineHeight: 17, marginTop: 6, marginBottom: 13 },
  fieldCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, marginBottom: 22 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '900', color: C.ink },
  fieldDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  textArea: { width: '100%', backgroundColor: '#FBFCFA', borderRadius: 12, borderWidth: 1, borderColor: '#E0E8DF', paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, lineHeight: 20, color: C.ink },
  questionInput: { minHeight: 72 },
  answerInput: { minHeight: 128 },
  bulletHeader: { marginBottom: 0 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  countPill: { backgroundColor: C.greenSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, marginLeft: 2 },
  countText: { fontSize: 10, fontWeight: '800', color: C.green },
  bulletCard: { backgroundColor: '#F1F7F0', borderWidth: 1, borderColor: C.greenLine, borderRadius: 18, padding: 13, marginBottom: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 8 },
  bulletDot: { backgroundColor: C.green, width: 7, height: 7, borderRadius: 4, marginTop: 13 },
  bulletInput: { minHeight: 36, flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: '#DDE8DD', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12.5, color: C.ink, lineHeight: 19 },
  removeButton: { paddingTop: 7, paddingLeft: 2 },
  emptyBulletText: { textAlign: 'center', color: C.secondary, fontSize: 11.5, lineHeight: 19, paddingVertical: 13 },
  addBulletButton: { height: 41, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: C.greenLine, backgroundColor: '#F9FCF9', marginTop: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  addBulletText: { color: C.green, fontSize: 12, fontWeight: '800' },
  keywordHeader: { marginBottom: 0 },
  keywordCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, marginBottom: 20 },
  keywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 },
  keywordTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, backgroundColor: C.greenSoft },
  keywordTagText: { fontSize: 11.5, color: C.green, fontWeight: '800' },
  keywordInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keywordInput: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: '#FAFBF9', paddingHorizontal: 12, height: 41, fontSize: 12.5, color: C.ink },
  keywordAddButton: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green, borderRadius: 11 },
  originalToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 14 },
  originalToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originalToggleText: { fontSize: 12, color: C.secondary, fontWeight: '700' },
  originalCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 13, padding: 14, marginTop: 8 },
  originalLabel: { fontSize: 12, color: C.green, fontWeight: '900', marginBottom: 7 },
  originalText: { fontSize: 12, color: C.secondary, lineHeight: 19 },
  originalDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  errorText: { color: C.red, fontSize: 12, lineHeight: 18, marginTop: 12, marginBottom: 8, textAlign: 'center', fontWeight: '700' },
  footer: { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, flexDirection: 'row', gap: 10 },
  cancelButton: { height: 48, width: 92, backgroundColor: C.white, borderWidth: 1, borderColor: '#DCE0D9', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, color: C.secondary, fontWeight: '800' },
  saveButton: { flex: 1, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.green },
  saveDisabled: { opacity: 0.46 },
  saveText: { color: C.white, fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20,40,30,0.36)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { maxWidth: 320, width: '100%', backgroundColor: C.white, borderRadius: 22, alignItems: 'center', padding: 22 },
  modalIcon: { backgroundColor: C.greenSoft, width: 54, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, color: C.ink, fontWeight: '900', marginBottom: 9 },
  modalDescription: { fontSize: 12, color: C.secondary, textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBack: { flex: 1, height: 45, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  modalBackText: { fontSize: 12.5, color: C.white, fontWeight: '900' },
  modalDiscard: { flex: 1, height: 45, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  modalDiscardText: { fontSize: 12.5, color: C.secondary, fontWeight: '800' },
});
