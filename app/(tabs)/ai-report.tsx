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

import { myApi } from '../../lib/client';

type ReportMode =
  | 'keyword'
  | 'monthly';

type PeriodType =
  | 'all'
  | '1m'
  | '3m';

type KeywordItem = {
  keyword: string;
  count: number;
};

type KeywordCategory = {
  name: string;
  keywords: KeywordItem[];
};

type KeywordReportResponse = {
  period: PeriodType;
  categories: KeywordCategory[];
};

type TimelineItem = {
  week: string;
  text: string;
};

type CategoryChange = {
  name: string;

  count: number;

  previous_count: number;

  change: string;
};

type MonthlyReviewData = {
  year: number;

  month: number;

  total_questions: number;

  active_days: number;

  max_questions: number;

  title: string | null;

  summary: string | null;

  highlight: string | null;

  timeline: TimelineItem[];

  category_changes:
    CategoryChange[];

  keyword_top5:
    KeywordItem[];
};

type BubbleSlot = {
  x: number;

  y: number;

  maxSize: number;

  fontSize: number;
};

/* =========================================================
   BUBBLE POSITIONS
========================================================= */

const LEARNING_SLOTS: BubbleSlot[] = [
  {
    x: 12,
    y: 50,
    maxSize: 74,
    fontSize: 14,
  },

  {
    x: 92,
    y: 57,
    maxSize: 62,
    fontSize: 12,
  },

  {
    x: 25,
    y: 10,
    maxSize: 46,
    fontSize: 10,
  },

  {
    x: 78,
    y: 18,
    maxSize: 39,
    fontSize: 9,
  },

  {
    x: 123,
    y: 17,
    maxSize: 34,
    fontSize: 8,
  },

  {
    x: 14,
    y: 127,
    maxSize: 34,
    fontSize: 8,
  },

  {
    x: 58,
    y: 122,
    maxSize: 44,
    fontSize: 10,
  },

  {
    x: 111,
    y: 129,
    maxSize: 34,
    fontSize: 8,
  },
];

const CAREER_SLOTS: BubbleSlot[] = [
  {
    x: 10,
    y: 43,
    maxSize: 62,
    fontSize: 12,
  },

  {
    x: 78,
    y: 45,
    maxSize: 50,
    fontSize: 10,
  },

  {
    x: 47,
    y: 99,
    maxSize: 46,
    fontSize: 9,
  },
];

const EMOTION_SLOTS: BubbleSlot[] = [
  {
    x: 10,
    y: 43,
    maxSize: 60,
    fontSize: 12,
  },

  {
    x: 75,
    y: 45,
    maxSize: 49,
    fontSize: 10,
  },

  {
    x: 48,
    y: 98,
    maxSize: 42,
    fontSize: 9,
  },
];

const DAILY_SLOTS: BubbleSlot[] = [
  {
    x: 10,
    y: 45,
    maxSize: 58,
    fontSize: 11,
  },

  {
    x: 73,
    y: 43,
    maxSize: 48,
    fontSize: 10,
  },

  {
    x: 47,
    y: 96,
    maxSize: 42,
    fontSize: 9,
  },
];

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
      color: '#246B49',

      borderColor:
        '#93BAA2',
    };
  }

  if (
    name.includes('커리어') ||
    name.includes('진로')
  ) {
    return {
      color: '#8B74AE',

      borderColor:
        '#B7A9D0',
    };
  }

  if (
    name.includes('감정') ||
    name.includes('고민')
  ) {
    return {
      color: '#C87989',

      borderColor:
        '#D9AAB4',
    };
  }

  if (
    name.includes('일상')
  ) {
    return {
      color: '#79A889',

      borderColor:
        '#98C2A6',
    };
  }

  if (
    name.includes('개발')
  ) {
    return {
      color: '#5577C9',

      borderColor:
        '#A9B8DD',
    };
  }

  if (
    name.includes('창작')
  ) {
    return {
      color: '#D58A55',

      borderColor:
        '#E1B799',
    };
  }

  return {
    color: '#6F8F78',

    borderColor:
      '#AFC5B5',
  };
}

/* =========================================================
   UTIL
========================================================= */

function getCategoryTotal(
  category: KeywordCategory
) {
  return category.keywords.reduce(
    (
      sum,
      item
    ) =>
      sum +
      Number(
        item.count || 0
      ),
    0
  );
}

