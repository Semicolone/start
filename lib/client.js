import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://168.107.61.72:8000';

async function getToken() {
  return await AsyncStorage.getItem('accessToken');
}

async function apiCall(method, path, options = {}) {
  const token = await getToken();

  const query = options.query || null;
  const body = options.body || null;

  let url = `${BASE_URL}${path}`;

  if (query) {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers = {
    Accept: 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `요청에 실패했습니다. (${response.status})`;

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   KEYWORD DETAIL PERIOD FILTER
========================================================= */

/*
 * 현재 백엔드 키워드 상세 API:
 *
 * GET /api/my/keyword_report/{keyword}?sort=recent
 *
 * 상세 API에는 period가 없기 때문에
 * AI 리포트에서 선택한
 *
 * all
 * 1m
 * 3m
 *
 * 기간을 상세 화면에서도 유지하기 위해
 * 응답받은 insights를 created_at 기준으로
 * 한 번 더 필터링한다.
 */

function filterKeywordDetailByPeriod(
  data,
  period = 'all'
) {
  if (
    !data ||
    period === 'all'
  ) {
    return data;
  }

  const days =
    period === '1m'
      ? 30
      : period === '3m'
      ? 90
      : null;

  if (!days) {
    return data;
  }

  const cutoff = new Date();

  cutoff.setDate(
    cutoff.getDate() - days
  );

  const insights =
    Array.isArray(data?.insights)
      ? data.insights.filter(
          (item) => {
            if (!item?.created_at) {
              return false;
            }

            const createdAt =
              new Date(
                item.created_at
              );

            if (
              Number.isNaN(
                createdAt.getTime()
              )
            ) {
              return false;
            }

            return (
              createdAt >= cutoff
            );
          }
        )
      : [];

  return {
    ...data,
    insights,
  };
}

/* =========================================================
   AUTH
========================================================= */

export const authApi = {
  register: ({ name, email, password }) =>
    apiCall('POST', '/api/auth/register', {
      query: {
        name,
        email,
        password,
      },
    }),

  login: async ({ email, password }) => {
    const data = await apiCall('POST', '/api/auth/login', {
      query: {
        email,
        password,
      },
    });

    const token =
      data?.access_token ||
      data?.token ||
      data?.accessToken ||
      data?.jwt;

    if (token) {
      await AsyncStorage.setItem('accessToken', token);
    }

    return data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
  },
};

/* =========================================================
   HOME
========================================================= */

export const homeApi = {
  getHome: () =>
    apiCall('GET', '/api/home'),

  getRecentInsights: () =>
    apiCall('GET', '/api/home/recent_insights'),

  /*
   * 캘린더
   *
   * GET /api/home/calendar?year=2026&month=8
   */
  getCalendar: ({ year, month }) =>
    apiCall('GET', '/api/home/calendar', {
      query: {
        year,
        month,
      },
    }),
};

/* =========================================================
   INSIGHT
========================================================= */

export const insightApi = {
  analyze: ({ question, answer, ai_source }) =>
    apiCall('POST', '/api/insights/analyze', {
      body: {
        question,
        answer,
        ai_source,
      },
    }),

  create: ({
    category_id,
    category_name,
    ai_source,
    question_original,
    answer_original,
    question_summary,
    answer_summary,
    keywords,
    saved_from,
  }) =>
    apiCall('POST', '/api/insights', {
      body: {
        category_id,
        category_name,
        ai_source,
        question_original,
        answer_original,
        question_summary,
        answer_summary,
        keywords,
        saved_from,
      },
    }),

  getOne: (insightId) =>
    apiCall(
      'GET',
      `/api/insights/${insightId}`
    ),

  delete: (insightId) =>
    apiCall(
      'DELETE',
      `/api/insights/${insightId}`
    ),

  /*
   * ==========================
   * 키워드 상세 조회
   * ==========================
   *
   * keyword-detail.tsx에서
   *
   * insightApi.getByKeyword(
   *   keyword,
   *   period
   * )
   *
   * 형태로 사용.
   *
   * 실제 백엔드 API:
   *
   * GET
   * /api/my/keyword_report/{keyword}
   *
   * sort:
   * recent = 최신순
   * oldest = 오래된순
   */

  getByKeyword: async (
    keyword,
    period = 'all',
    sort = 'recent'
  ) => {
    const data =
      await apiCall(
        'GET',
        `/api/my/keyword_report/${encodeURIComponent(
          keyword
        )}`,
        {
          query: {
            sort,
          },
        }
      );

    return filterKeywordDetailByPeriod(
      data,
      period
    );
  },
};

/* =========================================================
   CATEGORY
========================================================= */

export const categoryApi = {
  getList: () =>
    apiCall(
      'GET',
      '/api/categories'
    ),

  create: (name) =>
    apiCall('POST', '/api/categories', {
      query: {
        name,
      },
    }),

  getInsights: (categoryId) =>
    apiCall(
      'GET',
      `/api/categories/${categoryId}/insights`
    ),
};

/* =========================================================
   MY / AI REPORT
========================================================= */

export const myApi = {
  getProfile: () =>
    apiCall(
      'GET',
      '/api/my/profile'
    ),

  updateProfile: ({ username }) =>
    apiCall('PUT', '/api/my/profile', {
      query: {
        username,
      },
    }),

  changePassword: ({
    current_password,
    new_password,
  }) =>
    apiCall('PUT', '/api/my/password', {
      query: {
        current_password,
        new_password,
      },
    }),

  deleteAccount: () =>
    apiCall(
      'DELETE',
      '/api/my/account'
    ),

  /*
   * 기존 API
   *
   * 현재 백엔드에서는 "준비 중입니다"만 반환하므로
   * AI 리포트 화면에는 사용하지 않음.
   */
  getAnalysis: () =>
    apiCall(
      'GET',
      '/api/my/analysis'
    ),

  /*
   * ==========================
   * 키워드 리포트
   * ==========================
   *
   * period:
   * all = 전체
   * 1m  = 최근 1개월
   * 3m  = 최근 3개월
   */
  getKeywordReport: (period = 'all') =>
    apiCall(
      'GET',
      '/api/my/keyword_report',
      {
        query: {
          period,
        },
      }
    ),

  /*
   * ==========================
   * 키워드 상세
   * ==========================
   *
   * sort:
   * recent = 최신순
   * oldest = 오래된순
   */
  getKeywordDetail: (
    keyword,
    sort = 'recent'
  ) =>
    apiCall(
      'GET',
      `/api/my/keyword_report/${encodeURIComponent(
        keyword
      )}`,
      {
        query: {
          sort,
        },
      }
    ),

  /*
   * ==========================
   * 월간 회고
   * ==========================
   */
  getMonthlyReview: ({
    year,
    month,
  }) =>
    apiCall(
      'GET',
      `/api/my/monthly_review/${year}/${month}`
    ),

  /*
   * ==========================
   * 푸시 토큰 등록
   * ==========================
   *
   * 로그인된 사용자의 Expo Push Token을
   * 백엔드 users.push_token에 저장한다.
   *
   * 백엔드 API:
   * PUT /api/my/push_token?push_token=ExpoPushToken[...]
   */
  updatePushToken: (pushToken) =>
    apiCall(
      'PUT',
      '/api/my/push_token',
      {
        query: {
          push_token: pushToken,
        },
      }
    ),
};

export default apiCall;