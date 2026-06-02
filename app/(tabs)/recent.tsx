import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { categoryApi, homeApi, insightApi } from '../../lib/client';

const chatgptMark = require('../../assets/images/chatgpt-mark.png');
const claudeMark = require('../../assets/images/claude-mark.png');
const geminiMark = require('../../assets/images/gemini-mark.png');

type RecentItem = {
  id?: number | string;
  category_id?: number | string | null;
  question: string;
  answer: string;
  source: string;
  date: string;
  keywords: string[];
  category_name?: string;
};

type DetailItem = {
  id?: number | string;
  category_id?: number | string | null;
  ai_source: string;
  category_name?: string;
  question_original?: string;
  answer_original?: string;
  question_summary?: string;
  answer_summary?: string;
  keywords?: string[];
  created_at?: string;
};

function getSourceStyle(source: string) {
  const lower = source.toLowerCase();

  if (lower.includes('claude')) {
    return {
      bg: '#FBF5EE',
      color: '#9A623B',
      icon: claudeMark,
    };
  }

  if (lower.includes('gemini')) {
    return {
      bg: '#F3F4FF',
      color: '#5F6FD9',
      icon: geminiMark,
    };
  }

  return {
    bg: '#EEF7ED',
    color: '#1F7A4D',
    icon: chatgptMark,
  };
}

function formatDate(raw?: string) {
  if (!raw) return '';

  if (raw.includes('T')) return raw.slice(0, 10).replaceAll('-', '.');
  if (raw.includes('-')) return raw.slice(0, 10).replaceAll('-', '.');

  return raw;
}

function mapInsight(item: any): RecentItem {
  return {
    id: item?.id ?? item?.insight_id ?? item?.insightId,

    category_id:
      item?.category_id ??
      item?.categoryId ??
      item?.category?.id ??
      null,

    source: item?.ai_source || item?.source || 'ChatGPT',

    category_name:
      item?.category_name ||
      item?.category ||
      item?.categoryName ||
      item?.category?.name ||
      '기타',

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

    date: formatDate(item?.created_at || item?.date),

    keywords:
      Array.isArray(item?.keywords) && item.keywords.length > 0
        ? item.keywords
        : ['AI 요약', '인사이트', '질문 기록'],
  };
}

function normalizeDetail(data: any): DetailItem {
  const target = data?.insight || data?.data || data;

  return {
    id: target?.id ?? target?.insight_id ?? target?.insightId,

    category_id:
      target?.category_id ??
      target?.categoryId ??
      target?.category?.id ??
      null,

    ai_source:
      target?.ai_source ||
      target?.source ||
      'ChatGPT',

    category_name:
      target?.category_name ||
      target?.category ||
      target?.categoryName ||
      target?.category?.name ||
      '기타',

    question_original:
      target?.question_original ||
      target?.questionOriginal ||
      target?.question ||
      '',

    answer_original:
      target?.answer_original ||
      target?.answerOriginal ||
      target?.answer ||
      '',

    question_summary:
      target?.question_summary ||
      target?.questionSummary ||
      '',

    answer_summary:
      target?.answer_summary ||
      target?.answerSummary ||
      '',

    keywords: Array.isArray(target?.keywords) ? target.keywords : [],

    created_at: target?.created_at || target?.date,
  };
}

