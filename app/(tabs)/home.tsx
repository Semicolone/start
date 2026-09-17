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

/* =========================================================
   HEATMAP
========================================================= */

const heatmapColors = [
  '#EEF4EA',
  '#DCEACF',
  '#BFD8A9',
  '#6FA46C',
];

type HeatmapData = Record<string, number>;

type HeatmapResult = {
  rows: number[][];
  label: string;
};

/* =========================================================
   한국 날짜
========================================================= */

/*
 * 현재 한국 날짜를 가져옴.
 *
 * 예:
 *
 * 한국 시간
 * 2026-08-28 01:00
 *
 * UTC
 * 2026-08-27 16:00
 *
 * 일반 new Date()에 의존하지 않고
 * Asia/Seoul 기준 년/월/일을 직접 가져옴.
 *
 * 반환 Date는 UTC 자정으로 만들어서
 * 이후 날짜 +/- 계산도 timezone 영향을 받지 않게 함.
 */
function getKoreaToday() {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          'Asia/Seoul',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type ===
          'year'
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          'month'
      )?.value
    );

  const day =
    Number(
      parts.find(
        (part) =>
          part.type ===
          'day'
      )?.value
    );

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}

/* =========================================================
   날짜 UTIL
========================================================= */

function formatDateKey(
  date: Date
) {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getUTCDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

function formatShortDate(
  date: Date
) {
  return `${
    date.getUTCMonth() + 1
  }/${date.getUTCDate()}`;
}

/* =========================================================
   HEATMAP LEVEL
========================================================= */

function getHeatmapLevel(
  count: number
) {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  return 3;
}

/* =========================================================
   최근 28일 HEATMAP
========================================================= */

/*
 * 한국 오늘 기준 최근 28일
 *
 * 오늘이 8/28이면
 *
 * 8/1 ~ 8/28
 *
 * 왼쪽 위 = 가장 오래된 날짜
 * 오른쪽 아래 = 오늘
 */
function buildRecent28Heatmap(
  heatmap?: HeatmapData
): HeatmapResult {
  const today =
    getKoreaToday();

  /*
   * 오늘 포함 최근 28일
   * 시작 날짜 = 오늘 - 27일
   */
  const firstDate =
    new Date(
      today.getTime()
    );

  firstDate.setUTCDate(
    firstDate.getUTCDate() -
      27
  );

  const flatLevels:
    number[] = [];

  /*
   * 정확히 28개의 날짜 생성
   */
  for (
    let index = 0;
    index < 28;
    index += 1
  ) {
    const date =
      new Date(
        firstDate.getTime()
      );

    date.setUTCDate(
      firstDate.getUTCDate() +
        index
    );

    const dateKey =
      formatDateKey(
        date
      );

    const count =
      Number(
        heatmap?.[
          dateKey
        ] ?? 0
      );

    flatLevels.push(
      getHeatmapLevel(
        count
      )
    );
  }

  /*
   * 28개
   * →
   * 7개 × 4줄
   */
  const rows = [
    flatLevels.slice(
      0,
      7
    ),

    flatLevels.slice(
      7,
      14
    ),

    flatLevels.slice(
      14,
      21
    ),

    flatLevels.slice(
      21,
      28
    ),
  ];

  return {
    rows,

    label:
      `${formatShortDate(
        firstDate
      )} - ${formatShortDate(
        today
      )}`,
  };
}

/* =========================================================
   STREAK
========================================================= */

/*
 * 연속 기록 일수
 *
 * 한국 날짜 기준.
 *
 * 오늘 기록이 있으면 오늘부터 계산.
 * 오늘 기록이 아직 없으면 어제부터 계산.
 */
function getCurrentStreak(
  heatmap?: HeatmapData
) {
  if (
    !heatmap ||
    typeof heatmap !==
      'object'
  ) {
    return 0;
  }

  const currentDate =
    getKoreaToday();

  const todayKey =
    formatDateKey(
      currentDate
    );

  const todayCount =
    Number(
      heatmap[
        todayKey
      ] ?? 0
    );

  /*
   * 오늘 아직 기록이 없으면
   * 어제부터 확인
   */
  if (todayCount <= 0) {
    currentDate.setUTCDate(
      currentDate.getUTCDate() -
        1
    );
  }

  let streak = 0;

  while (true) {
    const key =
      formatDateKey(
        currentDate
      );

    const count =
      Number(
        heatmap[
          key
        ] ?? 0
      );

    if (count <= 0) {
      break;
    }

    streak += 1;

    currentDate.setUTCDate(
      currentDate.getUTCDate() -
        1
    );
  }

  return streak;
}

/* =========================================================
   TYPES
========================================================= */

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

  icon:
    keyof typeof Ionicons.glyphMap;
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

/* =========================================================
   FALLBACK DATA
========================================================= */

const mockCategoryData:
  CategoryItem[] = [
    {
      name:
        '학습/공부',

      percent:
        40,

      count:
        0,

      color:
        '#1F7A4D',

      icon:
        'book-outline',
    },

    {
      name:
        '일상',

      percent:
        20,

      count:
        0,

      color:
        '#A6A299',

      icon:
        'sunny-outline',
    },

    {
      name:
        '커리어/진로',

      percent:
        20,

      count:
        0,

      color:
        '#8B6CC7',

      icon:
        'briefcase-outline',
    },

    {
      name:
        '감정/고민',

      percent:
        20,

      count:
        0,

      color:
        '#D45D79',

      icon:
        'heart-outline',
    },
  ];

const mockRecentQuestions:
  RecentQuestion[] = [
    {
      question:
        '개발자 취업 vs 대학원 진학',

      answer:
        '취업은 빠른 실무 경험, 대학원은 연구 역량 강화에 유리해요.',

      source:
        'Claude',

      category:
        '커리어/진로',

      categoryColor:
        '#8B6CC7',

      categoryBg:
        '#F2EAFE',

      date:
        '5/14',
    },

    {
      question:
        'Zustand vs Redux 비교',

      answer:
        '소규모 프로젝트는 Zustand, 대형 프로젝트는 Redux가 유리할 수 있어요.',

      source:
        'ChatGPT',

      category:
        '개발',

      categoryColor:
        '#4267D9',

      categoryBg:
        '#EEF2FF',

      date:
        '5/13',
    },

    {
      question:
        '자기소개서 지원 동기 작성법',

      answer:
        '구체적인 경험과 지원 회사의 특징을 연결해 작성하는 것이 좋아요.',

      source:
        'Claude',

      category:
        '커리어/진로',

      categoryColor:
        '#8B6CC7',

      categoryBg:
        '#F2EAFE',

      date:
        '5/12',
    },
  ];

/* =========================================================
   CATEGORY UTIL
========================================================= */

function getCategoryStyle(
  categoryName?: string
) {
  if (!categoryName) {
    return {
      category:
        '기타',

      categoryColor:
        '#2D6A4F',

      categoryBg:
        '#EAF7F0',
    };
  }

  if (
    categoryName.includes(
      '커리어'
    ) ||
    categoryName.includes(
      '진로'
    ) ||
    categoryName.includes(
      '업무'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#8B6CC7',

      categoryBg:
        '#F2EAFE',
    };
  }

  if (
    categoryName.includes(
      '개발'
    ) ||
    categoryName.includes(
      '코딩'
    ) ||
    categoryName.includes(
      '프로그래밍'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#4267D9',

      categoryBg:
        '#EEF2FF',
    };
  }

  if (
    categoryName.includes(
      '학습'
    ) ||
    categoryName.includes(
      '공부'
    ) ||
    categoryName.includes(
      '학교'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#2D9E6B',

      categoryBg:
        '#EAF7F0',
    };
  }

  if (
    categoryName.includes(
      '감정'
    ) ||
    categoryName.includes(
      '고민'
    ) ||
    categoryName.includes(
      '관계'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#D45D79',

      categoryBg:
        '#FCEEEF',
    };
  }

  if (
    categoryName.includes(
      '일상'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#888780',

      categoryBg:
        '#F5F4F0',
    };
  }

  if (
    categoryName.includes(
      '창작'
    ) ||
    categoryName.includes(
      '아이디어'
    )
  ) {
    return {
      category:
        categoryName,

      categoryColor:
        '#F4A261',

      categoryBg:
        '#FFF4E8',
    };
  }

  return {
    category:
      categoryName,

    categoryColor:
      '#2D6A4F',

    categoryBg:
      '#EAF7F0',
  };
}

function getCategoryTheme(
  name: string,
  index: number
) {
  if (
    name.includes(
      '커리어'
    ) ||
    name.includes(
      '진로'
    ) ||
    name.includes(
      '업무'
    )
  ) {
    return {
      color:
        '#8B6CC7',

      icon:
        'briefcase-outline' as const,
    };
  }

  if (
    name.includes(
      '개발'
    ) ||
    name.includes(
      '코딩'
    ) ||
    name.includes(
      '프로그래밍'
    )
  ) {
    return {
      color:
        '#4267D9',

      icon:
        'code-slash-outline' as const,
    };
  }

  if (
    name.includes(
      '학습'
    ) ||
    name.includes(
      '공부'
    ) ||
    name.includes(
      '학교'
    )
  ) {
    return {
      color:
        '#2D9E6B',

      icon:
        'book-outline' as const,
    };
  }

  if (
    name.includes(
      '감정'
    ) ||
    name.includes(
      '고민'
    ) ||
    name.includes(
      '관계'
    )
  ) {
    return {
      color:
        '#D45D79',

      icon:
        'heart-outline' as const,
    };
  }

  if (
    name.includes(
      '일상'
    )
  ) {
    return {
      color:
        '#A6A299',

      icon:
        'sunny-outline' as const,
    };
  }

  if (
    name.includes(
      '창작'
    ) ||
    name.includes(
      '아이디어'
    )
  ) {
    return {
      color:
        '#F4A261',

      icon:
        'bulb-outline' as const,
    };
  }

  const themes = [
    {
      color:
        '#2D9E6B',

      icon:
        'book-outline' as const,
    },

    {
      color:
        '#A6A299',

      icon:
        'sunny-outline' as const,
    },

    {
      color:
        '#8B6CC7',

      icon:
        'briefcase-outline' as const,
    },

    {
      color:
        '#D45D79',

      icon:
        'heart-outline' as const,
    },
  ];

  return themes[
    index %
      themes.length
  ];
}

/* =========================================================
   RECENT DATE
========================================================= */

function formatDate(
  raw?: string
) {
  if (!raw) {
    return '';
  }

  if (
    raw.includes(
      'T'
    )
  ) {
    return raw
      .slice(
        5,
        10
      )
      .replace(
        '-',
        '/'
      );
  }

  if (
    raw.includes(
      '-'
    )
  ) {
    return raw
      .slice(
        5,
        10
      )
      .replace(
        '-',
        '/'
      );
  }

  return raw;
}

/* =========================================================
   HOME
========================================================= */

export default function HomeScreen() {
  const [
    homeData,
    setHomeData,
  ] =
    useState<HomeData>({
      username:
        '채원',

      totalQuestions:
        0,

      activeDays:
        0,

      aiToolCount:
        0,
    });

  const [
    categoryData,
    setCategoryData,
  ] =
    useState<
      CategoryItem[]
    >(
      mockCategoryData
    );

  const [
    recentQuestions,
    setRecentQuestions,
  ] =
    useState<
      RecentQuestion[]
    >(
      mockRecentQuestions
    );

  /*
   * 최근 28일
   *
   * 4행 × 7열
   */
  const [
    heatmapRows,
    setHeatmapRows,
  ] =
    useState<
      number[][]
    >(
      Array.from(
        {
          length:
            4,
        },

        () =>
          Array(
            7
          ).fill(0)
      )
    );

  /*
   * 8/1 - 8/28
   */
  const [
    heatmapLabel,
    setHeatmapLabel,
  ] =
    useState(
      ''
    );

  /*
   * n일 연속 기록
   */
  const [
    streakDays,
    setStreakDays,
  ] =
    useState(0);

  /* =====================================================
     HOME API
  ===================================================== */

  const fetchHomeData =
    async () => {
      try {
        const data =
          await homeApi.getHome();

        console.log(
          '홈 API 응답:',
          data
        );

        /* =================================
           HEATMAP
        ================================= */

        const heatmapResult =
          buildRecent28Heatmap(
            data?.heatmap
          );

        setHeatmapRows(
          heatmapResult.rows
        );

        setHeatmapLabel(
          heatmapResult.label
        );

        setStreakDays(
          getCurrentStreak(
            data?.heatmap
          )
        );

        /* =================================
           HOME DATA
        ================================= */

        const greetingText =
          data?.greeting ||
          '';

        const extractedName =
          data?.username ||
          data?.name ||
          data?.user
            ?.username ||
          data?.user
            ?.name ||
          (
            greetingText.includes(
              '님'
            )
              ? greetingText.split(
                  '님'
                )[0]
              : '채원'
          );

        setHomeData({
          username:
            extractedName,

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

        /* =================================
           최근 인사이트
        ================================= */

        if (
          Array.isArray(
            data?.recent_insights
          )
        ) {
          const mappedRecent =
            data
              .recent_insights
              .slice(
                0,
                3
              )
              .map(
                (
                  item: any
                ) => {
                  const categoryInfo =
                    getCategoryStyle(
                      item?.category_name ||
                        item?.category ||
                        item?.categoryName ||
                        item
                          ?.category
                          ?.name
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

                    source:
                      item?.ai_source ||
                      item?.source ||
                      'AI',

                    category:
                      categoryInfo
                        .category,

                    categoryColor:
                      categoryInfo
                        .categoryColor,

                    categoryBg:
                      categoryInfo
                        .categoryBg,

                    date:
                      formatDate(
                        item?.created_at ||
                          item?.date
                      ),
                  };
                }
              );

          setRecentQuestions(
            mappedRecent
          );
        }

        /* =================================
           CATEGORY
        ================================= */

        if (
          Array.isArray(
            data?.category_distribution
          )
        ) {
          const mappedCategories =
            data
              .category_distribution
              .map(
                (
                  item: any,
                  index: number
                ) => {
                  const name =
                    item?.name ||
                    item?.category ||
                    item?.category_name ||
                    '기타';

                  const theme =
                    getCategoryTheme(
                      name,
                      index
                    );

                  return {
                    name,

                    percent:
                      Number(
                        item?.percent ??
                          0
                      ),

                    count:
                      Number(
                        item?.count ??
                          0
                      ),

                    color:
                      theme.color,

                    icon:
                      theme.icon,
                  };
                }
              );

          setCategoryData(
            mappedCategories
          );
        }
      } catch (
        error
      ) {
        console.log(
          '홈 데이터 불러오기 실패:',
          error
        );
      }
    };

  /*
   * Home으로 돌아올 때마다
   * 데이터 다시 불러오기
   */
  useFocusEffect(
    useCallback(
      () => {
        fetchHomeData();
      },
      []
    )
  );

  const sortedCategories =
    [
      ...categoryData,
    ]
      .sort(
        (
          a,
          b
        ) =>
          Number(
            b.percent
          ) -
          Number(
            a.percent
          )
      )
      .slice(
        0,
        4
      );

  const topCategory =
    sortedCategories.length >
    0
      ? sortedCategories[
          0
        ]
      : null;

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
          <View
            style={
              styles.topLeafBg
            }
          />

          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={
              styles.header
            }
          >
            <View
              style={
                styles.headerSide
              }
            />

            <View
              style={
                styles.logoRow
              }
            >
              <Image
                source={
                  logoLeaf
                }
                style={
                  styles.logoLeaf
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.logoText
                }
              >
                FLOW
              </Text>
            </View>

            {/* 돋보기 제거 후
                가운데 FLOW 위치 유지 */}
            <View
              style={
                styles.headerSide
              }
            />
          </View>

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
                초록 인사이트 카드
            ================================================= */}

            <View
              style={
                styles.insightCard
              }
            >
              <View
                style={
                  styles.insightCardDecorTop
                }
              />

              <View
                style={
                  styles.insightCardDecorBottom
                }
              />

              <Text
                style={
                  styles.insightGreeting
                }
              >
                안녕하세요,{' '}
                {
                  homeData.username
                }
                님 👋
              </Text>

              <View
                style={
                  styles.insightCountRow
                }
              >
                <Text
                  style={
                    styles.insightCount
                  }
                >
                  {
                    homeData.totalQuestions
                  }
                </Text>

                <Text
                  style={
                    styles.insightCountLabel
                  }
                >
                  개의 인사이트
                </Text>
              </View>

              <Text
                style={
                  styles.insightSub
                }
              >
                이번 달 나를 알아가는 기록이에요
              </Text>

              <View
                style={
                  styles.insightBottomRow
                }
              >
                <View
                  style={
                    styles.insightMiniStat
                  }
                >
                  <Text
                    style={
                      styles.insightMiniLabel
                    }
                  >
                    활동일
                  </Text>

                  <Text
                    style={
                      styles.insightMiniValue
                    }
                  >
                    {
                      homeData.activeDays
                    }
                    일
                  </Text>
                </View>

                <View
                  style={
                    styles.insightMiniStat
                  }
                >
                  <Text
                    style={
                      styles.insightMiniLabel
                    }
                  >
                    AI 도구
                  </Text>

                  <Text
                    style={
                      styles.insightMiniValue
                    }
                  >
                    {
                      homeData.aiToolCount
                    }
                    개
                  </Text>
                </View>

                {/* 오른쪽 화살표 → 월간 회고 */}

                <Pressable
                  style={
                    styles.insightArrowBox
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        '/ai-report',

                      params: {
                        tab:
                          'monthly',
                      },
                    })
                  }
                >
                  <Ionicons
                    name="arrow-forward"
                    size={
                      21
                    }
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
            </View>

            {/* =================================================
                활동 히트맵

                ★ 한국 기준 최근 28일
                ★ 요일 없음
                ★ 최근 28일 글씨 없음
                ★ 날짜 가운데
                ★ 4 x 7
            ================================================= */}

            <View
              style={
                styles.heatmapCard
              }
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.cardTitle
                    }
                  >
                    활동 히트맵
                  </Text>

                  <Text
                    style={
                      styles.heatmapSubtitle
                    }
                  >
                    {streakDays}일 연속 기록 중이에요
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/explore?tab=calendar'
                    )
                  }
                >
                  <Text
                    style={
                      styles.viewAllText
                    }
                  >
                    캘린더 보기 →
                  </Text>
                </Pressable>
              </View>

              {/* 날짜 범위만 가운데 표시 */}

              <Text
                style={
                  styles.heatmapDateText
                }
              >
                {
                  heatmapLabel
                }
              </Text>

              {/* 28개 */}

              <View
                style={
                  styles.heatmapGrid
                }
              >
                {
                  heatmapRows.map(
                    (
                      row,
                      rowIndex
                    ) => (
                      <View
                        key={
                          rowIndex
                        }
                        style={
                          styles.heatmapRow
                        }
                      >
                        {
                          row.map(
                            (
                              level,
                              index
                            ) => (
                              <View
                                key={`${rowIndex}-${index}`}
                                style={[
                                  styles.heatCell,

                                  {
                                    backgroundColor:
                                      heatmapColors[
                                        level
                                      ] ||
                                      heatmapColors[
                                        0
                                      ],
                                  },
                                ]}
                              />
                            )
                          )
                        }
                      </View>
                    )
                  )
                }
              </View>

              {/* 적음 / 많음 */}

              <View
                style={
                  styles.legendRow
                }
              >
                <Text
                  style={
                    styles.legendText
                  }
                >
                  적음
                </Text>

                <View
                  style={
                    styles.legendCells
                  }
                >
                  {
                    heatmapColors.map(
                      (
                        color
                      ) => (
                        <View
                          key={
                            color
                          }
                          style={[
                            styles.legendCell,

                            {
                              backgroundColor:
                                color,
                            },
                          ]}
                        />
                      )
                    )
                  }
                </View>

                <Text
                  style={
                    styles.legendText
                  }
                >
                  많음
                </Text>
              </View>
            </View>

            {/* =================================================
                CATEGORY
            ================================================= */}

            <View
              style={
                styles.categoryCard
              }
            >
              <Text
                style={
                  styles.categoryTitle
                }
              >
                무엇을 많이 물었나요
              </Text>

              {
                topCategory ? (
                  <Text
                    style={
                      styles.categorySubtitle
                    }
                  >
                    {
                      topCategory.name
                    }
                    를 가장 많이 물었어요
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.categorySubtitle
                    }
                  >
                    질문을 기록하면 관심 주제를 보여드려요
                  </Text>
                )
              }

              {
                sortedCategories.length >
                0 ? (
                  <>
                    <View
                      style={
                        styles.categoryStackBar
                      }
                    >
                      {
                        sortedCategories.map(
                          (
                            item,
                            index
                          ) => (
                            <View
                              key={
                                item.name
                              }
                              style={[
                                styles.categoryStackPart,

                                {
                                  flex:
                                    Math.max(
                                      item.percent,
                                      1
                                    ),

                                  backgroundColor:
                                    item.color,

                                  marginRight:
                                    index ===
                                    sortedCategories.length -
                                      1
                                      ? 0
                                      : 3,
                                },
                              ]}
                            />
                          )
                        )
                      }
                    </View>

                    <View
                      style={
                        styles.categoryLegendGrid
                      }
                    >
                      {
                        sortedCategories.map(
                          (
                            item
                          ) => (
                            <View
                              key={
                                item.name
                              }
                              style={
                                styles.categoryLegendItem
                              }
                            >
                              <View
                                style={
                                  styles.categoryLegendLeft
                                }
                              >
                                <View
                                  style={[
                                    styles.categoryDot,

                                    {
                                      backgroundColor:
                                        item.color,
                                    },
                                  ]}
                                />

                                <Text
                                  style={
                                    styles.categoryLegendName
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {
                                    item.name
                                  }
                                </Text>
                              </View>

                              <Text
                                style={
                                  styles.categoryLegendPercent
                                }
                              >
                                {
                                  Math.round(
                                    item.percent
                                  )
                                }
                                %
                              </Text>
                            </View>
                          )
                        )
                      }
                    </View>
                  </>
                ) : (
                  <Text
                    style={
                      styles.emptySmallText
                    }
                  >
                    아직 카테고리 데이터가 없어요.
                  </Text>
                )
              }
            </View>

            {/* =================================================
                최근 인사이트
            ================================================= */}

            <View
              style={
                styles.recentCard
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.recentTitle
                  }
                >
                  최근 인사이트
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/recent'
                    )
                  }
                >
                  <Text
                    style={
                      styles.viewAllText
                    }
                  >
                    전체 보기 →
                  </Text>
                </Pressable>
              </View>

              {
                recentQuestions.length >
                0 ? (
                  recentQuestions.map(
                    (
                      item,
                      index
                    ) => (
                      <View
                        key={`${item.question}-${index}`}
                        style={[
                          styles.recentItem,

                          index !==
                            recentQuestions.length -
                              1 &&
                            styles.recentDivider,
                        ]}
                      >
                        <Text
                          style={
                            styles.recentQuestion
                          }
                        >
                          {
                            item.question
                          }
                        </Text>

                        <Text
                          style={
                            styles.recentAnswer
                          }
                        >
                          {
                            item.answer
                          }
                        </Text>

                        <View
                          style={
                            styles.recentMetaRow
                          }
                        >
                          <View
                            style={
                              styles.sourceBadge
                            }
                          >
                            <Text
                              style={
                                styles.sourceBadgeText
                              }
                            >
                              {
                                item.source
                              }
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.categoryBadge,

                              {
                                backgroundColor:
                                  item.categoryBg,

                                borderColor:
                                  item.categoryColor +
                                  '55',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryBadgeText,

                                {
                                  color:
                                    item.categoryColor,
                                },
                              ]}
                            >
                              {
                                item.category
                              }
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.dateText
                            }
                          >
                            {
                              item.date
                            }
                          </Text>
                        </View>
                      </View>
                    )
                  )
                ) : (
                  <Text
                    style={
                      styles.emptySmallText
                    }
                  >
                    아직 최근 인사이트가 없어요.
                  </Text>
                )
              }
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   STYLE
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex:
        1,

      backgroundColor:
        '#EAE5DA',
    },

    outer: {
      flex:
        1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EAE5DA',
    },

    phone: {
      width:
        '100%',

      maxWidth:
        360,

      height:
        '100%',

      minHeight:
        640,

      backgroundColor:
        '#F7F6F1',

      position:
        'relative',

      overflow:
        'hidden',
    },

    topLeafBg: {
      position:
        'absolute',

      top:
        70,

      right:
        -40,

      width:
        205,

      height:
        82,

      borderRadius:
        80,

      backgroundColor:
        '#EAF3E8',

      opacity:
        0.7,

      transform: [
        {
          rotate:
            '-15deg',
        },
      ],
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      height:
        76,

      paddingTop:
        34,

      paddingHorizontal:
        18,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      zIndex:
        3,
    },

    headerSide: {
      width:
        34,

      height:
        34,
    },

    logoRow: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    logoLeaf: {
      width:
        23,

      height:
        23,

      marginRight:
        5,
    },

    logoText: {
      fontSize:
        17,

      color:
        '#1F5F3F',

      fontWeight:
        '900',

      letterSpacing:
        1.2,
    },

    scroll: {
      flex:
        1,
    },

    scrollContent: {
      paddingHorizontal:
        18,

      paddingBottom:
        42,
    },

    /* =====================================================
       GREEN INSIGHT CARD
    ===================================================== */

    insightCard: {
      position:
        'relative',

      minHeight:
        214,

      marginTop:
        4,

      marginBottom:
        14,

      paddingTop:
        20,

      paddingHorizontal:
        20,

      paddingBottom:
        20,

      backgroundColor:
        '#2D6A4F',

      borderRadius:
        18,

      overflow:
        'hidden',

      shadowColor:
        '#1A4431',

      shadowOpacity:
        0.12,

      shadowRadius:
        12,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      elevation:
        3,
    },

    insightCardDecorTop: {
      position:
        'absolute',

      width:
        165,

      height:
        165,

      borderRadius:
        55,

      backgroundColor:
        '#FFFFFF',

      opacity:
        0.055,

      top:
        -72,

      right:
        -62,

      transform: [
        {
          rotate:
            '30deg',
        },
      ],
    },

    insightCardDecorBottom: {
      position:
        'absolute',

      width:
        96,

      height:
        96,

      borderRadius:
        36,

      backgroundColor:
        '#FFFFFF',

      opacity:
        0.045,

      right:
        18,

      bottom:
        -42,

      transform: [
        {
          rotate:
            '30deg',
        },
      ],
    },

    insightGreeting: {
      fontSize:
        12,

      color:
        '#D8E9DF',

      fontWeight:
        '800',

      marginBottom:
        1,
    },

    insightCountRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',
    },

    insightCount: {
      fontSize:
        48,

      lineHeight:
        58,

      color:
        '#FFFFFF',

      fontWeight:
        '900',

      letterSpacing:
        -1,
    },

    insightCountLabel: {
      marginLeft:
        7,

      marginBottom:
        9,

      fontSize:
        15,

      color:
        '#FFFFFF',

      fontWeight:
        '900',
    },

    insightSub: {
      fontSize:
        12,

      color:
        '#D8E8DF',

      fontWeight:
        '700',

      marginBottom:
        15,
    },

    insightBottomRow: {
      flexDirection:
        'row',

      gap:
        8,

      alignItems:
        'center',
    },

    insightMiniStat: {
      flex:
        1,

      minHeight:
        63,

      borderRadius:
        12,

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      backgroundColor:
        'rgba(255,255,255,0.12)',
    },

    insightMiniLabel: {
      fontSize:
        11,

      color:
        '#D8E8DF',

      fontWeight:
        '700',

      marginBottom:
        3,
    },

    insightMiniValue: {
      fontSize:
        19,

      color:
        '#FFFFFF',

      fontWeight:
        '900',
    },

    insightArrowBox: {
      width:
        52,

      height:
        63,

      borderRadius:
        12,

      backgroundColor:
        'rgba(255,255,255,0.12)',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* =====================================================
       HEATMAP
    ===================================================== */

    heatmapCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius:
        18,

      padding:
        16,

      marginBottom:
        14,

      borderWidth:
        1,

      borderColor:
        '#F0ECE5',

      shadowColor:
        '#000',

      shadowOpacity:
        0.045,

      shadowRadius:
        10,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      elevation:
        2,
    },

    cardHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      marginBottom:
        12,
    },

    cardTitle: {
      fontSize:
        17,

      fontWeight:
        '900',

      color:
        '#111827',
    },

    heatmapSubtitle: {
      marginTop:
        4,

      fontSize:
        11,

      color:
        '#9CA3AF',

      fontWeight:
        '700',
    },

    viewAllText: {
      fontSize:
        12,

      color:
        '#1F7A4D',

      fontWeight:
        '800',
    },

    /*
     * 날짜 범위
     *
     * 가운데 정렬
     *
     * ex)
     * 8/1 - 8/28
     */
    heatmapDateText: {
      width:
        '100%',

      textAlign:
        'center',

      fontSize:
        11,

      color:
        '#6B7280',

      fontWeight:
        '900',

      marginBottom:
        10,
    },

    /* 4줄 */

    heatmapGrid: {
      gap:
        7,
    },

    /* 7개 */

    heatmapRow: {
      flexDirection:
        'row',

      gap:
        7,
    },

    /*
     * 카드 너비에 맞춰
     * 동일 크기로 7개
     */
    heatCell: {
      flex:
        1,

      height:
        25,

      borderRadius:
        6,
    },

    /* 적음 ~ 많음 */

    legendRow: {
      marginTop:
        13,

      flexDirection:
        'row',

      justifyContent:
        'flex-end',

      alignItems:
        'center',

      gap:
        7,
    },

    legendText: {
      fontSize:
        11,

      color:
        '#6B7280',

      fontWeight:
        '700',
    },

    legendCells: {
      flexDirection:
        'row',

      gap:
        4,
    },

    legendCell: {
      width:
        14,

      height:
        8,

      borderRadius:
        2,
    },

    /* =====================================================
       CATEGORY
    ===================================================== */

    categoryCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius:
        18,

      padding:
        17,

      marginBottom:
        14,

      borderWidth:
        1,

      borderColor:
        '#F0ECE5',

      shadowColor:
        '#000',

      shadowOpacity:
        0.045,

      shadowRadius:
        10,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      elevation:
        2,
    },

    categoryTitle: {
      fontSize:
        17,

      fontWeight:
        '900',

      color:
        '#111827',
    },

    categorySubtitle: {
      marginTop:
        4,

      marginBottom:
        14,

      fontSize:
        11,

      color:
        '#8B8B84',

      fontWeight:
        '700',
    },

    categoryStackBar: {
      height:
        12,

      flexDirection:
        'row',

      borderRadius:
        999,

      overflow:
        'hidden',

      marginBottom:
        14,
    },

    categoryStackPart: {
      height:
        '100%',
    },

    categoryLegendGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'space-between',

      rowGap:
        10,
    },

    categoryLegendItem: {
      width:
        '48%',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    categoryLegendLeft: {
      flex:
        1,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    categoryDot: {
      width:
        9,

      height:
        9,

      borderRadius:
        999,

      marginRight:
        7,
    },

    categoryLegendName: {
      flex:
        1,

      fontSize:
        11,

      color:
        '#5F5F59',

      fontWeight:
        '800',
    },

    categoryLegendPercent: {
      marginLeft:
        6,

      fontSize:
        11,

      color:
        '#4B4B46',

      fontWeight:
        '900',
    },

    /* =====================================================
       RECENT
    ===================================================== */

    recentCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius:
        18,

      padding:
        18,

      marginBottom:
        14,

      borderWidth:
        1,

      borderColor:
        '#F0ECE5',

      shadowColor:
        '#000',

      shadowOpacity:
        0.045,

      shadowRadius:
        10,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      elevation:
        2,
    },

    sectionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    recentTitle: {
      fontSize:
        16,

      fontWeight:
        '900',

      color:
        '#6B7280',

      marginBottom:
        15,
    },

    recentItem: {
      paddingVertical:
        14,
    },

    recentDivider: {
      borderBottomWidth:
        1,

      borderBottomColor:
        '#ECE8DF',
    },

    recentQuestion: {
      fontSize:
        16,

      color:
        '#111827',

      fontWeight:
        '900',

      lineHeight:
        22,

      marginBottom:
        8,
    },

    recentAnswer: {
      fontSize:
        14,

      color:
        '#6B7280',

      fontWeight:
        '600',

      lineHeight:
        21,

      marginBottom:
        9,
    },

    recentMetaRow: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    sourceBadge: {
      backgroundColor:
        '#F7F7F4',

      borderWidth:
        1,

      borderColor:
        '#E8E3DA',

      borderRadius:
        999,

      paddingHorizontal:
        11,

      paddingVertical:
        4,

      marginRight:
        7,
    },

    sourceBadgeText: {
      fontSize:
        12,

      color:
        '#6B7280',

      fontWeight:
        '900',
    },

    categoryBadge: {
      borderWidth:
        1,

      borderRadius:
        999,

      paddingHorizontal:
        11,

      paddingVertical:
        4,
    },

    categoryBadgeText: {
      fontSize:
        12,

      fontWeight:
        '900',
    },

    dateText: {
      marginLeft:
        'auto',

      fontSize:
        14,

      color:
        '#9CA3AF',

      fontWeight:
        '800',
    },

    emptySmallText: {
      fontSize:
        13,

      color:
        '#9CA3AF',

      fontWeight:
        '700',

      lineHeight:
        20,
    },
  });