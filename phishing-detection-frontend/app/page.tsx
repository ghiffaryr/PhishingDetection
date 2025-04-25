"use client";
import { Box, Container } from "@mui/material";
import { useState, useRef, useEffect, useMemo } from "react";

// Import custom hooks
import useInitialization from "./hooks/useInitialization";
import useChatSessions from "./hooks/useChatSessions";
import useChatCompletion from "./hooks/useChatCompletion";

// Import components
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import GlobalStyles from "./components/GlobalStyles";

// Import constants
import { themes } from "./constants/themes";

export default function Home() {
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerWidth = 280;

  // Initialize the app
  const {
    isInitialized,
    isHydrated,
    isMobile,
    currentTheme,
    initialChatSessions,
    changeTheme,
  } = useInitialization();

  // Initialize chat sessions
  const {
    chatSessions,
    activeSessionId,
    chatHistory,
    setChatHistory,
    handleNewChat,
    handleSessionChange,
    handleDeleteSession,
  } = useChatSessions(isInitialized);

  // Track the previous active session to detect changes
  const previousSessionRef = useRef(activeSessionId);

  // Force reset the completion state when changing sessions
  const [completionKey, setCompletionKey] = useState(0);

  // Track when the session changes and reset the completion
  useEffect(() => {
    // If the active session changed
    if (activeSessionId !== previousSessionRef.current) {
      console.log("Session changed, resetting completion state");

      // Increment the key to force re-mount the chat interface
      setCompletionKey((prev) => prev + 1);

      // Update the reference
      previousSessionRef.current = activeSessionId;
    }
  }, [activeSessionId]);

  // Initialize chat completion with the key to force remounting
  const {
    inputs,
    handleChange,
    displayedAnswer,
    isTyping,
    error,
    loading,
    currentTypingMessageId,
    handleSubmit: submitChat,
  } = useChatCompletion();

  // Create a separate state to temporarily suppress displayed answer during session changes
  const [shouldShowAnswer, setShouldShowAnswer] = useState(true);

  // Store last session ID to detect changes
  const lastSessionRef = useRef(activeSessionId);

  // Clear displayed content when session changes
  useEffect(() => {
    // If the session ID changed
    if (activeSessionId !== lastSessionRef.current) {
      // Immediately hide any answer from previous session
      setShouldShowAnswer(false);

      // Reset the flag after a short delay to allow for component updates
      const timer = setTimeout(() => {
        setShouldShowAnswer(true);
      }, 100);

      // Update ref
      lastSessionRef.current = activeSessionId;

      return () => clearTimeout(timer);
    }
  }, [activeSessionId]);

  // Override the session change handlers to ensure cleanup
  const handleSessionChangeWithCleanup = (sessionId: string) => {
    // Hide any displayed answer immediately
    setShouldShowAnswer(false);
    // Change session
    handleSessionChange(sessionId);
    // Reset the flag after a delay
    setTimeout(() => setShouldShowAnswer(true), 100);
  };

  const handleNewChatWithCleanup = () => {
    // Hide any displayed answer immediately
    setShouldShowAnswer(false);
    // Create new chat
    handleNewChat();
    // Reset the flag after a delay
    setTimeout(() => setShouldShowAnswer(true), 100);
  };

  // This state tracks if we're in the submission process
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modified submit handler that clears old content first
  const handleSubmit = async () => {
    // Set submitting state to true to show we're in the process
    setIsSubmitting(true);

    try {
      // Hide previous answers during submission
      setShouldShowAnswer(false);

      // Small delay to ensure UI updates before submission
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Proceed with chat submission
      const result = await submitChat(chatHistory, setChatHistory);

      // Allow showing answers again after a small delay
      setTimeout(() => setShouldShowAnswer(true), 100);

      return result;
    } catch (error) {
      console.error("Chat submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current theme configuration
  const theme = themes[currentTheme];

  // Handle key navigation in inputs
  const handleKeyNext = (event: React.KeyboardEvent, nextIndex: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  // Handle enter key submission
  const handleKeyNextSubmit = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Handle session deletion with event stopping
  const handleDeleteSessionWithEvent = (
    eventOrId: React.MouseEvent | any,
    idOrEvent?: string | any
  ) => {
    // Determine which parameter is the event and which is the ID
    let event: any;
    let sessionId: string | undefined;

    console.log("Delete handler called with params:", { eventOrId, idOrEvent });

    // Check if the first parameter is an event (has stopPropagation)
    if (eventOrId && typeof eventOrId.stopPropagation === "function") {
      event = eventOrId;

      // Extract sessionId from attributes or data properties if available
      if (
        event.currentTarget &&
        event.currentTarget.dataset &&
        event.currentTarget.dataset.sessionId
      ) {
        sessionId = event.currentTarget.dataset.sessionId;
      } else if (typeof idOrEvent === "string") {
        sessionId = idOrEvent;
      }
    } else if (typeof eventOrId === "string") {
      // First parameter is the sessionId
      sessionId = eventOrId;
      event = idOrEvent;
    }

    // Stop event propagation if possible
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }

    console.log("Resolved sessionId:", sessionId);

    // Call delete function if we have a valid sessionId
    if (sessionId && typeof sessionId === "string") {
      handleDeleteSession(sessionId);
    } else {
      console.error("Could not determine a valid sessionId for deletion");
    }
  };

  // Use a session-based message cache that won't leak between sessions
  const [sessionMessageCaches, setSessionMessageCaches] = useState<
    Record<string, Record<string, string>>
  >({});

  // Track typing state reference for comparison
  const prevTypingRef = useRef(isTyping);
  const prevMsgIdRef = useRef(currentTypingMessageId);

  // Store displayedAnswer during typing (scoped to current session)
  useEffect(() => {
    if (
      isTyping &&
      currentTypingMessageId &&
      displayedAnswer &&
      activeSessionId
    ) {
      // Update the cache for the current session only
      setSessionMessageCaches((prev) => ({
        ...prev,
        [activeSessionId]: {
          ...(prev[activeSessionId] || {}),
          [currentTypingMessageId]: displayedAnswer,
        },
      }));
    }
  }, [isTyping, displayedAnswer, currentTypingMessageId, activeSessionId]);

  // Handle typing completion (when isTyping changes from true to false)
  useEffect(() => {
    if (
      prevTypingRef.current &&
      !isTyping &&
      currentTypingMessageId &&
      activeSessionId
    ) {
      console.log(
        `Typing finished for message ${currentTypingMessageId} in session ${activeSessionId}`
      );

      // Get the session cache or empty object if none
      const sessionCache = sessionMessageCaches[activeSessionId] || {};

      // Use the latest content (either displayed or cached)
      const finalContent =
        displayedAnswer || sessionCache[currentTypingMessageId];

      if (finalContent) {
        // Update the session cache
        setSessionMessageCaches((prev) => ({
          ...prev,
          [activeSessionId]: {
            ...(prev[activeSessionId] || {}),
            [currentTypingMessageId]: finalContent,
          },
        }));

        // Also update the chat history
        setChatHistory((prevHistory) =>
          prevHistory.map((msg) =>
            msg.id === currentTypingMessageId
              ? { ...msg, content: finalContent }
              : msg
          )
        );
      }
    }

    // Save current state for next comparison
    prevTypingRef.current = isTyping;
    prevMsgIdRef.current = currentTypingMessageId;
  }, [
    isTyping,
    currentTypingMessageId,
    displayedAnswer,
    sessionMessageCaches,
    activeSessionId,
    setChatHistory,
  ]);

  // Enhance the chat history with the session-specific cache
  const enhancedChatHistory = useMemo(() => {
    // Only process if we have a valid session and chat history
    if (!activeSessionId || !chatHistory || chatHistory.length === 0) {
      return chatHistory;
    }

    // Get the cache for the current session only
    const currentSessionCache = sessionMessageCaches[activeSessionId] || {};

    // Merge with chat history
    return chatHistory.map((msg) => {
      // If we have a cached version for this message in this session, use it
      if (currentSessionCache[msg.id]) {
        return { ...msg, content: currentSessionCache[msg.id] };
      }
      return msg;
    });
  }, [chatHistory, sessionMessageCaches, activeSessionId]);

  return (
    <Box
      sx={{
        backgroundColor: theme.background,
        color: theme.userTextColor,
        minHeight: "100vh",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <AppHeader
        setDrawerOpen={setDrawerOpen}
        theme={theme}
        themes={themes}
        currentTheme={currentTheme}
        changeTheme={changeTheme}
      />

      <Sidebar
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        drawerWidth={drawerWidth}
        theme={theme}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        handleNewChat={handleNewChatWithCleanup}
        handleSessionChange={handleSessionChangeWithCleanup}
        handleDeleteSession={handleDeleteSessionWithEvent}
        isHydrated={isHydrated}
      />

      <Container
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* Use the key to force remount when switching sessions */}
        <div key={`chat-interface-${completionKey}-${activeSessionId}`}>
          <ChatInterface
            theme={theme}
            chatSessions={chatSessions}
            activeSessionId={activeSessionId}
            isHydrated={isHydrated}
            isMobile={isMobile}
            chatHistory={enhancedChatHistory} // Use our enhanced history
            inputs={inputs}
            handleChange={handleChange}
            handleKeyNext={handleKeyNext}
            handleKeyNextSubmit={handleKeyNextSubmit}
            handleSubmit={handleSubmit}
            displayedAnswer={shouldShowAnswer ? displayedAnswer : ""}
            currentTypingMessageId={currentTypingMessageId}
            isTyping={isTyping}
            error={error}
            loading={loading || isSubmitting}
          />
        </div>
      </Container>

      <GlobalStyles theme={theme} />
    </Box>
  );
}