export default function RecentScreen() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecentItem | null>(null);

  const [menuTargetId, setMenuTargetId] = useState<string | number | null>(null);
  const [menuTarget, setMenuTarget] = useState<RecentItem | null>(null);

  const [detailTarget, setDetailTarget] = useState<DetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const fetchRecent = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      let data: any = null;

      try {
        data = await homeApi.getRecentInsights();
      } catch {
        data = await homeApi.getHome();
      }

      const list =
        data?.recent_insights ||
        data?.insights ||
        data?.items ||
        [];

      setItems(Array.isArray(list) ? list.map(mapInsight) : []);
    } catch (error) {
      console.log('최근 질문 목록 불러오기 실패:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryNameById = async (categoryId?: number | string | null) => {
    if (!categoryId) return '기타';

    try {
      const data = await categoryApi.getList();

      const list = Array.isArray(data)
        ? data
        : data?.categories || data?.items || data?.data || [];

      const found = list.find(
        (category: any) =>
          String(category?.id ?? category?.category_id) === String(categoryId)
      );

      return (
        found?.name ||
        found?.category_name ||
        found?.category ||
        '기타'
      );
    } catch (error) {
      console.log('카테고리명 조회 실패:', error);
      return '기타';
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecent();
    }, [])
  );

  const openDeleteModal = (item: RecentItem) => {
    if (!item.id) {
      setErrorMessage('질문 ID가 없어 삭제할 수 없어요.');
      return;
    }

    setErrorMessage('');
    setMenuTargetId(null);
    setMenuTarget(null);
    setDeleteTarget(item);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) {
      setErrorMessage('질문 ID가 없어 삭제할 수 없어요.');
      setDeleteTarget(null);
      return;
    }

    try {
      setDeletingId(deleteTarget.id);
      setErrorMessage('');

      await insightApi.delete(deleteTarget.id);

      setItems((prev) =>
        prev.filter((target) => target.id !== deleteTarget.id)
      );

      setDeleteTarget(null);
    } catch (error: any) {
      setErrorMessage(error?.message || '질문 삭제에 실패했습니다.');
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleMenu = (item: RecentItem) => {
    if (!item.id) {
      setErrorMessage('질문 ID가 없어 상세보기를 열 수 없어요.');
      return;
    }

    setErrorMessage('');

    if (menuTargetId === item.id) {
      setMenuTargetId(null);
      setMenuTarget(null);
    } else {
      setMenuTargetId(item.id);
      setMenuTarget(item);
    }
  };

  const openDetail = async () => {
    if (!menuTarget?.id) {
      setErrorMessage('질문 ID가 없어 상세보기를 열 수 없어요.');
      setMenuTargetId(null);
      setMenuTarget(null);
      return;
    }

    try {
      setDetailLoading(true);
      setErrorMessage('');

      const data = await insightApi.getOne(menuTarget.id);
      const normalized = normalizeDetail(data);

      const categoryNameFromDetail =
        normalized.category_name && normalized.category_name !== '기타'
          ? normalized.category_name
          : null;

      const categoryNameFromList =
        menuTarget.category_name && menuTarget.category_name !== '기타'
          ? menuTarget.category_name
          : null;

      const categoryNameFromId = await getCategoryNameById(
        normalized.category_id || menuTarget.category_id
      );

      setMenuTargetId(null);
      setMenuTarget(null);

      setDetailTarget({
        ...normalized,
        category_id: normalized.category_id || menuTarget.category_id || null,
        category_name:
          categoryNameFromDetail ||
          categoryNameFromList ||
          categoryNameFromId ||
          '기타',
      });
    } catch (error: any) {
      console.log('상세보기 실패:', error);
      setErrorMessage(error?.message || '상세 정보를 불러오지 못했습니다.');
      setMenuTargetId(null);
      setMenuTarget(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/home')}>
            <Ionicons name="arrow-back" size={25} color="#1F5F3F" />
          </Pressable>

          <Text style={styles.headerTitle}>최근 질문 전체보기</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>
            전체 <Text style={styles.countStrong}>{items.length}개</Text>의 질문이 있어요
          </Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#1F7A4D" />
              <Text style={styles.loadingText}>질문을 불러오는 중이에요...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="leaf-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>아직 저장된 질문이 없어요</Text>
              <Text style={styles.emptySub}>+ 버튼으로 첫 질문을 저장해보세요.</Text>
            </View>
          ) : (
            items.map((item) => {
              const sourceStyle = getSourceStyle(item.source);
              const isDeleting = deletingId === item.id;
              const isMenuOpen = menuTargetId === item.id;

              return (
                <View key={`${item.id}-${item.question}`} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.sourceBadge,
                        { backgroundColor: sourceStyle.bg },
                      ]}
                    >
                      <Image
                        source={sourceStyle.icon}
                        style={styles.sourceIcon}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.sourceText,
                          { color: sourceStyle.color },
                        ]}
                      >
                        {item.source}
                      </Text>
                    </View>

                    <View style={styles.cardActionRow}>
                      <Pressable
                        style={styles.moreButton}
                        onPress={() => toggleMenu(item)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Feather name="more-horizontal" size={21} color="#9AA1AE" />
                      </Pressable>

                      <Pressable
                        style={styles.smallDeleteButton}
                        onPress={() => openDeleteModal(item)}
                        disabled={isDeleting}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#E53935" />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color="#E53935" />
                        )}
                      </Pressable>
                    </View>

                    {isMenuOpen ? (
                      <View style={styles.inlineMenuBox}>
                        <Pressable
                          style={styles.inlineMenuItem}
                          onPress={openDetail}
                          disabled={detailLoading}
                        >
                          {detailLoading ? (
                            <ActivityIndicator size="small" color="#1F7A4D" />
                          ) : (
                            <Ionicons
                              name="document-text-outline"
                              size={18}
                              color="#1F7A4D"
                            />
                          )}

                          <Text style={styles.inlineMenuText}>자세히 보기</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.questionText} numberOfLines={2}>
                    {item.question}
                  </Text>

                  <Text style={styles.answerText} numberOfLines={2}>
                    {item.answer}
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.dateText}>{item.date}</Text>

                    <View style={styles.keywordRow}>
                      {item.keywords.slice(0, 3).map((keyword, index) => (
                        <View key={`${keyword}-${index}`} style={styles.keywordChip}>
                          <Text style={styles.keywordText}>#{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal
          visible={Boolean(detailTarget)}
          transparent
          animationType="fade"
          onRequestClose={closeDetail}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalBox}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>질문 상세보기</Text>

                <Pressable style={styles.detailCloseButton} onPress={closeDetail}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailMetaRow}>
                  <View style={styles.detailSourceBadge}>
                    <Text style={styles.detailSourceText}>
                      {detailTarget?.ai_source || 'AI'}
                    </Text>
                  </View>

                  <View style={styles.detailCategoryBadge}>
                    <Text style={styles.detailCategoryText}>
                      {detailTarget?.category_name || '기타'}
                    </Text>
                  </View>

                  <Text style={styles.detailDateText}>
                    {formatDate(detailTarget?.created_at)}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>질문 원문</Text>
                <View style={styles.detailTextBox}>
                  <Text style={styles.detailText}>
                    {detailTarget?.question_original || '질문 원문이 없습니다.'}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>답변 원문</Text>
                <View style={styles.detailTextBox}>
                  <Text style={styles.detailText}>
                    {detailTarget?.answer_original || '답변 원문이 없습니다.'}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>질문 요약</Text>
                <View style={styles.detailSummaryBox}>
                  <Text style={styles.detailText}>
                    {detailTarget?.question_summary || '질문 요약이 없습니다.'}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>답변 요약</Text>
                <View style={styles.detailSummaryBox}>
                  <Text style={styles.detailText}>
                    {detailTarget?.answer_summary || '답변 요약이 없습니다.'}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>키워드</Text>
                <View style={styles.detailKeywordRow}>
                  {detailTarget?.keywords && detailTarget.keywords.length > 0 ? (
                    detailTarget.keywords.map((keyword, index) => (
                      <View key={`${keyword}-${index}`} style={styles.detailKeywordChip}>
                        <Text style={styles.detailKeywordText}>#{keyword}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.detailEmptyText}>키워드가 없습니다.</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={Boolean(deleteTarget)}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="trash-outline" size={26} color="#E53935" />
              </View>

              <Text style={styles.modalTitle}>질문을 삭제할까요?</Text>
              <Text style={styles.modalDesc}>
                삭제한 질문은 다시 복구할 수 없어요.
              </Text>

              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalCancelButton} onPress={closeDeleteModal}>
                  <Text style={styles.modalCancelText}>취소</Text>
                </Pressable>

                <Pressable style={styles.modalDeleteButton} onPress={confirmDelete}>
                  <Text style={styles.modalDeleteText}>삭제</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAE5DA',
    alignItems: 'center',
  },

  phone: {
    width: '100%',
    maxWidth: 390,
    height: '100%',
    backgroundColor: '#FCFBF8',
  },

  header: {
    height: 88,
    paddingTop: 34,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E5DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },

  headerRight: {
    width: 42,
    height: 42,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 110,
  },

  countText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  countStrong: {
    color: '#1F7A4D',
    fontWeight: '900',
  },

  errorText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  loadingBox: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },

  emptyBox: {
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    color: '#111827',
    fontWeight: '900',
  },

  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  card: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingLeft: 17,
    paddingTop: 14,
    paddingBottom: 15,
    paddingRight: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0ECE5',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    zIndex: 1,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 60,
  },

  sourceBadge: {
    height: 34,
    paddingLeft: 9,
    paddingRight: 15,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sourceIcon: {
    width: 30,
    height: 30,
    marginRight: 3,
  },

  sourceText: {
    fontSize: 15,
    fontWeight: '600',
  },

  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F4',
  },

  smallDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
  },

  inlineMenuBox: {
    position: 'absolute',
    right: 40,
    top: 39,
    width: 148,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E5DD',
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 90,
    zIndex: 90,
  },

  inlineMenuItem: {
    height: 44,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inlineMenuText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '900',
  },

  questionText: {
    marginTop: 15,
    fontSize: 17,
    color: '#111827',
    fontWeight: '900',
    lineHeight: 24,
  },

  answerText: {
    marginTop: 7,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 21,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEAE2',
    marginTop: 13,
    marginBottom: 11,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 2,
  },

  dateText: {
    fontSize: 13,
    color: '#7B8491',
    fontWeight: '800',
    marginRight: 12,
    minWidth: 78,
  },

  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },

  keywordChip: {
    backgroundColor: '#EEF7ED',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  keywordText: {
    fontSize: 12,
    color: '#1F6B45',
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  detailModalBox: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  detailHeader: {
    height: 58,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E5DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detailTitle: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '900',
  },

  detailCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F4',
  },

  detailScroll: {
    maxHeight: 560,
  },

  detailContent: {
    padding: 16,
    paddingBottom: 22,
  },

  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 7,
  },

  detailSourceBadge: {
    backgroundColor: '#EEF7ED',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  detailSourceText: {
    fontSize: 12,
    color: '#1F6B45',
    fontWeight: '900',
  },

  detailCategoryBadge: {
    backgroundColor: '#F2EAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  detailCategoryText: {
    fontSize: 12,
    color: '#8B6CC7',
    fontWeight: '900',
  },

  detailDateText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '900',
  },

  detailSectionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '900',
    marginBottom: 7,
    marginTop: 10,
  },

  detailTextBox: {
    backgroundColor: '#FCFBF8',
    borderWidth: 1,
    borderColor: '#E9E5DD',
    borderRadius: 13,
    padding: 12,
  },

  detailSummaryBox: {
    backgroundColor: '#EEF7ED',
    borderWidth: 1,
    borderColor: '#DCEACF',
    borderRadius: 13,
    padding: 12,
  },

  detailText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },

  detailKeywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  detailKeywordChip: {
    backgroundColor: '#EEF7ED',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  detailKeywordText: {
    fontSize: 12,
    color: '#1F6B45',
    fontWeight: '900',
  },

  detailEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '700',
  },

  modalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },

  modalDesc: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },

  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DAD5CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#374151',
  },

  modalDeleteButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalDeleteText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});