function buildTopKeywords(
  categories:
    KeywordCategory[]
) {
  const counter =
    new Map<
      string,
      number
    >();

  categories.forEach(
    (
      category
    ) => {
      category.keywords.forEach(
        (
          item
        ) => {
          const current =
            counter.get(
              item.keyword
            ) || 0;

          counter.set(
            item.keyword,

            current +
              Number(
                item.count ||
                  0
              )
          );
        }
      );
    }
  );

  return Array.from(
    counter.entries()
  )
    .map(
      (
        [
          name,
          count,
        ]
      ) => ({
        name,
        count,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
    )
    .slice(0, 5);
}

/*
 * 버블 크기 계산
 *
 * 기존보다 최소 크기를 크게 잡아서
 * 등장 횟수가 적은 키워드도 너무 작고 흐릿하게
 * 보이지 않도록 수정
 */
function getBubbleSize(
  count: number,
  globalMax: number,
  maxSize: number
) {
  if (
    count <= 0 ||
    globalMax <= 0
  ) {
    return Math.min(
      34,
      maxSize
    );
  }

  const minSize =
    Math.min(
      Math.max(
        30,
        maxSize * 0.68
      ),

      maxSize
    );

  const ratio =
    Math.pow(
      count /
        globalMax,

      0.7
    );

  return Math.round(
    minSize +
      (
        maxSize -
        minSize
      ) *
        ratio
  );
}

function getPeriodTop5Title(
  period: PeriodType
) {
  if (
    period === '1m'
  ) {
    return '최근 1개월 키워드 Top5';
  }

  if (
    period === '3m'
  ) {
    return '최근 3개월 키워드 Top5';
  }

  return '전체 기간 키워드 Top5';
}

/* =========================================================
   MAIN
========================================================= */

export default function AiReportScreen() {
  /* =====================================================
     HOME → AI REPORT TAB PARAM
  ===================================================== */

  const params =
    useLocalSearchParams<{
      tab?:
        | string
        | string[];
    }>();

  const requestedTab =
    Array.isArray(
      params.tab
    )
      ? params.tab[0]
      : params.tab;

  /*
   * 홈 초록 카드 오른쪽 화살표에서
   *
   * /ai-report?tab=monthly
   *
   * 로 들어오면 월간 회고를 보여줌.
   *
   * AI 리포트 탭을 그냥 열면
   * 키워드 리포트가 기본.
   */
  const [
    reportMode,
    setReportMode,
  ] =
    useState<ReportMode>(
      requestedTab ===
        'monthly'
        ? 'monthly'
        : 'keyword'
    );

  /*
   * =====================================================
   * ★ 중요 버그 수정
   * =====================================================
   *
   * AI 리포트에서 키워드 리포트를 보고
   * Home으로 갔다가
   *
   * Home의 오른쪽 화살표로
   * 다시 /ai-report?tab=monthly
   * 로 들어오는 경우,
   *
   * 화면 component가 살아 있어서
   * reportMode = keyword 상태가 남아 있을 수 있음.
   *
   * 따라서 useEffect가 아니라
   * 화면이 다시 focus될 때마다 실행되는
   * useFocusEffect로 route param을 확인.
   *
   * → Home 화살표 진입 시
   *   무조건 월간 회고로 정상 이동.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        requestedTab ===
        'monthly'
      ) {
        setReportMode(
          'monthly'
        );

        return;
      }

      if (
        requestedTab ===
        'keyword'
      ) {
        setReportMode(
          'keyword'
        );

        return;
      }

      /*
       * 일반적으로
       * AI 리포트 탭을 열었으면
       * 기본 = 키워드 리포트
       */
      setReportMode(
        'keyword'
      );
    }, [
      requestedTab,
    ])
  );

  const [
    period,
    setPeriod,
  ] =
    useState<PeriodType>(
      'all'
    );

  const [
    zoom,
    setZoom,
  ] =
    useState(1);

  /* =====================================================
     KEYWORD API STATE
  ===================================================== */

  const [
    keywordCategories,
    setKeywordCategories,
  ] =
    useState<
      KeywordCategory[]
    >([]);

  const [
    keywordLoading,
    setKeywordLoading,
  ] =
    useState(false);

  const [
    keywordError,
    setKeywordError,
  ] =
    useState('');

  /* =====================================================
     MONTHLY API STATE
  ===================================================== */

  const now =
    new Date();

  const [
    monthlyData,
    setMonthlyData,
  ] =
    useState<
      MonthlyReviewData | null
    >(null);

  const [
    monthlyLoading,
    setMonthlyLoading,
  ] =
    useState(false);

  const [
    monthlyError,
    setMonthlyError,
  ] =
    useState('');

  /* =====================================================
     ZOOM
  ===================================================== */

  const zoomIn = () => {
    setZoom(
      (
        prev
      ) =>
        Math.min(
          prev + 0.04,
          1.04
        )
    );
  };

  const zoomOut = () => {
    setZoom(
      (
        prev
      ) =>
        Math.max(
          prev - 0.05,
          0.9
        )
    );
  };

  /* =====================================================
     KEYWORD REPORT API
  ===================================================== */

  const fetchKeywordReport =
    useCallback(
      async () => {
        try {
          setKeywordLoading(
            true
          );

          setKeywordError(
            ''
          );

          const data =
            (
              await myApi.getKeywordReport(
                period
              )
            ) as KeywordReportResponse;

          console.log(
            '키워드 리포트 API 응답:',
            data
          );

          setKeywordCategories(
            Array.isArray(
              data?.categories
            )
              ? data.categories
              : []
          );
        } catch (
          error: any
        ) {
          console.log(
            '키워드 리포트 불러오기 실패:',
            error
          );

          setKeywordCategories(
            []
          );

          setKeywordError(
            error?.message ||
              '키워드 리포트를 불러오지 못했습니다.'
          );
        } finally {
          setKeywordLoading(
            false
          );
        }
      },

      [
        period,
      ]
    );

  /* =====================================================
     MONTHLY REVIEW API
  ===================================================== */

  const fetchMonthlyReview =
    useCallback(
      async () => {
        try {
          setMonthlyLoading(
            true
          );

          setMonthlyError(
            ''
          );

          const data =
            (
              await myApi.getMonthlyReview({
                year:
                  now.getFullYear(),

                month:
                  now.getMonth() +
                  1,
              })
            ) as MonthlyReviewData;

          console.log(
            '월간 회고 API 응답:',
            data
          );

          setMonthlyData(
            data
          );
        } catch (
          error: any
        ) {
          console.log(
            '월간 회고 불러오기 실패:',
            error
          );

          setMonthlyData(
            null
          );

          setMonthlyError(
            error?.message ||
              '월간 회고를 불러오지 못했습니다.'
          );
        } finally {
          setMonthlyLoading(
            false
          );
        }
      },

      []
    );

  /* =====================================================
     SCREEN FOCUS
  ===================================================== */

  /*
   * 위 useFocusEffect:
   * 어떤 탭을 보여줄지 결정
   *
   * 아래 useFocusEffect:
   * 선택된 탭에 필요한 API 호출
   */
  useFocusEffect(
    useCallback(() => {
      if (
        reportMode ===
        'keyword'
      ) {
        fetchKeywordReport();
      } else {
        fetchMonthlyReview();
      }
    }, [
      reportMode,

      fetchKeywordReport,

      fetchMonthlyReview,
    ])
  );

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const chartCategories =
    useMemo(
      () =>
        [
          ...keywordCategories,
        ]
          .sort(
            (
              a,
              b
            ) =>
              getCategoryTotal(
                b
              ) -
              getCategoryTotal(
                a
              )
          )
          .slice(
            0,
            4
          ),

      [
        keywordCategories,
      ]
    );

  const topKeywords =
    useMemo(
      () =>
        buildTopKeywords(
          keywordCategories
        ),

      [
        keywordCategories,
      ]
    );

  const globalMaxCount =
    useMemo(
      () => {
        const counts =
          keywordCategories.flatMap(
            (
              category
            ) =>
              category.keywords.map(
                (
                  item
                ) =>
                  Number(
                    item.count ||
                      0
                  )
              )
          );

        return counts.length
          ? Math.max(
              ...counts
            )
          : 0;
      },

      [
        keywordCategories,
      ]
    );

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
          {/* HEADER */}

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
                size={19}
                color="#686963"
              />
            </Pressable>

            <View
              style={
                styles.headerCenter
              }
            >
              <Text
                style={
                  styles.headerTitle
                }
              >
                인사이트 리포트
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                관심 있는 키워드가 어떻게 이어지는지 확인해보세요
              </Text>
            </View>

            <View
              style={
                styles.headerSide
              }
            />
          </View>

          {/* REPORT TABS */}

          <View
            style={
              styles.reportTabWrapper
            }
          >
            <View
              style={
                styles.reportTabs
              }
            >
              <Pressable
                style={[
                  styles.reportTab,

                  reportMode ===
                    'keyword' &&
                    styles.reportTabActive,
                ]}
                onPress={() =>
                  setReportMode(
                    'keyword'
                  )
                }
              >
                <Text
                  style={[
                    styles.reportTabText,

                    reportMode ===
                      'keyword' &&
                      styles.reportTabTextActive,
                  ]}
                >
                  키워드 리포트
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.reportTab,

                  reportMode ===
                    'monthly' &&
                    styles.reportTabActive,
                ]}
                onPress={() =>
                  setReportMode(
                    'monthly'
                  )
                }
              >
                <Text
                  style={[
                    styles.reportTabText,

                    reportMode ===
                      'monthly' &&
                      styles.reportTabTextActive,
                  ]}
                >
                  월간 회고
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =================================================
              KEYWORD REPORT
          ================================================= */}

          {
            reportMode ===
            'keyword' ? (
              <ScrollView
                style={
                  styles.scroll
                }
                contentContainerStyle={
                  styles.scrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {/* PERIOD */}

                <Text
                  style={
                    styles.periodLabel
                  }
                >
                  기간
                </Text>

                <View
                  style={
                    styles.periodRow
                  }
                >
                  <PeriodButton
                    text="전체"
                    active={
                      period ===
                      'all'
                    }
                    onPress={() => {
                      setPeriod(
                        'all'
                      );

                      setZoom(
                        1
                      );
                    }}
                  />

                  <PeriodButton
                    text="최근 1개월"
                    active={
                      period ===
                      '1m'
                    }
                    onPress={() => {
                      setPeriod(
                        '1m'
                      );

                      setZoom(
                        1
                      );
                    }}
                  />

                  <PeriodButton
                    text="최근 3개월"
                    active={
                      period ===
                      '3m'
                    }
                    onPress={() => {
                      setPeriod(
                        '3m'
                      );

                      setZoom(
                        1
                      );
                    }}
                  />
                </View>

                {/* ZOOM */}

                <View
                  style={
                    styles.zoomRow
                  }
                >
                  <Pressable
                    style={
                      styles.zoomButton
                    }
                    onPress={
                      zoomOut
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color="#72736E"
                    />
                  </Pressable>

                  <Pressable
                    style={
                      styles.zoomButton
                    }
                    onPress={
                      zoomIn
                    }
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color="#72736E"
                    />
                  </Pressable>
                </View>

                {/* =================================================
                    BUBBLE GRAPH
                ================================================= */}

                <View
                  style={
                    styles.graphCard
                  }
                >
                  {
                    keywordLoading ? (
                      <View
                        style={
                          styles.graphState
                        }
                      >
                        <ActivityIndicator
                          color="#2D6A4F"
                        />

                        <Text
                          style={
                            styles.graphStateText
                          }
                        >
                          키워드를 불러오는 중이에요...
                        </Text>
                      </View>
                    ) : keywordError ? (
                      <View
                        style={
                          styles.graphState
                        }
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={25}
                          color="#C87989"
                        />

                        <Text
                          style={
                            styles.graphErrorText
                          }
                        >
                          {
                            keywordError
                          }
                        </Text>

                        <Pressable
                          style={
                            styles.retryButton
                          }
                          onPress={
                            fetchKeywordReport
                          }
                        >
                          <Text
                            style={
                              styles.retryButtonText
                            }
                          >
                            다시 시도
                          </Text>
                        </Pressable>
                      </View>
                    ) :
                      chartCategories.length ===
                      0 ? (
                        <View
                          style={
                            styles.graphState
                          }
                        >
                          <Ionicons
                            name="leaf-outline"
                            size={27}
                            color="#9DA69F"
                          />

                          <Text
                            style={
                              styles.graphStateText
                            }
                          >
                            아직 표시할 키워드가 없어요.
                          </Text>

                          <Text
                            style={
                              styles.graphStateSubText
                            }
                          >
                            인사이트를 저장하면 키워드가 여기에 쌓여요.
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.graphCanvas,

                            {
                              transform: [
                                {
                                  scale:
                                    zoom,
                                },
                              ],
                            },
                          ]}
                        >
                          {
                            chartCategories.map(
                              (
                                category,
                                categoryIndex
                              ) => {
                                const theme =
                                  getCategoryTheme(
                                    category.name
                                  );

                                const clusterStyle =
                                  categoryIndex ===
                                  0
                                    ? styles.learningCluster
                                    : categoryIndex ===
                                      1
                                      ? styles.careerCluster
                                      : categoryIndex ===
                                        2
                                        ? styles.emotionCluster
                                        : styles.dailyCluster;

                                const slots =
                                  categoryIndex ===
                                  0
                                    ? LEARNING_SLOTS
                                    : categoryIndex ===
                                      1
                                      ? CAREER_SLOTS
                                      : categoryIndex ===
                                        2
                                        ? EMOTION_SLOTS
                                        : DAILY_SLOTS;

                                const visibleKeywords =
                                  [
                                    ...category.keywords,
                                  ]
                                    .sort(
                                      (
                                        a,
                                        b
                                      ) =>
                                        Number(
                                          b.count ||
                                            0
                                        ) -
                                        Number(
                                          a.count ||
                                            0
                                        )
                                    )
                                    .slice(
                                      0,
                                      slots.length
                                    );

                                return (
                                  <View
                                    key={
                                      category.name
                                    }
                                    style={[
                                      styles.cluster,

                                      clusterStyle,

                                      {
                                        borderColor:
                                          theme.borderColor,
                                      },
                                    ]}
                                  >
                                    <CategoryLabel
                                      text={
                                        category.name
                                      }
                                      color={
                                        theme.color
                                      }
                                      onPress={() =>
                                        setZoom(
                                          1.04
                                        )
                                      }
                                    />

                                    {
                                      visibleKeywords.map(
                                        (
                                          item,
                                          index
                                        ) => {
                                          const slot =
                                            slots[
                                              index
                                            ];

                                          const size =
                                            getBubbleSize(
                                              Number(
                                                item.count ||
                                                  0
                                              ),

                                              globalMaxCount,

                                              slot.maxSize
                                            );

                                          return (
                                            <Bubble
                                              key={`${category.name}-${item.keyword}`}
                                              text={
                                                item.keyword
                                              }
                                              count={
                                                Number(
                                                  item.count ||
                                                    0
                                                )
                                              }
                                              size={
                                                size
                                              }
                                              x={
                                                slot.x
                                              }
                                              y={
                                                slot.y
                                              }
                                              color={
                                                theme.color
                                              }
                                              fontSize={
                                                Math.min(
                                                  slot.fontSize,

                                                  Math.max(
                                                    8,

                                                    Math.floor(
                                                      size /
                                                        5.8
                                                    )
                                                  )
                                                )
                                              }
                                              onPress={() =>
                                                router.push({
                                                  pathname:
                                                    '/keyword-detail',

                                                  params: {
                                                    keyword:
                                                      item.keyword,

                                                    category:
                                                      category.name,

                                                    count:
                                                      String(
                                                        item.count ||
                                                          0
                                                      ),

                                                    period,
                                                  },
                                                })
                                              }
                                            />
                                          );
                                        }
                                      )
                                    }
                                  </View>
                                );
                              }
                            )
                          }
                        </View>
                      )
                  }
                </View>

                {/* =================================================
                    TOP 5
                ================================================= */}

                <Text
                  style={
                    styles.top5Title
                  }
                >
                  {
                    getPeriodTop5Title(
                      period
                    )
                  }
                </Text>

                {
                  keywordLoading ? (
                    <View
                      style={
                        styles.top5Loading
                      }
                    >
                      <ActivityIndicator
                        size="small"
                        color="#2D6A4F"
                      />
                    </View>
                  ) :
                    topKeywords.length >
                    0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                          false
                        }
                        contentContainerStyle={
                          styles.top5Row
                        }
                      >
                        {
                          topKeywords.map(
                            (
                              item
                            ) => {
                              const matchedCategory =
                                keywordCategories.find(
                                  (
                                    category
                                  ) =>
                                    category.keywords.some(
                                      (
                                        keywordItem
                                      ) =>
                                        keywordItem.keyword ===
                                        item.name
                                    )
                                )?.name ||
                                '기타';

                              return (
                                <Pressable
                                  key={
                                    item.name
                                  }
                                  style={({
                                    pressed,
                                  }) => [
                                    styles.keywordPill,

                                    pressed && {
                                      opacity:
                                        0.72,
                                    },
                                  ]}
                                  onPress={() =>
                                    router.push({
                                      pathname:
                                        '/keyword-detail',

                                      params: {
                                        keyword:
                                          item.name,

                                        category:
                                          matchedCategory,

                                        count:
                                          String(
                                            item.count ||
                                              0
                                          ),

                                        period,
                                      },
                                    })
                                  }
                                >
                                  <Text
                                    style={
                                      styles.keywordPillName
                                    }
                                  >
                                    {
                                      item.name
                                    }
                                  </Text>

                                  <Text
                                    style={
                                      styles.keywordPillCount
                                    }
                                  >
                                    {
                                      item.count
                                    }
                                    회
                                  </Text>
                                </Pressable>
                              );
                            }
                          )
                        }
                      </ScrollView>
                    ) : (
                      <Text
                        style={
                          styles.top5EmptyText
                        }
                      >
                        아직 집계된 키워드가 없어요.
                      </Text>
                    )
                }
              </ScrollView>
            ) : (
              <MonthlyReport
                data={
                  monthlyData
                }
                loading={
                  monthlyLoading
                }
                error={
                  monthlyError
                }
                onRetry={
                  fetchMonthlyReview
                }
              />
            )
          }
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   PERIOD BUTTON
========================================================= */

