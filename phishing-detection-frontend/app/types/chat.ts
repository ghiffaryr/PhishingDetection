export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created: string;
  lastUpdated: string;
}

export interface ThemeConfig {
  name: string;
  appBar: string;
  background: string;
  cardBackground: string;
  containerBackground: string;
  borderColor: string;
  userBubbleBackground: string;
  assistantBubbleBackground: string;
  userTextColor: string;
  assistantTextColor: string;
  inputTextColor: string;
  inputLabelColor: string;
  inputBorderColor: string;
  inputHoverBorderColor: string;
  buttonBackground: string;
  buttonHoverBackground: string;
  buttonTextColor: string;
  codeBlockBackground: string;
  codeTextColor: string;
  codeBorderColor: string;
}

export interface FormattedTextProps {
  text: string;
  isTyping?: boolean;
}
