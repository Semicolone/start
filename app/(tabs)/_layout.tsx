import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 기존 색상 그대로 유지
        tabBarActiveTintColor: '#1F6B45',
        tabBarInactiveTintColor: '#9CA3AF',

        // 기존 하단바 디자인 그대로 유지
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9E5DD',
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
      }}
    >
      {/* =========================
          1. 홈
      ========================== */}
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =========================
          2. 탐색

          기존 캘린더 탭 자리를
          탐색 탭으로 변경
      ========================== */}
      <Tabs.Screen
        name="explore"
        options={{
          title: '탐색',

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="compass-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =========================
          3. 가운데 + 버튼

          기존 add route 그대로 사용
          디자인만 Figma처럼
          초록색 원형 버튼
      ========================== */}
      <Tabs.Screen
        name="add"
        options={{
          title: '',

          tabBarIcon: () => (
            <View
              style={{
                width: 48,
                height: 48,

                borderRadius: 999,

                backgroundColor: '#1F6B45',

                alignItems: 'center',
                justifyContent: 'center',

                marginTop: -16,

                shadowColor: '#1F6B45',
                shadowOpacity: 0.25,
                shadowRadius: 8,

                shadowOffset: {
                  width: 0,
                  height: 4,
                },

                elevation: 6,
              }}
            >
              <Ionicons
                name="add"
                size={27}
                color="#FFFFFF"
              />
            </View>
          ),
        }}
      />

      {/* =========================
          4. AI 리포트

          기존 카테고리 탭 자리
          → AI 리포트
      ========================== */}
      <Tabs.Screen
        name="ai-report"
        options={{
          title: 'AI 리포트',

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bar-chart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =========================
          5. 마이페이지
      ========================== */}
      <Tabs.Screen
        name="my"
        options={{
          title: '마이페이지',

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =================================================
          여기서부터는 기존 화면 유지하되
          하단 탭에서는 숨김
      ================================================== */}

      {/* 캘린더
          Home의 "캘린더 보기 →"에서 접근 */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
        }}
      />

      {/* 기존 카테고리 화면
          필요하면 탐색 내부에서 접근 가능 */}
      <Tabs.Screen
        name="category"
        options={{
          href: null,
        }}
      />

      {/* 최근 인사이트 전체 보기 */}
      <Tabs.Screen
        name="recent"
        options={{
          href: null,
        }}
      />

      {/* 기본 index route 숨김 */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}