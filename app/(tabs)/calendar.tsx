import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CATEGORY_COLORS: Record<string, string> = {
  '커리어/진로': '#7b5ea7',
  개발: '#3b5bdb',
  '학습/공부': '#2d9e6b',
  '감정/고민': '#d45d79',
  창작: '#e07b39',
  일상: '#888780',
};

const mockCalendarData: Record<
  number,
  { id: number; question: string; answer: string; category: string; source: string }[]
> = {
  7: [
    {
      id: 1,
      question: '알고리즘 공부 순서',
      answer: '기초 자료구조부터 시작해 DP, 그래프, 백트래킹 순서로 학습하는 것이 좋아요.',
      category: '학습/공부',
      source: 'ChatGPT',
    },
  ],
  8: [
    {
      id: 2,
      question: 'Node.js 비동기 처리',
      answer: 'Promise, async/await 기반으로 비동기 흐름을 관리할 수 있어요.',
      category: '개발',
      source: 'Claude',
    },
  ],
  10: [
    {
      id: 3,
      question: '번아웃 회복 방법',
      answer: '충분한 휴식과 작은 성취감을 회복하는 루틴이 중요해요.',
      category: '감정/고민',
      source: 'Claude',
    },
  ],
  11: [
    {
      id: 4,
      question: '딥러닝과 머신러닝 차이',
      answer: '딥러닝은 머신러닝의 하위 개념으로 다층 신경망을 사용해요.',
      category: '학습/공부',
      source: 'ChatGPT',
    },
  ],
  12: [
    {
      id: 5,
      question: '자기소개서 지원 동기 작성법',
      answer: '구체적인 경험과 지원 회사의 특징을 연결해 작성하는 것이 좋아요.',
      category: '커리어/진로',
      source: 'Claude',
    },
  ],
  13: [
    {
      id: 6,
      question: 'Zustand vs Redux 비교',
      answer: '소규모는 Zustand, 대형 프로젝트는 Redux가 적합할 수 있어요.',
      category: '개발',
      source: 'ChatGPT',
    },
    {
      id: 7,
      question: 'React 렌더링 최적화',
      answer: 'memo, useMemo, useCallback 등을 상황에 맞게 사용할 수 있어요.',
      category: '개발',
      source: 'ChatGPT',
    },
  ],
  14: [
    {
      id: 8,
      question: '개발자 취업 vs 대학원 진학',
      answer: '취업은 빠른 실무 경험, 대학원은 연구 역량 강화에 유리해요.',
      category: '커리어/진로',
      source: 'Claude',
    },
    {
      id: 9,
      question: '포트폴리오 구성 방법',
      answer: '문제 정의, 구현 과정, 기술 선택 이유, 결과를 함께 보여주는 것이 좋아요.',
      category: '커리어/진로',
      source: 'Claude',
    },
    {
      id: 10,
      question: '캡스톤 데모 흐름 구성',
      answer: '사용자 문제 → 입력 → AI 분석 → 저장 → 재확인 흐름을 보여주면 좋아요.',
      category: '개발',
      source: 'ChatGPT',
    },
  ],
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState(14);

  const selectedInsights = mockCalendarData[selectedDay] || [];

  // 2025년 5월은 목요일 시작이라 일/월/화 3칸 비워둠
  const calendarCells: { type: 'empty' | 'day'; day: number }[] = [];

  for (let i = 0; i < 3; i += 1) {
    calendarCells.push({ type: 'empty', day: 0 });
  }

  for (let day = 1; day <= 31; day += 1) {
    calendarCells.push({ type: 'day', day });
  }

  // ✅ 7일씩 한 줄로 나눠서 열 정렬이 안 밀리게 함
  const calendarRows: { type: 'empty' | 'day'; day: number }[][] = [];

  for (let i = 0; i < calendarCells.length; i += 7) {
    calendarRows.push(calendarCells.slice(i, i + 7));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.title}>캘린더</Text>
              <Text style={styles.subtitle}>2025년 5월</Text>
            </View>

            <View style={styles.monthButtonRow}>
              <Pressable style={styles.iconButton}>
                <Ionicons name="chevron-back" size={17} color="#6b7280" />
              </Pressable>
              <Pressable style={styles.iconButton}>
                <Ionicons name="chevron-forward" size={17} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.dowRow}>
                {DAYS.map((day) => (
                  <Text key={day} style={styles.dowText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarRows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.weekRow}>
                    {row.map((cell, index) => {
                      if (cell.type === 'empty') {
                        return (
                          <View
                            key={`empty-${rowIndex}-${index}`}
                            style={styles.emptyDay}
                          />
                        );
                      }

                      const dayInsights = mockCalendarData[cell.day] || [];
                      const hasInsights = dayInsights.length > 0;
                      const isToday = cell.day === 14;
                      const isSelected = selectedDay === cell.day;

                      return (
                        <Pressable
                          key={cell.day}
                          style={[
                            styles.dayCell,
                            hasInsights && styles.dayCellHas,
                            isToday && styles.todayCell,
                            isSelected && styles.selectedCell,
                          ]}
                          onPress={() => setSelectedDay(cell.day)}
                        >
                          <Text
                            style={[
                              styles.dayNumber,
                              isToday && styles.todayText,
                              isSelected && styles.selectedText,
                            ]}
                          >
                            {cell.day}
                          </Text>

                          <View style={styles.dotRow}>
                            {dayInsights.slice(0, 4).map((item) => (
                              <View
                                key={item.id}
                                style={[
                                  styles.dot,
                                  {
                                    backgroundColor:
                                      CATEGORY_COLORS[item.category] || '#888780',
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {selectedInsights.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>
                  5월 {selectedDay}일 · {selectedInsights.length}개 질문
                </Text>

                {selectedInsights.map((item) => (
                  <View key={item.id} style={styles.insightCard}>
                    <Text style={styles.insightQuestion}>{item.question}</Text>
                    <Text style={styles.insightAnswer} numberOfLines={2}>
                      {item.answer}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceText}>{item.source}</Text>
                      </View>

                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: `${
                              CATEGORY_COLORS[item.category] || '#888780'
                            }22`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            {
                              color: CATEGORY_COLORS[item.category] || '#888780',
                            },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="leaf-outline" size={28} color="#9ca3af" />
                <Text style={styles.emptyTitle}>저장된 인사이트가 없어요</Text>
                <Text style={styles.emptySub}>
                  이 날짜에는 아직 저장된 질문이 없습니다.
                </Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  monthButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    padding: 12,
    marginBottom: 10,
  },

  dowRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '900',
    paddingVertical: 4,
  },

  calendarGrid: {
    gap: 4,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },

  emptyDay: {
    flex: 1,
    minHeight: 38,
  },

  dayCell: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    paddingTop: 4,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  dayCellHas: {
    borderColor: '#e8e6e0',
    backgroundColor: '#ffffff',
  },

  todayCell: {
    borderColor: '#2d6a4f',
  },

  selectedCell: {
    backgroundColor: '#e8f5ee',
    borderColor: '#2d6a4f',
  },

  dayNumber: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },

  todayText: {
    color: '#2d6a4f',
    fontWeight: '900',
  },

  selectedText: {
    color: '#1a4a35',
    fontWeight: '900',
  },

  dotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginBottom: 8,
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

  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    paddingVertical: 30,
    paddingHorizontal: 16,
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
  },
});