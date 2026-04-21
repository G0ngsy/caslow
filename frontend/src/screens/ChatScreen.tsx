import {  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { sendChatMessage } from '../lib/api';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

const QUICK_SUGGESTIONS = [
  '이번 달 얼마 썼어?',
  '소비 패턴 분석해줘',
  '절약 팁 알려줘',
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'ai',
  text: `안녕하세요! 🔥 Caslow AI 어시스턴트입니다.\n지출 관련 질문을 해주세요. 예:\n"이번 달 카페에 얼마 썼어?"\n"지출을 줄이려면 어떻게 해야 해?"\n"내 소비 패턴 분석해줘"`,
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },

  /* 헤더 */
  header: {
    backgroundColor: Colors.bgHeader,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop:10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#255DAA',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.accentLight,          // #FAD493
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  
  /* 메시지 영역 */
  messageArea: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 12,
  },

  /* AI 메시지 */
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBubble: {
    maxWidth: '80%',       // 최대 너비만 제한
  alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiText: {
    color: Colors.textDark,
    fontSize: 14,
    lineHeight: 22,
  },

  /* 유저 메시지 */
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  userText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
  },

  /* 빠른 질문 칩 */
  suggestionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.bgMain,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textDark,
  },

  /* 입력창 */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
    color: Colors.textDark,
    minHeight: 40,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});

export default function ChatScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // 로딩 상태 추가
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || isLoading) return;

  // 유저 메시지 추가
  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    text: trimmed,
  };
  setMessages(prev => [...prev, userMsg]);
  setInput('');
  setIsLoading(true);
  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  try {
    // 대화 내역 전체를 API로 전송
    const history = messages
      .filter(m => m.id !== '0')  // 초기 메시지 제외
      .map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));

    // 현재 유저 메시지 추가
    history.push({ role: 'user', content: trimmed });

    // Groq API 호출
    const response = await sendChatMessage(history);

    // AI 응답 추가
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: response.message,
    };
    setMessages(prev => [...prev, aiMsg]);

  } catch (error) {
    console.error('AI 응답 실패:', error);
    const errorMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: '죄송합니다. AI 응답에 실패했습니다. 다시 시도해주세요.',
    };
    setMessages(prev => [...prev, errorMsg]);
  } finally {
    setIsLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }
}
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* 헤더 */}
      <View style={styles.header}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* 가운데 타이틀 */}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>AI 채팅</Text>
        <View style={styles.headerSubRow}>
          <Ionicons name="sparkles" size={12} color={Colors.accentLight} />
          <Text style={styles.headerSub}> Caslow AI</Text>
        </View>
      </View>

  {/* 오른쪽 여백 맞추기 */}
  <View style={{ width: 36 }} />
</View>
      {/* 메시지 영역 */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageArea}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg =>
          msg.role === 'ai' ? (
            <View key={msg.id} style={styles.aiRow}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
              </View>
              <View style={styles.aiBubble}>
                <Text style={styles.aiText}>{msg.text}</Text>
              </View>
            </View>
          ) : (
            <View key={msg.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.text}</Text>
              </View>
            </View>
          )
        )}
        {/* 로딩 중 표시 */}
        {isLoading && (
          <View style={styles.aiRow}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
            </View>
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>답변 생성 중... ✨</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 빠른 질문 칩 */}
      <View style={styles.suggestionsRow}>
        {QUICK_SUGGESTIONS.map(s => (
          <TouchableOpacity
            key={s}
            style={styles.suggestionChip}
            onPress={() => sendMessage(s)}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 입력창 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="질문을 입력하세요..."
          placeholderTextColor={Colors.textHint}
          multiline
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

