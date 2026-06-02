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

export const homeApi = {
  getHome: () => apiCall('GET', '/api/home'),

  getRecentInsights: () => apiCall('GET', '/api/home/recent_insights'),
};

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

  getOne: (insightId) => apiCall('GET', `/api/insights/${insightId}`),

  delete: (insightId) => apiCall('DELETE', `/api/insights/${insightId}`),
};

export const categoryApi = {
  getList: () => apiCall('GET', '/api/categories'),

  create: (name) =>
    apiCall('POST', '/api/categories', {
      query: {
        name,
      },
    }),

  getInsights: (categoryId) =>
    apiCall('GET', `/api/categories/${categoryId}/insights`),
};

export const myApi = {
  getProfile: () => apiCall('GET', '/api/my/profile'),

  updateProfile: ({ username }) =>
    apiCall('PUT', '/api/my/profile', {
      query: {
        username,
      },
    }),

  changePassword: ({ current_password, new_password }) =>
    apiCall('PUT', '/api/my/password', {
      query: {
        current_password,
        new_password,
      },
    }),

  deleteAccount: () => apiCall('DELETE', '/api/my/account'),

  getAnalysis: () => apiCall('GET', '/api/my/analysis'),

  getMonthlyReview: ({ year, month }) =>
    apiCall('GET', `/api/my/monthly_review/${year}/${month}`),
};

export default apiCall;