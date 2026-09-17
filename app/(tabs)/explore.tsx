import { Ionicons } from '@expo/vector-icons';
import {
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';

import {
    useCallback,
    useEffect,
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

import {
    categoryApi,
    homeApi,
} from '../../lib/client';

/* =========================================================
   TYPES
========================================================= */

type ExploreMode =
  | 'calendar'
  | 'category';

type CalendarInsight = {
  id: number;

  question_summary: string;

  answer_summary: string;

  category_name: string;

  ai_source: string;
};

type CalendarDays = Record<
  string,
  CalendarInsight[]
>;

type CategoryItem = {
  id: number;

  name: string;

  count: number;

  color: string;

  icon:
    keyof typeof Ionicons.glyphMap;
};

type InsightItem = {
  id: number;

  question_summary?: string;

  question_original?: string;

  answer_summary?: string;

  answer_original?: string;

  ai_source?: string;

  created_at?: string;
};

/* =========================================================
   CATEGORY THEME
========================================================= */

function getCategoryTheme(
  name: string
) {
  if (
    name.includes('커리어') ||
    name.includes('진로')
  ) {
    return {
      color: '#7b5ea7',
      icon:
        'briefcase-outline' as const,
    };
  }

  if (
    name.includes('개발')
  ) {
    return {
      color: '#3b5bdb',
      icon:
        'code-slash-outline' as const,
    };
  }

  if (
    name.includes('학습') ||
    name.includes('공부')
  ) {
    return {
      color: '#2d9e6b',
      icon:
        'book-outline' as const,
    };
  }

  if (
    name.includes('감정') ||
    name.includes('고민')
  ) {
    return {
      color: '#d45d79',
      icon:
        'heart-outline' as const,
    };
  }

  if (
    name.includes('창작')
  ) {
    return {
      color: '#e07b39',
      icon:
        'bulb-outline' as const,
    };
  }

  if (
    name.includes('일상')
  ) {
    return {
      color: '#888780',
      icon:
        'sunny-outline' as const,
    };
  }

  return {
    color: '#2d6a4f',
    icon:
      'folder-outline' as const,
  };
}

/* =========================================================
   DATE UTIL
========================================================= */

const WEEKDAYS = [
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '일',
];

function pad2(value: number) {
  return String(
    value
  ).padStart(
    2,
    '0'
  );
}

function formatShortDate(
  month: number,
  day: number
) {
  return `${pad2(
    month
  )}/${pad2(day)}`;
}

/*
 * 월요일 시작 달력
 */
function makeCalendarCells(
  year: number,
  month: number
) {
  const firstDay =
    new Date(
      year,
      month - 1,
      1
    );

  const lastDay =
    new Date(
      year,
      month,
      0
    ).getDate();

  /*
   * JS:
   * 일 0 / 월 1 ...
   *
   * 변환:
   * 월 0 / 화 1 ... 일 6
   */
  const startOffset =
    (
      firstDay.getDay() +
      6
    ) %
    7;

  const cells:
    Array<
      number | null
    > = [];

  for (
    let i = 0;
    i < startOffset;
    i += 1
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= lastDay;
    day += 1
  ) {
    cells.push(day);
  }

  while (
    cells.length %
      7 !==
    0
  ) {
    cells.push(null);
  }

  const rows:
    Array<
      Array<number | null>
    > = [];

  for (
    let i = 0;
    i < cells.length;
    i += 7
  ) {
    rows.push(
      cells.slice(
        i,
        i + 7
      )
    );
  }

  return rows;
}

function formatInsightDate(
  raw?: string
) {
  if (!raw) {
    return '';
  }

  if (
    raw.includes('T')
  ) {
    return raw
      .slice(5, 10)
      .replace(
        '-',
        '/'
      );
  }

  return raw;
}

/* =========================================================
   SCREEN
========================================================= */

export default function ExploreScreen() {
  const params =
    useLocalSearchParams<{
      tab?:
        | string
        | string[];
    }>();

  const [
    mode,
    setMode,
  ] =
    useState<ExploreMode>(
      'calendar'
    );

  /* =====================================================
     CALENDAR STATE
  ===================================================== */

  const today =
    new Date();

  const [
    year,
    setYear,
  ] = useState(
    today.getFullYear()
  );

  const [
    month,
    setMonth,
  ] = useState(
    today.getMonth() + 1
  );

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(
    today.getDate()
  );

  const [
    calendarDays,
    setCalendarDays,
  ] =
    useState<CalendarDays>(
      {}
    );

  const [
    calendarLoading,
    setCalendarLoading,
  ] =
    useState(false);

  const [
    calendarError,
    setCalendarError,
  ] =
    useState('');

  /* =====================================================
     CATEGORY STATE
  ===================================================== */

  const [
    categories,
    setCategories,
  ] =
    useState<
      CategoryItem[]
    >([]);

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] =
    useState<
      number | null
    >(null);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<
      CategoryItem | undefined
    >(undefined);

  const [
    categoryInsights,
    setCategoryInsights,
  ] =
    useState<
      InsightItem[]
    >([]);

  const [
    categoryLoading,
    setCategoryLoading,
  ] =
    useState(false);

  const [
    insightLoading,
    setInsightLoading,
  ] =
    useState(false);

  const [
    categoryError,
    setCategoryError,
  ] =
    useState('');

  /* =====================================================
     PARAM
  ===================================================== */

  useEffect(() => {
    const tab =
      Array.isArray(
        params.tab
      )
        ? params.tab[0]
        : params.tab;

    if (
      tab ===
      'calendar'
    ) {
      setMode(
        'calendar'
      );
    }

    if (
      tab ===
      'category'
    ) {
      setMode(
        'category'
      );
    }
  }, [params.tab]);

  /* =====================================================
     CALENDAR API
  ===================================================== */

  const fetchCalendar =
    async () => {
      try {
        setCalendarLoading(
          true
        );

        setCalendarError(
          ''
        );

        const data =
          await homeApi.getCalendar(
            {
              year,
              month,
            }
          );

        console.log(
          '캘린더 API 응답:',
          data
        );

        setCalendarDays(
          data?.days &&
            typeof data.days ===
              'object'
            ? data.days
            : {}
        );
      } catch (
        error: any
      ) {
        console.log(
          '캘린더 불러오기 실패:',
          error
        );

        setCalendarDays(
          {}
        );

        setCalendarError(
          error?.message ||
            '캘린더를 불러오지 못했습니다.'
        );
      } finally {
        setCalendarLoading(
          false
        );
      }
    };

  /* =====================================================
     CATEGORY API
  ===================================================== */

  const fetchInsightsByCategory =
    async (
      categoryId: number
    ) => {
      try {
        setInsightLoading(
          true
        );

        const data =
          await categoryApi.getInsights(
            categoryId
          );

        setCategoryInsights(
          Array.isArray(
            data?.insights
          )
            ? data.insights
            : Array.isArray(
                data
              )
            ? data
            : []
        );
      } catch (
        error: any
      ) {
        console.log(
          '카테고리 인사이트 실패:',
          error
        );

        setCategoryInsights(
          []
        );
      } finally {
        setInsightLoading(
          false
        );
      }
    };

  const fetchCategories =
    async () => {
      try {
        setCategoryLoading(
          true
        );

        setCategoryError(
          ''
        );

        const data =
          await categoryApi.getList();

        const rawList =
          Array.isArray(
            data
          )
            ? data
            : [];

        const mapped =
          rawList.map(
            (
              item: any
            ) => {
              const theme =
                getCategoryTheme(
                  item?.name ||
                    '기타'
                );

              return {
                id:
                  Number(
                    item?.id
                  ),

                name:
                  item?.name ||
                  '기타',

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

        setCategories(
          mapped
        );

        if (
          mapped.length >
          0
        ) {
          /*
           * 기존 선택 카테고리가 있으면 유지
           */
          const existing =
            mapped.find(
              (item) =>
                item.id ===
                selectedCategoryId
            );

          const next =
            existing ||
            mapped[0];

          setSelectedCategoryId(
            next.id
          );

          setSelectedCategory(
            next
          );

          await fetchInsightsByCategory(
            next.id
          );
        }
      } catch (
        error: any
      ) {
        console.log(
          '카테고리 불러오기 실패:',
          error
        );

        setCategoryError(
          error?.message ||
            '카테고리를 불러오지 못했습니다.'
        );
      } finally {
        setCategoryLoading(
          false
        );
      }
    };

  /* =====================================================
     SCREEN FOCUS
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      if (
        mode ===
        'calendar'
      ) {
        fetchCalendar();
      } else {
        fetchCategories();
      }
    }, [
      mode,
      year,
      month,
    ])
  );

  /* =====================================================
     MONTH CHANGE
  ===================================================== */

  const goPrevMonth =
    () => {
      if (
        month === 1
      ) {
        setYear(
          year - 1
        );

        setMonth(12);
      } else {
        setMonth(
          month - 1
        );
      }

      setSelectedDay(
        1
      );
    };

  const goNextMonth =
    () => {
      if (
        month === 12
      ) {
        setYear(
          year + 1
        );

        setMonth(1);
      } else {
        setMonth(
          month + 1
        );
      }

      setSelectedDay(
        1
      );
    };

  /* =====================================================
     DERIVED
  ===================================================== */

  const calendarRows =
    makeCalendarCells(
      year,
      month
    );

  const selectedInsights =
    calendarDays[
      String(
        selectedDay
      )
    ] || [];

  const isCurrentMonth =
    year ===
      today.getFullYear() &&
    month ===
      today.getMonth() +
        1;

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
            <Text
              style={
                styles.title
              }
            >
              탐색
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              날짜 또는 주제로 저장된 인사이트를 찾아봐요
            </Text>

            {/* =================================================
                SEGMENT
            ================================================= */}

            <View
              style={
                styles.segment
              }
            >
              <Pressable
                style={[
                  styles.segmentButton,

                  mode ===
                    'calendar' &&
                    styles.segmentButtonActive,
                ]}
                onPress={() =>
                  setMode(
                    'calendar'
                  )
                }
              >
                <Text
                  style={[
                    styles.segmentText,

                    mode ===
                      'calendar' &&
                      styles.segmentTextActive,
                  ]}
                >
                  캘린더
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.segmentButton,

                  mode ===
                    'category' &&
                    styles.segmentButtonActive,
                ]}
                onPress={() =>
                  setMode(
                    'category'
                  )
                }
              >
                <Text
                  style={[
                    styles.segmentText,

                    mode ===
                      'category' &&
                      styles.segmentTextActive,
                  ]}
                >
                  카테고리
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =================================================
              CALENDAR
          ================================================= */}

          {mode ===
          'calendar' ? (
            <ScrollView
              style={
                styles.scroll
              }
              contentContainerStyle={
                styles.calendarContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* MONTH */}

              <View
                style={
                  styles.monthNav
                }
              >
                <Pressable
                  style={
                    styles.monthArrow
                  }
                  onPress={
                    goPrevMonth
                  }
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color="#B4B2AC"
                  />
                </Pressable>

                <Text
                  style={
                    styles.monthTitle
                  }
                >
                  {year}년{' '}
                  {month}월
                </Text>

                <Pressable
                  style={
                    styles.monthArrow
                  }
                  onPress={
                    goNextMonth
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#B4B2AC"
                  />
                </Pressable>
              </View>

              {/* WEEKDAY */}

              <View
                style={
                  styles.weekdayRow
                }
              >
                {WEEKDAYS.map(
                  (day) => (
                    <Text
                      key={day}
                      style={
                        styles.weekdayText
                      }
                    >
                      {
                        day
                      }
                    </Text>
                  )
                )}
              </View>

              {/* LOADING */}

              {calendarLoading ? (
                <View
                  style={
                    styles.calendarLoading
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
                    캘린더를 불러오는 중이에요...
                  </Text>
                </View>
              ) : (
                <>
                  {/* DATE GRID */}

                  <View
                    style={
                      styles.calendarGrid
                    }
                  >
                    {calendarRows.map(
                      (
                        row,
                        rowIndex
                      ) => (
                        <View
                          key={
                            rowIndex
                          }
                          style={
                            styles.calendarRow
                          }
                        >
                          {row.map(
                            (
                              day,
                              columnIndex
                            ) => {
                              if (
                                day ===
                                null
                              ) {
                                return (
                                  <View
                                    key={`empty-${rowIndex}-${columnIndex}`}
                                    style={
                                      styles.dayCell
                                    }
                                  />
                                );
                              }

                              const dayInsights =
                                calendarDays[
                                  String(
                                    day
                                  )
                                ] ||
                                [];

                              const hasInsights =
                                dayInsights.length >
                                0;

                              const isSelected =
                                selectedDay ===
                                day;

                              const isToday =
                                isCurrentMonth &&
                                day ===
                                  today.getDate();

                              return (
                                <Pressable
                                  key={
                                    day
                                  }
                                  style={[
                                    styles.dayCell,

                                    isToday &&
                                      styles.todayCell,

                                    isSelected &&
                                      styles.selectedCell,
                                  ]}
                                  onPress={() =>
                                    setSelectedDay(
                                      day
                                    )
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.dayText,

                                      isToday &&
                                        styles.todayText,

                                      isSelected &&
                                        styles.selectedDayText,
                                    ]}
                                  >
                                    {
                                      day
                                    }
                                  </Text>

                                  <View
                                    style={
                                      styles.dotRow
                                    }
                                  >
                                    {hasInsights &&
                                      dayInsights
                                        .slice(
                                          0,
                                          3
                                        )
                                        .map(
                                          (
                                            insight,
                                            index
                                          ) => {
                                            const theme =
                                              getCategoryTheme(
                                                insight.category_name
                                              );

                                            return (
                                              <View
                                                key={`${insight.id}-${index}`}
                                                style={[
                                                  styles.calendarDot,

                                                  {
                                                    backgroundColor:
                                                      isSelected
                                                        ? '#2D6A4F'
                                                        : theme.color,
                                                  },
                                                ]}
                                              />
                                            );
                                          }
                                        )}
                                  </View>
                                </Pressable>
                              );
                            }
                          )}
                        </View>
                      )
                    )}
                  </View>

                  {calendarError ? (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        calendarError
                      }
                    </Text>
                  ) : null}

                  {/* =================================================
                      SELECTED DATE
                  ================================================= */}

                  <Text
                    style={
                      styles.savedTitle
                    }
                  >
                    {formatShortDate(
                      month,
                      selectedDay
                    )}{' '}
                    저장된 인사이트
                  </Text>

                  {selectedInsights.length >
                  0 ? (
                    selectedInsights.map(
                      (
                        item
                      ) => {
                        const categoryTheme =
                          getCategoryTheme(
                            item.category_name
                          );

                        return (
                          <View
                            key={
                              item.id
                            }
                            style={
                              styles.savedInsightCard
                            }
                          >
                            {/* CARD TOP */}

                            <View
                              style={
                                styles.savedTop
                              }
                            >
                              <View
                                style={
                                  styles.aiBadge
                                }
                              >
                                <Text
                                  style={
                                    styles.aiBadgeText
                                  }
                                >
                                  {
                                    item.ai_source
                                  }
                                </Text>
                              </View>

                              <Text
                                style={
                                  styles.savedDate
                                }
                              >
                                {formatShortDate(
                                  month,
                                  selectedDay
                                )}
                              </Text>
                            </View>

                            {/* Q */}

                            <View
                              style={
                                styles.qaRow
                              }
                            >
                              <Text
                                style={
                                  styles.qLabel
                                }
                              >
                                Q.
                              </Text>

                              <Text
                                style={
                                  styles.savedQuestion
                                }
                              >
                                {
                                  item.question_summary
                                }
                              </Text>
                            </View>

                            {/* A */}

                            <View
                              style={
                                styles.qaRow
                              }
                            >
                              <Text
                                style={
                                  styles.aLabel
                                }
                              >
                                A.
                              </Text>

                              <Text
                                style={
                                  styles.savedAnswer
                                }
                              >
                                {
                                  item.answer_summary
                                }
                              </Text>
                            </View>

                            {/* CATEGORY */}

                            <View
                              style={
                                styles.savedBottom
                              }
                            >
                              <View
                                style={[
                                  styles.calendarCategoryBadge,

                                  {
                                    backgroundColor:
                                      categoryTheme.color +
                                      '18',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.calendarCategoryText,

                                    {
                                      color:
                                        categoryTheme.color,
                                    },
                                  ]}
                                >
                                  {
                                    item.category_name
                                  }
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      }
                    )
                  ) : (
                    <View
                      style={
                        styles.calendarEmpty
                      }
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={25}
                        color="#B2B0AA"
                      />

                      <Text
                        style={
                          styles.calendarEmptyTitle
                        }
                      >
                        저장된 인사이트가 없어요
                      </Text>

                      <Text
                        style={
                          styles.calendarEmptySub
                        }
                      >
                        이 날짜에는 아직 저장된 기록이 없어요.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          ) : (
            /* =================================================
               CATEGORY
            ================================================= */

            <ScrollView
              style={
                styles.scroll
              }
              contentContainerStyle={
                styles.categoryContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {categoryLoading ? (
                <View
                  style={
                    styles.categoryLoadingBox
                  }
                >
                  <ActivityIndicator
                    color="#2d6a4f"
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    카테고리를 불러오는 중이에요...
                  </Text>
                </View>
              ) : categories.length >
                0 ? (
                <>
                  {/* CATEGORY GRID */}

                  <View
                    style={
                      styles.categoryGrid
                    }
                  >
                    {categories.map(
                      (
                        category
                      ) => {
                        const isSelected =
                          selectedCategoryId ===
                          category.id;

                        return (
                          <Pressable
                            key={
                              category.id
                            }
                            style={[
                              styles.categoryCard,

                              isSelected && {
                                borderColor:
                                  category.color,

                                borderWidth: 2,
                              },
                            ]}
                            onPress={async () => {
                              setSelectedCategoryId(
                                category.id
                              );

                              setSelectedCategory(
                                category
                              );

                              await fetchInsightsByCategory(
                                category.id
                              );
                            }}
                          >
                            <Ionicons
                              name={
                                category.icon
                              }
                              size={20}
                              color={
                                category.color
                              }
                            />

                            <Text
                              style={
                                styles.categoryName
                              }
                            >
                              {
                                category.name
                              }
                            </Text>

                            <Text
                              style={
                                styles.categoryCount
                              }
                            >
                              {
                                category.count
                              }
                              개
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>

                  {/* INSIGHT LIST */}

                  {selectedCategory ? (
                    <View
                      style={
                        styles.card
                      }
                    >
                      <View
                        style={
                          styles.sectionHeader
                        }
                      >
                        <Text
                          style={
                            styles.sectionLabel
                          }
                        >
                          {
                            selectedCategory.name
                          }
                        </Text>

                        <Text
                          style={[
                            styles.selectedCount,

                            {
                              color:
                                selectedCategory.color,
                            },
                          ]}
                        >
                          {
                            categoryInsights.length
                          }
                          개
                        </Text>
                      </View>

                      {insightLoading ? (
                        <View
                          style={
                            styles.insightLoadingBox
                          }
                        >
                          <ActivityIndicator
                            color={
                              selectedCategory.color
                            }
                          />
                        </View>
                      ) : categoryInsights.length >
                        0 ? (
                        categoryInsights.map(
                          (
                            item,
                            index
                          ) => (
                            <View
                              key={
                                item.id
                              }
                              style={[
                                styles.insightCard,

                                index ===
                                  categoryInsights.length -
                                    1 && {
                                  borderBottomWidth: 0,
                                },
                              ]}
                            >
                              <Text
                                style={
                                  styles.insightQuestion
                                }
                              >
                                {item.question_summary ||
                                  item.question_original ||
                                  '저장된 질문'}
                              </Text>

                              <Text
                                style={
                                  styles.insightAnswer
                                }
                                numberOfLines={
                                  2
                                }
                              >
                                {item.answer_summary ||
                                  item.answer_original ||
                                  '저장된 답변'}
                              </Text>

                              <View
                                style={
                                  styles.metaRow
                                }
                              >
                                <View
                                  style={
                                    styles.sourceBadge
                                  }
                                >
                                  <Text
                                    style={
                                      styles.sourceText
                                    }
                                  >
                                    {item.ai_source ||
                                      'AI'}
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.dateText
                                  }
                                >
                                  {formatInsightDate(
                                    item.created_at
                                  )}
                                </Text>
                              </View>
                            </View>
                          )
                        )
                      ) : (
                        <View
                          style={
                            styles.emptyBoxSmall
                          }
                        >
                          <Ionicons
                            name="leaf-outline"
                            size={24}
                            color="#9ca3af"
                          />

                          <Text
                            style={
                              styles.emptyTitle
                            }
                          >
                            아직 인사이트가 없어요
                          </Text>

                          <Text
                            style={
                              styles.emptySub
                            }
                          >
                            이 카테고리에 저장된 인사이트가 없습니다.
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </>
              ) : (
                <View
                  style={
                    styles.emptyBox
                  }
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={30}
                    color="#9ca3af"
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    아직 카테고리가 없어요
                  </Text>

                  <Text
                    style={
                      styles.emptySub
                    }
                  >
                    인사이트를 저장하면 카테고리가 생성돼요.
                  </Text>
                </View>
              )}

              {categoryError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    categoryError
                  }
                </Text>
              ) : null}
            </ScrollView>
          )}
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
      width: '100%',

      maxWidth: 360,

      flex: 1,

      backgroundColor:
        '#F7F6F1',
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      paddingTop: 45,

      paddingHorizontal:
        18,

      paddingBottom: 11,

      backgroundColor:
        '#F7F6F1',
    },

    title: {
      fontSize: 22,

      fontWeight: '900',

      color: '#1A1A18',

      letterSpacing: -0.4,
    },

    subtitle: {
      marginTop: 4,

      fontSize: 11,

      color: '#9CA3AF',

      fontWeight: '600',
    },

    /* =====================================================
       SEGMENT
    ===================================================== */

    segment: {
      marginTop: 15,

      height: 39,

      padding: 3,

      borderRadius: 11,

      flexDirection: 'row',

      backgroundColor:
        '#EAE7E0',
    },

    segmentButton: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 9,
    },

    segmentButtonActive: {
      backgroundColor:
        '#FFFFFF',

      shadowColor: '#000',

      shadowOpacity: 0.035,

      shadowRadius: 3,

      shadowOffset: {
        width: 0,
        height: 1,
      },

      elevation: 1,
    },

    segmentText: {
      fontSize: 12,

      fontWeight: '800',

      color: '#96948D',
    },

    segmentTextActive: {
      color: '#1F6B45',

      fontWeight: '900',
    },

    scroll: {
      flex: 1,
    },

    /* =====================================================
       CALENDAR
    ===================================================== */

    calendarContent: {
      paddingHorizontal:
        18,

      paddingTop: 8,

      paddingBottom: 110,
    },

    monthNav: {
      height: 48,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 15,
    },

    monthArrow: {
      width: 32,

      height: 32,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    monthTitle: {
      minWidth: 105,

      textAlign: 'center',

      fontSize: 15,

      fontWeight: '900',

      color: '#292A27',
    },

    weekdayRow: {
      flexDirection: 'row',

      marginTop: 4,

      marginBottom: 8,
    },

    weekdayText: {
      flex: 1,

      textAlign: 'center',

      fontSize: 11,

      color: '#A3A19A',

      fontWeight: '800',
    },

    calendarGrid: {
      gap: 3,
    },

    calendarRow: {
      flexDirection: 'row',

      height: 45,
    },

    dayCell: {
      flex: 1,

      height: 41,

      marginHorizontal: 2,

      borderRadius: 9,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1.5,

      borderColor:
        'transparent',
    },

    dayText: {
      fontSize: 12,

      fontWeight: '700',

      color: '#444640',
    },

    todayCell: {
      backgroundColor:
        '#E7F3EC',
    },

    todayText: {
      color: '#296B4B',

      fontWeight: '900',
    },

    selectedCell: {
      backgroundColor:
        '#FFFFFF',

      borderColor:
        '#2D6A4F',
    },

    selectedDayText: {
      color: '#2D6A4F',

      fontWeight: '900',
    },

    dotRow: {
      height: 6,

      marginTop: 3,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 2,
    },

    calendarDot: {
      width: 4,

      height: 4,

      borderRadius: 999,
    },

    calendarLoading: {
      minHeight: 260,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 9,

      fontSize: 11,

      color: '#9CA3AF',

      fontWeight: '700',
    },

    savedTitle: {
      marginTop: 20,

      marginBottom: 10,

      fontSize: 13,

      fontWeight: '900',

      color: '#33342F',
    },

    savedInsightCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E9E5DD',

      padding: 15,

      marginBottom: 9,
    },

    savedTop: {
      flexDirection: 'row',

      alignItems:
        'center',

      marginBottom: 13,
    },

    aiBadge: {
      backgroundColor:
        '#E7F4EC',

      borderRadius: 999,

      paddingHorizontal:
        9,

      paddingVertical: 4,
    },

    aiBadgeText: {
      fontSize: 10,

      color: '#2D6A4F',

      fontWeight: '900',
    },

    savedDate: {
      marginLeft: 'auto',

      fontSize: 10,

      color: '#AAA8A1',

      fontWeight: '700',
    },

    qaRow: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      marginBottom: 9,
    },

    qLabel: {
      width: 23,

      fontSize: 12,

      color: '#2D6A4F',

      fontWeight: '900',

      lineHeight: 19,
    },

    aLabel: {
      width: 23,

      fontSize: 12,

      color: '#A3A19A',

      fontWeight: '900',

      lineHeight: 19,
    },

    savedQuestion: {
      flex: 1,

      fontSize: 12,

      fontWeight: '900',

      color: '#292A27',

      lineHeight: 19,
    },

    savedAnswer: {
      flex: 1,

      fontSize: 11,

      color: '#767872',

      fontWeight: '600',

      lineHeight: 18,
    },

    savedBottom: {
      marginTop: 2,

      flexDirection: 'row',
    },

    calendarCategoryBadge: {
      borderRadius: 999,

      paddingHorizontal:
        9,

      paddingVertical: 4,
    },

    calendarCategoryText: {
      fontSize: 10,

      fontWeight: '900',
    },

    calendarEmpty: {
      minHeight: 128,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        '#E9E5DD',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 15,
    },

    calendarEmptyTitle: {
      marginTop: 7,

      fontSize: 12,

      color: '#444640',

      fontWeight: '900',
    },

    calendarEmptySub: {
      marginTop: 3,

      fontSize: 10,

      color: '#AAA8A1',

      fontWeight: '600',
    },

    errorText: {
      marginTop: 10,

      fontSize: 11,

      color: '#D45D79',

      fontWeight: '800',

      textAlign: 'center',
    },

    /* =====================================================
       CATEGORY
       기존 카테고리 디자인
    ===================================================== */

    categoryContent: {
      padding: 12,

      paddingBottom: 100,
    },

    categoryLoadingBox: {
      minHeight: 300,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    categoryGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,

      marginBottom: 10,
    },

    categoryCard: {
      width: '48.7%',

      backgroundColor:
        '#ffffff',

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        '#e8e6e0',

      padding: 13,

      minHeight: 92,
    },

    categoryName: {
      marginTop: 8,

      fontSize: 12,

      fontWeight: '900',

      color: '#1a1a18',
    },

    categoryCount: {
      marginTop: 3,

      fontSize: 10,

      color: '#6b7280',

      fontWeight: '600',
    },

    card: {
      backgroundColor:
        '#ffffff',

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        '#e8e6e0',

      padding: 12,

      marginBottom: 10,
    },

    sectionHeader: {
      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    sectionLabel: {
      fontSize: 10,

      fontWeight: '900',

      color: '#9ca3af',

      letterSpacing: 0.6,

      marginBottom: 8,
    },

    selectedCount: {
      fontSize: 11,

      fontWeight: '900',

      marginBottom: 8,
    },

    insightLoadingBox: {
      minHeight: 120,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    insightCard: {
      paddingVertical: 10,

      borderBottomWidth: 1,

      borderBottomColor:
        '#e8e6e0',
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

      alignItems:
        'center',

      gap: 5,
    },

    sourceBadge: {
      backgroundColor:
        '#f5f4f0',

      borderWidth: 1,

      borderColor:
        '#e8e6e0',

      borderRadius: 999,

      paddingHorizontal: 8,

      paddingVertical: 3,
    },

    sourceText: {
      fontSize: 10,

      color: '#6b7280',

      fontWeight: '700',
    },

    dateText: {
      marginLeft: 'auto',

      fontSize: 10,

      color: '#9ca3af',

      fontWeight: '600',
    },

    emptyBox: {
      paddingVertical: 120,

      alignItems:
        'center',
    },

    emptyBoxSmall: {
      paddingVertical: 28,

      alignItems:
        'center',
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

      lineHeight: 18,
    },
  });