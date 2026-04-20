// 카테고리 공통 설정 파일
// 새 카테고리 추가 시 여기만 수정하면 모든 화면에 자동 반영됩니다

export type CategoryConfig = {
  icon: string;   // Ionicons 이름 (HomeScreen, ExpenseDetailScreen)
  emoji: string;  // 이모지 (CategoryEditModal 칩)
  color: string;
  label: string;
};

// 카테고리별 아이콘 및 색상 (한글/영문 키 모두 지원)
// 새 카테고리 추가 시 여기에만 추가하면 전체 화면에 자동 반영
export const categoryConfig: Record<string, CategoryConfig> = {
  // 영문 키
  cafe:         { icon: 'cafe',                emoji: '☕',  color: '#A78BFA', label: '카페' },
  food:         { icon: 'restaurant',          emoji: '🍽️', color: '#F59E0B', label: '음식' },
  transport:    { icon: 'bus',                 emoji: '🚌',  color: '#3B82F6', label: '교통' },
  shopping:     { icon: 'bag',                 emoji: '🛍️', color: '#EC4899', label: '쇼핑' },
  subscription: { icon: 'tv',                  emoji: '📋',  color: '#10B981', label: '구독' },
  hospital:     { icon: 'medkit',              emoji: '🏥',  color: '#EF4444', label: '병원' },
  etc:          { icon: 'ellipsis-horizontal', emoji: '···', color: '#6B7280', label: '기타' },
  // 한글 키
  '카페':       { icon: 'cafe',                emoji: '☕',  color: '#A78BFA', label: '카페' },
  '음식':       { icon: 'restaurant',          emoji: '🍽️', color: '#F59E0B', label: '음식' },
  '교통':       { icon: 'bus',                 emoji: '🚌',  color: '#3B82F6', label: '교통' },
  '쇼핑':       { icon: 'bag',                 emoji: '🛍️', color: '#EC4899', label: '쇼핑' },
  '구독':       { icon: 'tv',                  emoji: '📋',  color: '#10B981', label: '구독' },
  '병원':       { icon: 'medkit',              emoji: '🏥',  color: '#EF4444', label: '병원' },
  '기타':       { icon: 'ellipsis-horizontal', emoji: '···', color: '#6B7280', label: '기타' },
  // 기본값 (모르는 카테고리)
  default:      { icon: 'pricetag',            emoji: '🏷️', color: '#6B7280', label: '기타' },
};

// Ionicons 이름 반환 (HomeScreen, ExpenseDetailScreen용)
export function getCategoryIcon(name: string): string {
  return categoryConfig[name]?.icon || 'pricetag';
}

// 이모지 반환 (CategoryEditModal 칩용)
export function getCategoryEmoji(name: string): string {
  return categoryConfig[name]?.emoji || '🏷️';
}

// 한글/영문 카테고리 매핑
export const categoryKeyMap: Record<string, string[]> = {
  '카페': ['카페', 'cafe'],
  '음식': ['음식', 'food'],
  '교통': ['교통', 'transport'],
  '쇼핑': ['쇼핑', 'shopping'],
  '구독': ['구독', 'subscription'],
  '병원': ['병원', 'hospital'],
  '기타': ['기타', 'etc'],
};
