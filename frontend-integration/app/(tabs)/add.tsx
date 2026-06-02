import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { insightApi } from '../../lib/client';

const USE_MOCK_ANALYSIS = false;

const AI_SOURCES = ['ChatGPT', 'Claude', 'Gemini'];

const CATEGORY_OPTIONS = [
  '커리어/진로',
  '개발',
  '학습/공부',
  '감정/고민',
  '창작',
  '일상',
  '기타',
];

type AnalysisResult = {
  question_summary: string;
  answer_summary: string;
  keywords: string[];
};

function normalizeAnalysisResult(data: any): AnalysisResult {
  return {
    question_summary:
      data?.question_summary ||
      data?.questionSummary ||
      data?.summary_question ||
      '질문 요약이 생성되었습니다.',
    answer_summary:
      data?.answer_summary ||
      data?.answerSummary ||
      data?.summary_answer ||
      '답변 요약이 생성되었습니다.',
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
  };
}

export default function AddScreen() {
  const [step, setStep] = useState<'input' | 'result'>('input');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('ChatGPT');
  const [selectedCategory, setSelectedCategory] = useState('기타');

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) {
      setErrorMessage('질문과 답변을 모두 입력해주세요.');
      return;
    }

    try {
      setAnalyzing(true);
      setErrorMessage('');

      let result: AnalysisResult;

      if (USE_MOCK_ANALYSIS) {
        result = {
          question_summary: question.trim().slice(0, 45) || '질문 요약',
          answer_summary: answer.trim().slice(0, 90) || '답변 요약',
          keywords: ['AI', '인사이트', selectedCategory],
        };
      } else {
        const data = await insightApi.analyze({
          question: question.trim(),
          answer: answer.trim(),
          ai_source: source,
        });

        result = normalizeAnalysisResult(data);
      }

      setAnalysisResult(result);
      setStep('result');
    } catch (error: any) {
      console.log('AI 분석 실패:', error);
      setErrorMessage(error?.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysisResult) {
      setErrorMessage('먼저 AI 분석을 진행해주세요.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      await insightApi.create({
        category_id: null,
        category_name: selectedCategory,
        ai_source: source,
        question_original: question.trim(),
        answer_original: answer.trim(),
        question_summary: analysisResult.question_summary,
        answer_summary: analysisResult.answer_summary,
        keywords: analysisResult.keywords,
        saved_from: 'mobile',
      });

      setQuestion('');
      setAnswer('');
      setSource('ChatGPT');
      setSelectedCategory('기타');
      setAnalysisResult(null);
      setErrorMessage('');
      setStep('input');

      router.replace('/home');
    } catch (error: any) {
      console.log('저장 실패:', error);
      setErrorMessage(error?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setQuestion('');
    setAnswer('');
    setSource('ChatGPT');
    setSelectedCategory('기타');
    setAnalysisResult(null);
    setErrorMessage('');
    setStep('input');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          {step === 'input' ? (
            <>
              <View style={styles.header}>
                <Pressable style={styles.closeButton} onPress={() => router.back()}>
                  <Ionicons name="close" size={21} color="#6b7280" />
                </Pressable>

                <Text style={styles.headerTitle}>질문 추가하기</Text>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionLabel}>AI 출처</Text>

                <View style={styles.sourceRow}>
                  {AI_SOURCES.map((item) => {
                    const isSelected = source === item;

                    return (
                      <Pressable
                        key={item}
                        style={[
                          styles.sourceChip,
                          isSelected && styles.sourceChipSelected,
                        ]}
                        onPress={() => setSource(item)}
                      >
                        <Text
                          style={[
                            styles.sourceChipText,
                            isSelected && styles.sourceChipTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>질문 (Q)</Text>
                <TextInput
                  style={styles.questionInput}
                  value={question}
                  onChangeText={(text) => {
                    setQuestion(text);
                    setErrorMessage('');
                  }}
                  placeholder="AI에게 했던 질문을 붙여넣으세요..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.label}>답변 (A)</Text>
                <TextInput
                  style={styles.answerInput}
                  value={answer}
                  onChangeText={(text) => {
                    setAnswer(text);
                    setErrorMessage('');
                  }}
                  placeholder="AI의 답변을 붙여넣으세요..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.categoryBox}>
                  <Text style={styles.categoryTitle}>카테고리</Text>
                  <Text style={styles.categorySub}>
                    저장할 인사이트의 카테고리를 선택해주세요.
                  </Text>

                  <View style={styles.categoryChipWrap}>
                    {CATEGORY_OPTIONS.map((category) => {
                      const isSelected = selectedCategory === category;

                      return (
                        <Pressable
                          key={category}
                          style={[
                            styles.categoryChip,
                            isSelected && styles.categoryChipSelected,
                          ]}
                          onPress={() => setSelectedCategory(category)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && styles.categoryChipTextSelected,
                            ]}
                          >
                            {category}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.buttonRow}>
                  <Pressable style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.analyzeButton,
                      analyzing && styles.disabledButton,
                    ]}
                    onPress={handleAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="sparkles-outline" size={17} color="#ffffff" />
                        <Text style={styles.analyzeButtonText}>AI 분석하기</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => setStep('input')}>
                  <Ionicons name="arrow-back" size={21} color="#6b7280" />
                </Pressable>

                <Text style={styles.headerTitle}>분석 결과</Text>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.resultContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.resultCard}>
                  <Text style={styles.doneText}>분석 완료</Text>

                  <Text style={styles.resultLabel}>Q 요약</Text>
                  <Text style={styles.resultText}>
                    {analysisResult?.question_summary}
                  </Text>

                  <Text style={styles.resultLabel}>A 요약</Text>
                  <Text style={styles.resultText}>
                    {analysisResult?.answer_summary}
                  </Text>

                  <View style={styles.keywordWrap}>
                    <View style={styles.categoryResultChip}>
                      <Text style={styles.categoryResultText}>
                        {selectedCategory}
                      </Text>
                    </View>

                    {analysisResult?.keywords.map((keyword, index) => (
                      <View key={`${keyword}-${index}`} style={styles.keywordChip}>
                        <Text style={styles.keywordText}>#{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.resultButtonRow}>
                  <Pressable style={styles.prevButton} onPress={() => setStep('input')}>
                    <Text style={styles.prevButtonText}>이전</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={17} color="#ffffff" />
                        <Text style={styles.saveButtonText}>저장하기</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#ffffff',
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

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a18',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 100,
  },

  resultContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '900',
    marginBottom: 10,
  },

  sourceRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },

  sourceChip: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1cec8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sourceChipSelected: {
    backgroundColor: '#e8f5ee',
    borderColor: '#2d6a4f',
  },

  sourceChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '800',
  },

  sourceChipTextSelected: {
    color: '#1a4a35',
    fontWeight: '900',
  },

  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 4,
  },

  questionInput: {
    width: '100%',
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#d1cec8',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a18',
    lineHeight: 20,
    marginBottom: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  answerInput: {
    width: '100%',
    minHeight: 132,
    borderWidth: 1,
    borderColor: '#d1cec8',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a18',
    lineHeight: 20,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  categoryBox: {
    marginBottom: 14,
  },

  categoryTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '900',
    marginBottom: 4,
  },

  categorySub: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 10,
  },

  categoryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1cec8',
  },

  categoryChipSelected: {
    backgroundColor: '#e8f5ee',
    borderColor: '#2d6a4f',
  },

  categoryChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '800',
  },

  categoryChipTextSelected: {
    color: '#1a4a35',
    fontWeight: '900',
  },

  errorText: {
    color: '#d45d79',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },

  cancelButton: {
    width: 74,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1cec8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    color: '#1a1a18',
    fontWeight: '900',
  },

  analyzeButton: {
    width: 140,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  analyzeButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '900',
  },

  resultCard: {
    backgroundColor: '#f7f7f4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    padding: 14,
    marginBottom: 14,
  },

  doneText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '800',
    marginBottom: 10,
  },

  resultLabel: {
    fontSize: 13,
    color: '#1a1a18',
    fontWeight: '900',
    marginBottom: 5,
  },

  resultText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },

  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 2,
  },

  categoryResultChip: {
    backgroundColor: '#e8f5ee',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  categoryResultText: {
    fontSize: 11,
    color: '#1a4a35',
    fontWeight: '900',
  },

  keywordChip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1cec8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  keywordText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '800',
  },

  resultButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  prevButton: {
    width: 74,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1cec8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  prevButtonText: {
    fontSize: 14,
    color: '#1a1a18',
    fontWeight: '900',
  },

  saveButton: {
    width: 120,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.65,
  },
});