function PeriodButton({
  text,
  active,
  onPress,
}: {
  text: string;

  active: boolean;

  onPress:
    () => void;
}) {
  return (
    <Pressable
      style={[
        styles.periodButton,

        active &&
          styles.periodButtonActive,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.periodButtonText,

          active &&
            styles.periodButtonTextActive,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   CATEGORY LABEL
========================================================= */

function CategoryLabel({
  text,
  color,
  onPress,
}: {
  text: string;

  color: string;

  onPress?:
    () => void;
}) {
  return (
    <Pressable
      style={[
        styles.clusterLabel,

        {
          backgroundColor:
            color,
        },
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={
          styles.clusterLabelText
        }
      >
        {text}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   BUBBLE
========================================================= */

function Bubble({
  text,
  count,
  size,
  x,
  y,
  color,
  fontSize,
  onPress,
}: {
  text: string;

  count: number;

  size: number;

  x: number;

  y: number;

  color: string;

  fontSize: number;

  onPress?:
    () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => ({
        position:
          'absolute',

        left: x,

        top: y,

        width:
          size,

        height:
          size,

        borderRadius:
          999,

        backgroundColor:
          color,

        borderWidth:
          1.2,

        borderColor:
          'rgba(255,255,255,0.30)',

        alignItems:
          'center',

        justifyContent:
          'center',

        paddingHorizontal:
          4,

        shadowColor:
          color,

        shadowOpacity:
          0.16,

        shadowRadius:
          3,

        shadowOffset: {
          width: 0,

          height: 2,
        },

        elevation:
          2,

        opacity:
          pressed
            ? 0.78
            : 1,

        transform: [
          {
            scale:
              pressed
                ? 0.96
                : 1,
          },
        ],
      })}
    >
      <Text
        numberOfLines={
          2
        }
        style={{
          color:
            '#FFFFFF',

          fontSize,

          lineHeight:
            fontSize +
            2,

          fontWeight:
            '900',

          textAlign:
            'center',

          textShadowColor:
            'rgba(0,0,0,0.12)',

          textShadowOffset:
            {
              width: 0,
              height: 1,
            },

          textShadowRadius:
            1,
        }}
      >
        {text}
      </Text>

      <Text
        style={{
          marginTop:
            2,

          color:
            'rgba(255,255,255,0.96)',

          fontSize:
            Math.max(
              8,

              fontSize -
                3
            ),

          lineHeight:
            Math.max(
              10,

              fontSize -
                1
            ),

          fontWeight:
            '900',

          textShadowColor:
            'rgba(0,0,0,0.10)',

          textShadowOffset:
            {
              width: 0,
              height: 1,
            },

          textShadowRadius:
            1,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   MONTHLY REPORT
========================================================= */

function MonthlyReport({
  data,
  loading,
  error,
  onRetry,
}: {
  data:
    MonthlyReviewData | null;

  loading:
    boolean;

  error:
    string;

  onRetry:
    () => void;
}) {
  /* LOADING */

  if (
    loading
  ) {
    return (
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.monthlyStateContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <ActivityIndicator
          color="#2D6A4F"
        />

        <Text
          style={
            styles.graphStateText
          }
        >
          이번 달 회고를 불러오는 중이에요...
        </Text>
      </ScrollView>
    );
  }

  /* ERROR */

  if (
    error
  ) {
    return (
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.monthlyStateContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Ionicons
          name="alert-circle-outline"
          size={27}
          color="#C87989"
        />

        <Text
          style={
            styles.graphErrorText
          }
        >
          {error}
        </Text>

        <Pressable
          style={
            styles.retryButton
          }
          onPress={
            onRetry
          }
        >
          <Text
            style={
              styles.retryButtonText
            }
          >
            다시 시도
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  /* EMPTY */

  if (
    !data
  ) {
    return (
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.monthlyStateContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Ionicons
          name="leaf-outline"
          size={27}
          color="#9DA69F"
        />

        <Text
          style={
            styles.graphStateText
          }
        >
          아직 월간 회고 데이터가 없어요.
        </Text>
      </ScrollView>
    );
  }

  const changes =
    Array.isArray(
      data.category_changes
    )
      ? data.category_changes
      : [];

  const timeline =
    Array.isArray(
      data.timeline
    )
      ? data.timeline
      : [];

  const maxCategoryCount =
    changes.length
      ? Math.max(
          1,

          ...changes.flatMap(
            (
              item
            ) => [
              Number(
                item.previous_count ||
                  0
              ),

              Number(
                item.count ||
                  0
              ),
            ]
          )
        )
      : 1;

  return (
    <ScrollView
      style={
        styles.scroll
      }
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =================================================
          STATS
      ================================================= */}

      <View
        style={
          styles.statRow
        }
      >
        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {
              data.total_questions
            }
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            총 질문
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {
              data.active_days
            }
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            활동일
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {
              data.max_questions
            }
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            하루 최대 질문
          </Text>
        </View>
      </View>

      {/* =================================================
          REVIEW
      ================================================= */}

      <View
        style={
          styles.reviewCard
        }
      >
        <Text
          style={
            styles.reviewMonth
          }
        >
          {
            data.year
          }
          년{' '}
          {
            data.month
          }
          월 회고
        </Text>

        <Text
          style={
            styles.reviewTitle
          }
        >
          {
            data.title ||
            `${data.year}년 ${data.month}월의 질문 기록`
          }
        </Text>

        <Text
          style={
            styles.reviewBody
          }
        >
          {
            data.summary ||
            '아직 회고 요약이 없습니다.'
          }
        </Text>

        {
          data.highlight ? (
            <View
              style={
                styles.highlight
              }
            >
              <Text
                style={
                  styles.highlightText
                }
              >
                💡 이번 달 하이라이트 —{' '}
                {
                  data.highlight
                }
              </Text>
            </View>
          ) : null
        }
      </View>

      {/* =================================================
          CATEGORY CHANGE
      ================================================= */}

      {
        changes.length >
        0 ? (
          <View
            style={
              styles.changeCard
            }
          >
            <Text
              style={
                styles.changeTitle
              }
            >
              관심사 변화 (전월 대비)
            </Text>

            <View
              style={
                styles.changeChart
              }
            >
              {
                changes
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      item,
                      index
                    ) => {
                      const theme =
                        getCategoryTheme(
                          item.name
                        );

                      const beforeHeight =
                        Number(
                          item.previous_count ||
                            0
                        ) ===
                        0
                          ? 0
                          : Math.max(
                              6,

                              Math.round(
                                (
                                  Number(
                                    item.previous_count
                                  ) /
                                  maxCategoryCount
                                ) *
                                  100
                              )
                            );

                      const afterHeight =
                        Number(
                          item.count ||
                            0
                        ) ===
                        0
                          ? 0
                          : Math.max(
                              6,

                              Math.round(
                                (
                                  Number(
                                    item.count
                                  ) /
                                  maxCategoryCount
                                ) *
                                  100
                              )
                            );

                      return (
                        <BarGroup
                          key={`${item.name}-${index}`}
                          label={
                            item.name
                          }
                          before={
                            beforeHeight
                          }
                          after={
                            afterHeight
                          }
                          percent={
                            item.change ||
                            '0%'
                          }
                          color={
                            theme.color
                          }
                        />
                      );
                    }
                  )
              }
            </View>
          </View>
        ) : null
      }

      {/* =================================================
          QUESTION FLOW
      ================================================= */}

      {
        timeline.length >
        0 ? (
          <View
            style={
              styles.flowCard
            }
          >
            <Text
              style={
                styles.flowTitle
              }
            >
              이달의 질문 흐름
            </Text>

            {
              timeline.map(
                (
                  item,
                  index
                ) => (
                  <FlowRow
                    key={`${item.week}-${index}`}
                    text={`${item.week} · ${item.text}`}
                    last={
                      index ===
                      timeline.length -
                        1
                    }
                  />
                )
              )
            }
          </View>
        ) : null
      }
    </ScrollView>
  );
}

/* =========================================================
   BAR
========================================================= */

function BarGroup({
  label,
  before,
  after,
  percent,
  color,
}: {
  label:
    string;

  before:
    number;

  after:
    number;

  percent:
    string;

  color:
    string;
}) {
  return (
    <View
      style={
        styles.barGroup
      }
    >
      <Text
        style={[
          styles.barPercent,

          {
            color:
              percent.startsWith(
                '-'
              )
                ? '#BF7272'
                : '#327A55',
          },
        ]}
      >
        {percent}
      </Text>

      <View
        style={
          styles.barArea
        }
      >
        <View
          style={[
            styles.bar,

            {
              height:
                before,

              backgroundColor:
                '#D9D5CB',
            },
          ]}
        />

        <View
          style={[
            styles.bar,

            {
              height:
                after,

              backgroundColor:
                color,
            },
          ]}
        />
      </View>

      <Text
        style={
          styles.barLabel
        }
        numberOfLines={
          1
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* =========================================================
   FLOW
========================================================= */

function FlowRow({
  text,
  last = false,
}: {
  text:
    string;

  last?:
    boolean;
}) {
  return (
    <View
      style={
        styles.flowRow
      }
    >
      <View
        style={
          styles.flowIndicator
        }
      >
        <View
          style={
            styles.flowDot
          }
        />

        {
          !last && (
            <View
              style={
                styles.flowLine
              }
            />
          )
        }
      </View>

      <Text
        style={
          styles.flowText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        '#EAE5DA',
    },

    outer: {
      flex: 1,

      alignItems:
        'center',

      backgroundColor:
        '#EAE5DA',
    },

    phone: {
      flex: 1,

      width: '100%',

      maxWidth: 360,

      backgroundColor:
        '#F7F6F1',
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      paddingTop: 43,

      paddingHorizontal:
        18,

      paddingBottom:
        10,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    backButton: {
      width: 32,
    },

    headerCenter: {
      flex: 1,

      alignItems:
        'center',
    },

    headerSide: {
      width: 32,
    },

    headerTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        '#252724',
    },

    headerSubtitle: {
      marginTop: 2,

      fontSize: 9,

      color:
        '#A3A39D',
    },

    /* =====================================================
       REPORT TABS
    ===================================================== */

    reportTabWrapper: {
      paddingHorizontal:
        18,

      marginBottom:
        10,
    },

    reportTabs: {
      height: 43,

      padding: 4,

      borderRadius: 12,

      backgroundColor:
        '#ECEAE3',

      flexDirection:
        'row',
    },

    reportTab: {
      flex: 1,

      borderRadius: 9,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    reportTabActive: {
      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#000',

      shadowOpacity:
        0.06,

      shadowRadius:
        4,

      elevation:
        2,
    },

    reportTabText: {
      fontSize: 12,

      color:
        '#A3A198',

      fontWeight:
        '800',
    },

    reportTabTextActive: {
      color:
        '#2D6A4F',

      fontWeight:
        '900',
    },

    /* =====================================================
       COMMON
    ===================================================== */

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal:
        18,

      paddingBottom:
        100,
    },

    /* =====================================================
       PERIOD
    ===================================================== */

    periodLabel: {
      marginBottom:
        7,

      fontSize:
        9,

      color:
        '#A6A59E',
    },

    periodRow: {
      flexDirection:
        'row',

      gap:
        7,
    },

    periodButton: {
      height:
        35,

      paddingHorizontal:
        13,

      borderRadius:
        999,

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    periodButtonActive: {
      backgroundColor:
        '#2D6A4F',

      borderColor:
        '#2D6A4F',
    },

    periodButtonText: {
      fontSize:
        10,

      fontWeight:
        '800',

      color:
        '#70716C',
    },

    periodButtonTextActive: {
      color:
        '#FFFFFF',
    },

    /* =====================================================
       ZOOM
    ===================================================== */

    zoomRow: {
      flexDirection:
        'row',

      gap:
        7,

      marginTop:
        9,

      marginBottom:
        9,
    },

    zoomButton: {
      width:
        31,

      height:
        29,

      borderRadius:
        8,

      borderWidth:
        1,

      borderColor:
        '#E8E4DD',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* =====================================================
       GRAPH
    ===================================================== */

    graphCard: {
      height:
        500,

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow:
        'hidden',
    },

    graphCanvas: {
      position:
        'relative',

      width:
        322,

      height:
        472,
    },

    cluster: {
      position:
        'absolute',

      borderWidth:
        1.8,

      borderStyle:
        'dashed',

      borderRadius:
        999,

      backgroundColor:
        '#FFFFFF',
    },

    learningCluster: {
      width:
        168,

      height:
        168,

      left:
        2,

      top:
        24,
    },

    careerCluster: {
      width:
        148,

      height:
        148,

      right:
        2,

      top:
        34,
    },

    emotionCluster: {
      width:
        145,

      height:
        145,

      left:
        8,

      bottom:
        28,
    },

    dailyCluster: {
      width:
        145,

      height:
        145,

      right:
        8,

      bottom:
        28,
    },

    clusterLabel: {
      position:
        'absolute',

      top:
        -14,

      alignSelf:
        'center',

      paddingHorizontal:
        11,

      paddingVertical:
        5,

      borderRadius:
        999,

      zIndex:
        20,
    },

    clusterLabelText: {
      color:
        '#FFFFFF',

      fontSize:
        10,

      fontWeight:
        '900',
    },

    /* =====================================================
       TOP 5
    ===================================================== */

    top5Title: {
      marginTop:
        19,

      marginBottom:
        9,

      fontSize:
        16,

      fontWeight:
        '900',

      color:
        '#252724',
    },

    top5Row: {
      paddingRight:
        10,

      gap:
        7,
    },

    keywordPill: {
      flexDirection:
        'row',

      paddingHorizontal:
        12,

      paddingVertical:
        7,

      borderRadius:
        999,

      backgroundColor:
        '#E8F3EB',
    },

    keywordPillName: {
      fontSize:
        10,

      color:
        '#3A7654',

      fontWeight:
        '900',
    },

    keywordPillCount: {
      marginLeft:
        4,

      fontSize:
        10,

      color:
        '#7E9A87',

      fontWeight:
        '800',
    },

    /* =====================================================
       MONTHLY STATS
    ===================================================== */

    statRow: {
      flexDirection:
        'row',

      gap:
        8,

      marginBottom:
        11,
    },

    statCard: {
      flex:
        1,

      height:
        80,

      borderRadius:
        15,

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    statValue: {
      fontSize:
        25,

      color:
        '#2C2D2A',

      fontWeight:
        '500',
    },

    statLabel: {
      marginTop:
        3,

      fontSize:
        9,

      color:
        '#A1A29C',
    },

    /* =====================================================
       MONTHLY REVIEW
    ===================================================== */

    reviewCard: {
      padding:
        15,

      borderRadius:
        16,

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',

      marginBottom:
        11,
    },

    reviewMonth: {
      fontSize:
        10,

      color:
        '#3E7957',

      fontWeight:
        '900',
    },

    reviewTitle: {
      marginTop:
        3,

      fontSize:
        16,

      color:
        '#292A27',

      fontWeight:
        '900',
    },

    reviewBody: {
      marginTop:
        9,

      fontSize:
        11,

      lineHeight:
        18,

      color:
        '#7C7E79',
    },

    highlight: {
      marginTop:
        11,

      padding:
        11,

      borderRadius:
        10,

      backgroundColor:
        '#E9F3EB',
    },

    highlightText: {
      fontSize:
        10,

      lineHeight:
        15,

      color:
        '#4A785C',

      fontWeight:
        '700',
    },

    /* =====================================================
       CATEGORY CHANGE
    ===================================================== */

    changeCard: {
      padding:
        14,

      borderRadius:
        16,

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',

      marginBottom:
        11,
    },

    changeTitle: {
      fontSize:
        12,

      color:
        '#3D6F51',

      fontWeight:
        '900',
    },

    changeChart: {
      height:
        165,

      marginTop:
        17,

      flexDirection:
        'row',

      justifyContent:
        'space-around',

      alignItems:
        'flex-end',
    },

    barGroup: {
      width:
        60,

      alignItems:
        'center',
    },

    barPercent: {
      fontSize:
        9,

      fontWeight:
        '900',

      marginBottom:
        4,
    },

    barArea: {
      height:
        100,

      flexDirection:
        'row',

      alignItems:
        'flex-end',

      gap:
        4,
    },

    bar: {
      width:
        18,
    },

    barLabel: {
      marginTop:
        6,

      fontSize:
        7,

      color:
        '#777974',
    },

    /* =====================================================
       FLOW
    ===================================================== */

    flowCard: {
      padding:
        15,

      borderRadius:
        16,

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        1,

      borderColor:
        '#ECE8E0',
    },

    flowTitle: {
      marginBottom:
        13,

      fontSize:
        16,

      color:
        '#282A27',

      fontWeight:
        '900',
    },

    flowRow: {
      minHeight:
        43,

      flexDirection:
        'row',
    },

    flowIndicator: {
      width:
        20,

      alignItems:
        'center',
    },

    flowDot: {
      width:
        9,

      height:
        9,

      borderRadius:
        999,

      backgroundColor:
        '#2D6A4F',
    },

    flowLine: {
      width:
        1.5,

      flex:
        1,

      marginTop:
        3,

      backgroundColor:
        '#C7DACA',
    },

    flowText: {
      marginLeft:
        5,

      marginTop:
        -3,

      fontSize:
        11,

      color:
        '#353735',

      fontWeight:
        '800',
    },

    /* =====================================================
       LOADING / EMPTY / ERROR
    ===================================================== */

    graphState: {
      flex:
        1,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        28,
    },

    graphStateText: {
      marginTop:
        9,

      fontSize:
        11,

      color:
        '#7C7E79',

      fontWeight:
        '800',

      textAlign:
        'center',
    },

    graphStateSubText: {
      marginTop:
        4,

      fontSize:
        9,

      color:
        '#A1A29C',

      textAlign:
        'center',

      lineHeight:
        14,
    },

    graphErrorText: {
      marginTop:
        9,

      fontSize:
        10,

      color:
        '#B66E7D',

      fontWeight:
        '800',

      textAlign:
        'center',

      lineHeight:
        15,
    },

    retryButton: {
      marginTop:
        11,

      paddingHorizontal:
        12,

      paddingVertical:
        7,

      borderRadius:
        999,

      backgroundColor:
        '#E8F3EB',
    },

    retryButtonText: {
      fontSize:
        9,

      color:
        '#3A7654',

      fontWeight:
        '900',
    },

    top5Loading: {
      height:
        38,

      alignItems:
        'flex-start',

      justifyContent:
        'center',
    },

    top5EmptyText: {
      fontSize:
        10,

      color:
        '#A1A29C',

      paddingVertical:
        8,
    },

    monthlyStateContent: {
      flexGrow:
        1,

      minHeight:
        300,

      paddingHorizontal:
        18,

      paddingBottom:
        100,

      alignItems:
        'center',

      justifyContent:
        'center',
    },
  });