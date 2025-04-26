import { Card, CardContent, Typography } from "@mui/material";
import { ChatMessage, ThemeConfig, ChatSession } from "../types/chat";
import ChatArea from "./ChatArea";
import ChatForm from "./ChatForm";

interface ChatInterfaceProps {
  theme: ThemeConfig;
  chatSessions: ChatSession[]; // Update to use the ChatSession type
  activeSessionId: string;
  isHydrated: boolean;
  isMobile: boolean;
  chatHistory: ChatMessage[];
  inputs: {
    model_name: string;
    prompt: string;
  };
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyNext: (event: React.KeyboardEvent, nextIndex: number) => void;
  handleKeyNextSubmit: (event: React.KeyboardEvent) => void;
  handleSubmit: () => void;
  displayedAnswer: string;
  currentTypingMessageId: string | null;
  isTyping: boolean;
  error: string;
  loading: boolean;
  onFileContextGenerated?: (context: string, fileName: string) => void;
}

export const ChatInterface = ({
  theme,
  chatSessions,
  activeSessionId,
  isHydrated,
  isMobile,
  chatHistory,
  inputs,
  handleChange,
  handleKeyNext,
  handleKeyNextSubmit,
  handleSubmit,
  displayedAnswer,
  currentTypingMessageId,
  isTyping,
  error,
  loading,
  onFileContextGenerated,
}: ChatInterfaceProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: { xs: "95vw", sm: "90vw", md: 800 },
        minWidth: { xs: "auto", sm: "auto", md: 512 },
        backgroundColor: theme.cardBackground,
        borderColor: theme.borderColor,
      }}
    >
      <CardContent sx={{ py: 0.5, px: { xs: 1.5, md: 2 } }}>
        <Typography
          variant="caption"
          sx={{ color: theme.inputLabelColor, opacity: 0.8 }}
        >
          {isHydrated ? (
            <>
              Chat {chatSessions.findIndex((s) => s.id === activeSessionId) + 1}{" "}
              of {chatSessions.length}
              {chatHistory.length > 0
                ? ` • ${chatHistory.length} messages`
                : " • New conversation"}
            </>
          ) : (
            "Loading conversation..."
          )}
        </Typography>
      </CardContent>

      {/* Conversation area now at the top */}
      <CardContent sx={{ py: { xs: 1, md: 2 }, px: { xs: 1.5, md: 2 } }}>
        <ChatArea
          chatHistory={chatHistory}
          theme={theme}
          displayedAnswer={displayedAnswer}
          currentTypingMessageId={currentTypingMessageId}
          isTyping={isTyping}
        />
      </CardContent>

      {/* Model name input in the middle */}
      <CardContent
        sx={{
          py: { xs: 0.5, md: 1 },
          px: { xs: 1.5, md: 2 },
          pb: { xs: 1.5, md: 2 },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <ChatForm
            inputs={inputs}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleKeyNext={handleKeyNext}
            handleKeyNextSubmit={handleKeyNextSubmit}
            theme={theme}
            loading={loading}
            error={error}
            isMobile={isMobile}
            isTyping={isTyping} // Pass isTyping prop
            onFileContextGenerated={onFileContextGenerated}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
