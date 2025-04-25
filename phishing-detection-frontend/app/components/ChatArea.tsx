import { Box, Typography } from "@mui/material";
import { useRef, useEffect } from "react";
import { ChatMessage, ThemeConfig } from "../types/chat";
import MessageBubble from "./MessageBubble";

interface ChatAreaProps {
  chatHistory: ChatMessage[];
  theme: ThemeConfig;
  displayedAnswer: string;
  currentTypingMessageId: string | null;
  isTyping: boolean;
}

export const ChatArea = ({
  chatHistory,
  theme,
  displayedAnswer,
  currentTypingMessageId,
  isTyping,
}: ChatAreaProps) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, displayedAnswer]);

  return (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          color: theme.userTextColor,
          fontSize: { xs: "0.95rem", md: "1rem" },
          mb: 1,
        }}
      >
        Conversation
      </Typography>
      <Box
        ref={chatContainerRef}
        sx={{
          height: { xs: 350, sm: 400, md: 450 },
          overflowY: "auto",
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 2,
          p: { xs: 1, sm: 1.5, md: 2 },
          backgroundColor: theme.containerBackground,
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)",
        }}
      >
        {chatHistory.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: theme.inputLabelColor,
            }}
          >
            <Typography variant="body2">
              Start a conversation by entering a prompt below
            </Typography>
          </Box>
        ) : (
          chatHistory.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              theme={theme}
              displayedAnswer={displayedAnswer}
              currentTypingMessageId={currentTypingMessageId}
              isTyping={isTyping}
            />
          ))
        )}
      </Box>
    </>
  );
};

export default ChatArea;
