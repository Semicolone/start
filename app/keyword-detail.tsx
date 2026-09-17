import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';

import {
    useCallback,
    useMemo,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { insightApi } from '../lib/client';

/* =========================================================
   TYPES
========================================================= */

type PeriodType =
  | 'all'
  | '1m'
  | '3m';

type SortType =
  | 'recent'
  | 'oldest';

type DisplayMode =
  | 'question'
  | 'answer'
  | 'both';

type InsightItem = {
  id: string | number;

  question: string;

  answer: string;

  source: string;

  category: string;

  createdAt: string;

  date: string;
};

type GraphPoint = {
  date: string;

  cumulativeCount: number;
};

/* =========================================================
   PARAM
========================================================= */

function getStringParam(
  value:
    | string
    | string[]
    | undefined
) {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  raw?: string
) {
  if (!raw) {
    return '';
  }

  if (
    raw.includes('T') ||
    raw.includes('-')
  ) {
    return raw
      .slice(0, 10)
      .replaceAll('-', '.');
  }

  return raw;
}

function formatShortDate(
  raw?: string
) {
  if (!raw) {
    return '';
  }

  if (
    raw.includes('T') ||
    raw.includes('-')
  ) {
    return raw
      .slice(5, 10)
      .replace('-', '/');
  }

  return raw;
}

/* =========================================================
   PERIOD
========================================================= */

function getPeriodLabel(
  period: string
) {
  if (period === '1m') {
    return '최근 1개월';
  }

  if (period === '3m') {
    return '최근 3개월';
  }

  return '전체 기간';
}

/* =========================================================
   CATEGORY THEME
========================================================= */

function getCategoryTheme(
  name: string
) {
  if (
    name.includes('학습') ||
    name.includes('공부')
  ) {
    return {
      color: '#2D7050',

      soft: '#E4EEE8',
    };
  }

  if (
    name.includes('커리어') ||
    name.includes('진로') ||
    name.includes('업무')
  ) {
    return {
      color: '#7B5EA7',

      soft: '#F0EBF6',
    };
  }

  if (
    name.includes('감정') ||
    name.includes('고민') ||
    name.includes('관계')
  ) {
    return {
      color: '#C76D80',

      soft: '#F8EAED',
    };
  }

  if (
    name.includes('개발') ||
    name.includes('코딩')
  ) {
    return {
      color: '#5577C9',

      soft: '#EBEFF9',
    };
  }

  if (
    name.includes('창작') ||
    name.includes('아이디어')
  ) {
    return {
      color: '#D58A55',

      soft: '#F9EFE7',
    };
  }

  if (
    name.includes('일상')
  ) {
    return {
      color: '#6F937A',

      soft: '#EBF1ED',
    };
  }

  return {
    color: '#2D6A4F',

    soft: '#E8F0EB',
  };
}

/* =========================================================
   MAP API DATA
========================================================= */

function mapInsight(
  item: any,
  index: number
): InsightItem {
  const rawDate =
    item?.created_at ||
    item?.createdAt ||
    item?.date ||
    '';

  return {
    id:
      item?.id ??
      item?.insight_id ??
      item?.insightId ??
      `insight-${index}`,

    question:
      item?.question_summary ||
      item?.questionSummary ||
      item?.question_original ||
      item?.questionOriginal ||
      item?.question ||
      '저장된 질문',

    answer:
      item?.answer_summary ||
      item?.answerSummary ||
      item?.answer_original ||
      item?.answerOriginal ||
      item?.answer ||
      '저장된 답변 요약이 없습니다.',

    source:
      item?.ai_source ||
      item?.aiSource ||
      item?.source ||
      'AI',

    category:
      item?.category_name ||
      item?.categoryName ||
      item?.category ||
      '기타',

    createdAt:
      rawDate,

    date:
      formatShortDate(
        rawDate
      ),
  };
}

/* =========================================================
   GRAPH DATA
========================================================= */

/*
  현재 client.js에서 period에 따라 insights가 이미
  필터링되므로 그래프도 현재 화면의 insights를 기준으로
  다시 계산한다.

  이렇게 해야
  최근 1개월 -> 상세
  최근 3개월 -> 상세
  로 들어왔을 때 그래프도 같은 기간을 보여준다.
*/

function buildGraphData(
  insights: InsightItem[]
): GraphPoint[] {
  const counts =
    new Map<
      string,
      number
    >();

  insights.forEach(
    (item) => {
      if (
        !item.createdAt
      ) {
        return;
      }

      const date =
        item.createdAt.slice(
          0,
          10
        );

      counts.set(
        date,
        (counts.get(
          date
        ) || 0) + 1
      );
    }
  );

  const dates =
    Array.from(
      counts.keys()
    ).sort();

  let cumulative =
    0;

  return dates.map(
    (date) => {
      cumulative +=
        counts.get(date) ||
        0;

      return {
        date,

        cumulativeCount:
          cumulative,
      };
    }
  );
}

/* =========================================================
   MAIN CATEGORY
========================================================= */

function getMainCategory(
  insights: InsightItem[]
) {
  if (
    insights.length ===
    0
  ) {
    return '기타';
  }

  const counter =
    new Map<
      string,
      number
    >();

  insights.forEach(
    (item) => {
      counter.set(
        item.category,
        (counter.get(
          item.category
        ) || 0) + 1
      );
    }
  );

  return (
    Array.from(
      counter.entries()
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0] ||
    '기타'
  );
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function KeywordDetailScreen() {
  const params =
    useLocalSearchParams();

  /* =====================================================
     PARAMS
  ===================================================== */

  const keyword =
    getStringParam(
      params.keyword
    );

  const categoryParam =
    getStringParam(
      params.category
    );

  const period =
    (getStringParam(
      params.period
    ) ||
      'all') as PeriodType;

  const reportCount =
    Number(
      getStringParam(
        params.count
      ) || 0
    );

  /* =====================================================
     STATE
  ===================================================== */

  const [
    insights,
    setInsights,
  ] =
    useState<
      InsightItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    sort,
    setSort,
  ] =
    useState<SortType>(
      'recent'
    );

  const [
    displayMode,
    setDisplayMode,
  ] =
    useState<DisplayMode>(
      'both'
    );

  const [
    sortMenuOpen,
    setSortMenuOpen,
  ] =
    useState(false);

  const [
    graphWidth,
    setGraphWidth,
  ] =
    useState(0);

  /* =====================================================
     API
  ===================================================== */

  const fetchKeywordDetail =
    useCallback(
      async () => {
        if (!keyword) {
          setInsights(
            []
          );

          setErrorMessage(
            '키워드 정보가 없습니다.'
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setErrorMessage(
            ''
          );

          const data =
            await insightApi.getByKeyword(
              keyword,
              period,
              sort
            );

          console.log(
            '키워드 상세 API 응답:',
            data
          );

          const list =
            Array.isArray(
              data
            )
              ? data
              : data?.insights ||
                data?.items ||
                data?.data?.insights ||
                data?.data?.items ||
                data?.data ||
                [];

          const mapped =
            Array.isArray(
              list
            )
              ? list.map(
                  (
                    item,
                    index
                  ) =>
                    mapInsight(
                      item,
                      index
                    )
                )
              : [];

          setInsights(
            mapped
          );
        } catch (
          error: any
        ) {
          console.log(
            '키워드 상세 불러오기 실패:',
            error
          );

          setInsights(
            []
          );

          setErrorMessage(
            error?.message ||
              '키워드 인사이트를 불러오지 못했습니다.'
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        keyword,
        period,
        sort,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      fetchKeywordDetail();
    }, [
      fetchKeywordDetail,
    ])
  );

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const graphData =
    useMemo(
      () =>
        buildGraphData(
          insights
        ),
      [
        insights,
      ]
    );

  const mainCategory =
    useMemo(
      () =>
        getMainCategory(
          insights
        ),
      [
        insights,
      ]
    );

  const mainTheme =
    getCategoryTheme(
      mainCategory ||
        categoryParam
    );

  const latestInsight =
    useMemo(
      () => {
        if (
          insights.length ===
          0
        ) {
          return null;
        }

        return [
          ...insights,
        ].sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        )[0];
      },
      [
        insights,
      ]
    );

  const totalCount =
    insights.length ||
    reportCount;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <View
      style={
        styles.screen
      }
    >
      <View
        style={
          styles.outer
        }
      >
        <View
          style={
            styles.phone
          }
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={
              styles.header
            }
          >
            <Pressable
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#60615C"
              />
            </Pressable>

            <Text
              style={
                styles.headerTitle
              }
              numberOfLines={
                1
              }
            >
              {keyword ||
                '키워드 상세'}
            </Text>

            <View
              style={
                styles.headerRight
              }
            />
          </View>

          <ScrollView
            style={
              styles.scroll
            }
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <ActivityIndicator
                  color="#2D6A4F"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  #{keyword} 기록을 불러오는 중이에요...
                </Text>
              </View>
            ) : errorMessage ? (
              /* =================================================
                  ERROR
              ================================================= */

              <View
                style={
                  styles.loadingCard
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color="#C87989"
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errorMessage}
                </Text>

                <Pressable
                  style={
                    styles.retryButton
                  }
                  onPress={
                    fetchKeywordDetail
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color="#2D6A4F"
                  />

                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    다시 시도
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* =================================================
                    CUMULATIVE GRAPH
                ================================================= */}

                <View
                  style={
                    styles.graphCard
                  }
                >
                  <View
                    style={
                      styles.graphHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.graphTitle
                        }
                      >
                        관심 누적 그래프
                      </Text>

                      <Text
                        style={
                          styles.graphTotal
                        }
                      >
                        누적 {totalCount}회
                      </Text>
                    </View>

                    <View
                      style={
                        styles.periodChip
                      }
                    >
                      <Text
                        style={
                          styles.periodChipText
                        }
                      >
                        {getPeriodLabel(
                          period
                        )}
                      </Text>
                    </View>
                  </View>

                  {graphData.length >
                  0 ? (
                    <View
                      style={
                        styles.graphArea
                      }
                      onLayout={(
                        event
                      ) => {
                        setGraphWidth(
                          event
                            .nativeEvent
                            .layout
                            .width
                        );
                      }}
                    >
                      <StepGraph
                        data={
                          graphData
                        }
                        width={
                          graphWidth
                        }
                      />
                    </View>
                  ) : (
                    <View
                      style={
                        styles.graphEmpty
                      }
                    >
                      <Text
                        style={
                          styles.graphEmptyText
                        }
                      >
                        아직 그래프를 만들 기록이 없어요.
                      </Text>
                    </View>
                  )}
                </View>

                {/* =================================================
                    AI NOTE
                ================================================= */}

                <View
                  style={
                    styles.aiNoteCard
                  }
                >
                  <View
                    style={
                      styles.aiNoteTitleRow
                    }
                  >
                    <View
                      style={
                        styles.aiIcon
                      }
                    >
                      <Text
                        style={
                          styles.aiIconText
                        }
                      >
                        ✦
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.aiNoteTitle
                      }
                    >
                      AI 종합 노트
                    </Text>

                    <Text
                      style={
                        styles.aiNoteCaption
                      }
                    >
                      내 기록을 재구성
                    </Text>
                  </View>

                  <AiBullet
                    text={`지금까지 '${keyword}' 관련 질문을 총 ${totalCount}번 남겼어요.`}
                  />

                  <AiBullet
                    text={`주로 ${mainCategory} 카테고리에서 다뤄졌어요.`}
                  />

                  {latestInsight ? (
                    <AiBullet
                      text={`가장 최근에는 "${latestInsight.question}"에 대해 질문했어요. (${latestInsight.date})`}
                    />
                  ) : null}
                </View>

                {/* =================================================
                    CONTROLS
                ================================================= */}

                <View
                  style={
                    styles.controlRow
                  }
                >
                  {/* QUESTION / ANSWER */}

                  <View
                    style={
                      styles.segment
                    }
                  >
                    <SegmentButton
                      text="질문만"
                      active={
                        displayMode ===
                        'question'
                      }
                      onPress={() =>
                        setDisplayMode(
                          'question'
                        )
                      }
                    />

                    <SegmentButton
                      text="답변만"
                      active={
                        displayMode ===
                        'answer'
                      }
                      onPress={() =>
                        setDisplayMode(
                          'answer'
                        )
                      }
                    />

                    <SegmentButton
                      text="둘 다"
                      active={
                        displayMode ===
                        'both'
                      }
                      onPress={() =>
                        setDisplayMode(
                          'both'
                        )
                      }
                    />
                  </View>

                  {/* SORT */}

                  <View
                    style={
                      styles.sortWrap
                    }
                  >
                    <Pressable
                      style={
                        styles.sortButton
                      }
                      onPress={() =>
                        setSortMenuOpen(
                          (
                            prev
                          ) =>
                            !prev
                        )
                      }
                    >
                      <Text
                        style={
                          styles.sortButtonText
                        }
                      >
                        {sort ===
                        'recent'
                          ? '최신순'
                          : '오래된순'}
                      </Text>

                      <Ionicons
                        name={
                          sortMenuOpen
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={13}
                        color="#73756F"
                      />
                    </Pressable>

                    {sortMenuOpen ? (
                      <View
                        style={
                          styles.sortMenu
                        }
                      >
                        <Pressable
                          style={
                            styles.sortMenuItem
                          }
                          onPress={() => {
                            setSort(
                              'recent'
                            );

                            setSortMenuOpen(
                              false
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.sortMenuText,

                              sort ===
                                'recent' &&
                                styles.sortMenuTextActive,
                            ]}
                          >
                            최신순
                          </Text>
                        </Pressable>

                        <View
                          style={
                            styles.sortDivider
                          }
                        />

                        <Pressable
                          style={
                            styles.sortMenuItem
                          }
                          onPress={() => {
                            setSort(
                              'oldest'
                            );

                            setSortMenuOpen(
                              false
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.sortMenuText,

                              sort ===
                                'oldest' &&
                                styles.sortMenuTextActive,
                            ]}
                          >
                            오래된순
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* =================================================
                    INSIGHT CARDS
                ================================================= */}

                {insights.length >
                0 ? (
                  insights.map(
                    (
                      item,
                      index
                    ) => {
                      const theme =
                        getCategoryTheme(
                          item.category
                        );

                      return (
                        <View
                          key={`${item.id}-${index}`}
                          style={
                            styles.insightCard
                          }
                        >
                          <View
                            style={
                              styles.insightTop
                            }
                          >
                            <View
                              style={[
                                styles.categoryBadge,

                                {
                                  backgroundColor:
                                    theme.soft,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryBadgeText,

                                  {
                                    color:
                                      theme.color,
                                  },
                                ]}
                              >
                                {item.category}
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.insightDate
                              }
                            >
                              {item.date}
                            </Text>
                          </View>

                          {(displayMode ===
                            'question' ||
                            displayMode ===
                              'both') && (
                            <View
                              style={
                                styles.qaRow
                              }
                            >
                              <Text
                                style={
                                  styles.qMark
                                }
                              >
                                Q.
                              </Text>

                              <Text
                                style={
                                  styles.questionText
                                }
                              >
                                {
                                  item.question
                                }
                              </Text>
                            </View>
                          )}

                          {(displayMode ===
                            'answer' ||
                            displayMode ===
                              'both') && (
                            <View
                              style={[
                                styles.qaRow,

                                displayMode ===
                                  'both' &&
                                  styles.answerRow,
                              ]}
                            >
                              <Text
                                style={
                                  styles.aMark
                                }
                              >
                                A.
                              </Text>

                              <Text
                                style={
                                  styles.answerText
                                }
                              >
                                {
                                  item.answer
                                }
                              </Text>
                            </View>
                          )}

                          <View
                            style={
                              styles.sourceRow
                            }
                          >
                            <Ionicons
                              name="sparkles-outline"
                              size={12}
                              color="#A0A29C"
                            />

                            <Text
                              style={
                                styles.sourceText
                              }
                            >
                              {
                                item.source
                              }
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  )
                ) : (
                  <View
                    style={
                      styles.emptyCard
                    }
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={30}
                      color="#9DA69F"
                    />

                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      저장된 인사이트가 없어요
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   AI BULLET
========================================================= */

function AiBullet({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.aiBulletRow
      }
    >
      <View
        style={
          styles.aiBullet
        }
      />

      <Text
        style={
          styles.aiBulletText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =========================================================
   SEGMENT
========================================================= */

function SegmentButton({
  text,
  active,
  onPress,
}: {
  text: string;

  active: boolean;

  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.segmentButton,

        active &&
          styles.segmentButtonActive,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.segmentText,

          active &&
            styles.segmentTextActive,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   STEP GRAPH
========================================================= */

function StepGraph({
  data,
  width,
}: {
  data: GraphPoint[];

  width: number;
}) {
  if (
    !width ||
    data.length === 0
  ) {
    return null;
  }

  const height =
    145;

  const leftPadding =
    18;

  const rightPadding =
    12;

  const topPadding =
    22;

  const bottomPadding =
    30;

  const usableWidth =
    width -
    leftPadding -
    rightPadding;

  const usableHeight =
    height -
    topPadding -
    bottomPadding;

  const maxCount =
    Math.max(
      ...data.map(
        (item) =>
          item.cumulativeCount
      ),
      1
    );

  const points =
    data.map(
      (
        item,
        index
      ) => {
        const x =
          data.length ===
          1
            ? leftPadding +
              usableWidth /
                2
            : leftPadding +
              (index /
                (data.length -
                  1)) *
                usableWidth;

        const ratio =
          item.cumulativeCount /
          maxCount;

        const y =
          topPadding +
          usableHeight *
            (1 - ratio);

        return {
          ...item,

          x,

          y,
        };
      }
    );

  return (
    <View
      style={{
        width,

        height,
      }}
    >
      {/* STEP LINES */}

      {points.map(
        (
          point,
          index
        ) => {
          if (
            index === 0
          ) {
            return null;
          }

          const previous =
            points[
              index - 1
            ];

          return (
            <View
              key={`line-${index}`}
            >
              {/* horizontal */}

              <View
                style={{
                  position:
                    'absolute',

                  left:
                    previous.x,

                  top:
                    previous.y,

                  width:
                    point.x -
                    previous.x,

                  height:
                    2.5,

                  backgroundColor:
                    '#256847',
                }}
              />

              {/* vertical */}

              <View
                style={{
                  position:
                    'absolute',

                  left:
                    point.x -
                    1,

                  top:
                    Math.min(
                      point.y,
                      previous.y
                    ),

                  width:
                    2.5,

                  height:
                    Math.abs(
                      previous.y -
                        point.y
                    ),

                  backgroundColor:
                    '#256847',
                }}
              />
            </View>
          );
        }
      )}

      {/* POINTS */}

      {points.map(
        (
          point,
          index
        ) => (
          <View
            key={`${point.date}-${index}`}
          >
            <View
              style={{
                position:
                  'absolute',

                left:
                  point.x -
                  4,

                top:
                  point.y -
                  4,

                width:
                  8,

                height:
                  8,

                borderRadius:
                  999,

                backgroundColor:
                  '#256847',
              }}
            />

            <Text
              style={{
                position:
                  'absolute',

                left:
                  Math.max(
                    0,
                    point.x -
                      18
                  ),

                top:
                  point.y -
                  22,

                width:
                  42,

                textAlign:
                  'center',

                fontSize:
                  8,

                color:
                  '#888A84',

                fontWeight:
                  '700',
              }}
            >
              {formatShortDate(
                point.date
              )}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

/* =========================================================
   STYLE
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        '#E7E2D8',
    },

    outer: {
      flex: 1,

      alignItems:
        'center',

      backgroundColor:
        '#E7E2D8',
    },

    phone: {
      flex: 1,

      width: '100%',

      maxWidth: 360,

      backgroundColor:
        '#F6F5F1',
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      paddingTop: 45,

      paddingHorizontal:
        18,

      paddingBottom:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#F6F5F1',
    },

    backButton: {
      width: 40,

      height: 34,

      justifyContent:
        'center',
    },

    headerTitle: {
      flex: 1,

      textAlign:
        'center',

      fontSize: 19,

      fontWeight:
        '900',

      color:
        '#33332F',
    },

    headerRight: {
      width: 40,
    },

    /* =====================================================
       CONTENT
    ===================================================== */

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        16,

      paddingBottom:
        100,
    },

    /* =====================================================
       GRAPH
    ===================================================== */

    graphCard: {
      paddingHorizontal:
        15,

      paddingTop:
        15,

      paddingBottom:
        12,

      minHeight:
        220,

      borderRadius:
        18,

      borderWidth:
        1,

      borderColor:
        '#E8E5DE',

      backgroundColor:
        '#FFFFFF',

      marginBottom:
        12,
    },

    graphHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',
    },

    graphTitle: {
      fontSize:
        12,

      fontWeight:
        '900',

      color:
        '#317153',
    },

    graphTotal: {
      marginTop:
        8,

      marginLeft:
        30,

      fontSize:
        9,

      color:
        '#317153',

      fontWeight:
        '900',
    },

    periodChip: {
      borderRadius:
        999,

      paddingHorizontal:
        8,

      paddingVertical:
        4,

      backgroundColor:
        '#F2F5F2',
    },

    periodChipText: {
      fontSize:
        8,

      color:
        '#7D827C',

      fontWeight:
        '700',
    },

    graphArea: {
      marginTop:
        7,

      height:
        145,

      overflow:
        'visible',
    },

    graphEmpty: {
      flex: 1,

      minHeight:
        140,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    graphEmptyText: {
      fontSize:
        10,

      color:
        '#A1A39E',
    },

    /* =====================================================
       AI NOTE
    ===================================================== */

    aiNoteCard: {
      paddingHorizontal:
        15,

      paddingVertical:
        14,

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        '#CBE0D2',

      backgroundColor:
        '#EFF8F2',

      marginBottom:
        12,
    },

    aiNoteTitleRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        10,
    },

    aiIcon: {
      width:
        20,

      height:
        20,

      borderRadius:
        7,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#D9EDE0',
    },

    aiIconText: {
      fontSize:
        11,

      color:
        '#347354',

      fontWeight:
        '900',
    },

    aiNoteTitle: {
      marginLeft:
        6,

      fontSize:
        11,

      color:
        '#367353',

      fontWeight:
        '900',
    },

    aiNoteCaption: {
      marginLeft:
        4,

      fontSize:
        8.5,

      color:
        '#67917A',

      fontWeight:
        '700',
    },

    aiBulletRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      marginTop:
        4,
    },

    aiBullet: {
      width:
        4,

      height:
        4,

      borderRadius:
        999,

      marginTop:
        6,

      marginRight:
        8,

      backgroundColor:
        '#3A7256',
    },

    aiBulletText: {
      flex:
        1,

      fontSize:
        10.5,

      lineHeight:
        17,

      color:
        '#567463',

      fontWeight:
        '600',
    },

    /* =====================================================
       CONTROL
    ===================================================== */

    controlRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        10,

      zIndex:
        30,
    },

    segment: {
      flexDirection:
        'row',

      padding:
        3,

      borderRadius:
        11,

      backgroundColor:
        '#ECEAE4',
    },

    segmentButton: {
      height:
        29,

      paddingHorizontal:
        10,

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    segmentButtonActive: {
      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#000',

      shadowOpacity:
        0.06,

      shadowRadius:
        3,

      elevation:
        1,
    },

    segmentText: {
      fontSize:
        9.5,

      color:
        '#8C8D87',

      fontWeight:
        '800',
    },

    segmentTextActive: {
      color:
        '#347354',

      fontWeight:
        '900',
    },

    sortWrap: {
      position:
        'relative',

      zIndex:
        40,
    },

    sortButton: {
      height:
        35,

      minWidth:
        76,

      paddingHorizontal:
        10,

      borderRadius:
        10,

      borderWidth:
        1,

      borderColor:
        '#ECE9E2',

      backgroundColor:
        '#FFFFFF',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        5,
    },

    sortButtonText: {
      fontSize:
        10,

      color:
        '#70716C',

      fontWeight:
        '800',
    },

    sortMenu: {
      position:
        'absolute',

      top:
        40,

      right:
        0,

      width:
        92,

      borderRadius:
        10,

      borderWidth:
        1,

      borderColor:
        '#E8E6E0',

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#000',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      elevation:
        5,
    },

    sortMenuItem: {
      paddingHorizontal:
        12,

      paddingVertical:
        10,
    },

    sortMenuText: {
      fontSize:
        10,

      color:
        '#777A74',

      fontWeight:
        '700',
    },

    sortMenuTextActive: {
      color:
        '#2D6A4F',

      fontWeight:
        '900',
    },

    sortDivider: {
      height:
        1,

      backgroundColor:
        '#EEECE6',
    },

    /* =====================================================
       INSIGHT
    ===================================================== */

    insightCard: {
      padding:
        14,

      marginBottom:
        10,

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        '#E8E5DF',

      backgroundColor:
        '#FFFFFF',
    },

    insightTop: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        10,
    },

    categoryBadge: {
      paddingHorizontal:
        9,

      paddingVertical:
        5,

      borderRadius:
        999,
    },

    categoryBadgeText: {
      fontSize:
        9,

      fontWeight:
        '900',
    },

    insightDate: {
      fontSize:
        9,

      color:
        '#A3A49E',

      fontWeight:
        '700',
    },

    qaRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },

    answerRow: {
      marginTop:
        5,
    },

    qMark: {
      marginRight:
        5,

      fontSize:
        12.5,

      lineHeight:
        19,

      color:
        '#33342F',

      fontWeight:
        '900',
    },

    aMark: {
      marginRight:
        5,

      fontSize:
        11,

      lineHeight:
        18,

      color:
        '#8A8C86',

      fontWeight:
        '800',
    },

    questionText: {
      flex:
        1,

      fontSize:
        12.5,

      lineHeight:
        19,

      color:
        '#353631',

      fontWeight:
        '900',
    },

    answerText: {
      flex:
        1,

      fontSize:
        10.5,

      lineHeight:
        18,

      color:
        '#858781',

      fontWeight:
        '600',
    },

    sourceRow: {
      marginTop:
        9,

      paddingTop:
        8,

      borderTopWidth:
        1,

      borderTopColor:
        '#F0EEE9',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        4,
    },

    sourceText: {
      fontSize:
        8.5,

      color:
        '#A0A29C',

      fontWeight:
        '700',
    },

    /* =====================================================
       STATE
    ===================================================== */

    loadingCard: {
      marginTop:
        20,

      minHeight:
        230,

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        '#E8E5DF',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        25,
    },

    loadingText: {
      marginTop:
        10,

      fontSize:
        11,

      color:
        '#777A75',

      fontWeight:
        '700',
    },

    errorText: {
      marginTop:
        10,

      fontSize:
        10,

      lineHeight:
        16,

      color:
        '#B66E7D',

      textAlign:
        'center',
    },

    retryButton: {
      marginTop:
        13,

      paddingHorizontal:
        12,

      paddingVertical:
        7,

      borderRadius:
        999,

      backgroundColor:
        '#E8F3EB',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        5,
    },

    retryButtonText: {
      fontSize:
        9,

      color:
        '#2D6A4F',

      fontWeight:
        '900',
    },

    emptyCard: {
      minHeight:
        160,

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        '#E8E5DF',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      marginTop:
        8,

      fontSize:
        11,

      color:
        '#777A75',

      fontWeight:
        '800',
    },
  });