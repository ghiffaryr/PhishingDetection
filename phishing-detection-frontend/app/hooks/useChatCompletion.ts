import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChatMessage } from "../types/chat";

export const useChatCompletion = () => {
  const [inputs, setInputs] = useState({
    model_name: "",
    prompt: "",
  });
  const [answer, setAnswer] = useState("");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<
    string | null
  >(null);

  // Add a ref to track the current chat history
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  // Add a ref to track the update function
  const updateChatHistoryRef = useRef<(history: ChatMessage[]) => void>(
    () => {}
  );

  // Typing effect for assistant messages
  useEffect(() => {
    if (!answer) return;

    setDisplayedAnswer("");
    setIsTyping(true);

    let currentIndex = 0;
    const typingSpeed = 15; // ms per character

    const typingInterval = setInterval(() => {
      if (currentIndex < answer.length) {
        setDisplayedAnswer(answer.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);

        // When typing is complete, ensure the assistant message has the final content
        if (
          currentTypingMessageId &&
          chatHistoryRef.current.length > 0 &&
          updateChatHistoryRef.current
        ) {
          const updatedHistory = chatHistoryRef.current.map((msg) =>
            msg.id === currentTypingMessageId
              ? { ...msg, content: answer }
              : msg
          );

          // Update the chat history in the component
          updateChatHistoryRef.current(updatedHistory);

          // Also update localStorage with the final message content
          try {
            const activeSessionId = localStorage.getItem("activeSessionId");
            if (activeSessionId) {
              const sessions = JSON.parse(
                localStorage.getItem("chatSessions") || "[]"
              );
              const updatedSessions = sessions.map((session: any) => {
                if (session.id === activeSessionId) {
                  return {
                    ...session,
                    messages: updatedHistory,
                    lastUpdated: new Date().toISOString(),
                  };
                }
                return session;
              });
              localStorage.setItem(
                "chatSessions",
                JSON.stringify(updatedSessions)
              );
            }
          } catch (storageErr) {
            console.error(
              "Failed to update final message in localStorage:",
              storageErr
            );
          }
        }

        setCurrentTypingMessageId(null);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [answer]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (
    chatHistory: ChatMessage[],
    updateChatHistory: (updatedHistory: ChatMessage[]) => void
  ) => {
    // Store the current chat history and update function in refs so the typing effect can access them
    chatHistoryRef.current = chatHistory;
    updateChatHistoryRef.current = updateChatHistory;

    if (!inputs.prompt.trim()) return;

    // Add user message to chat history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputs.prompt,
      timestamp: new Date(),
    };

    const newChatHistory = [...chatHistory, userMessage];
    updateChatHistory(newChatHistory);

    // Create a placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "", // This will be updated once typing is complete
      timestamp: new Date(),
    };

    updateChatHistory([...newChatHistory, assistantPlaceholder]);
    setCurrentTypingMessageId(assistantMessageId);
    setLoading(true);
    setError("");

    try {
      // Create context from previous messages
      console.log("Chat history:", chatHistory);
      const context =
        chatHistory.length > 0
          ? chatHistory
              .map((msg) => {
                // Ensure each message has proper content formatting
                const content = msg.content || "";
                // Use a consistent role prefix for each message
                const rolePrefix = msg.role === "user" ? "User" : "Assistant";
                return `${rolePrefix}: ${content}`;
              })
              .join("\n\n")
          : "";

      console.log("Building context:", context);
      console.log("Current prompt:", inputs.prompt);

      // Send request with separate prompt and context fields
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}:${process.env.NEXT_PUBLIC_API_PORT}/${process.env.NEXT_PUBLIC_API_PREFIX}/model/generate`,
        {
          model_name: inputs.model_name,
          prompt: inputs.prompt,
          context: context,
        }
      );

      setAnswer(data.result.completion);

      // Update the chat history reference with the new history including the placeholder
      chatHistoryRef.current = [
        ...newChatHistory,
        {
          ...assistantPlaceholder,
          content: data.result.completion,
        },
      ];

      // Store the updated chat history in localStorage
      try {
        // Find the current activeSessionId from localStorage
        const activeSessionId = localStorage.getItem("activeSessionId");
        if (activeSessionId) {
          // Get existing sessions
          const sessions = JSON.parse(
            localStorage.getItem("chatSessions") || "[]"
          );
          // Find and update the active session
          const updatedSessions = sessions.map((session: any) => {
            if (session.id === activeSessionId) {
              return {
                ...session,
                messages: chatHistoryRef.current,
                lastUpdated: new Date().toISOString(),
              };
            }
            return session;
          });
          // Save back to localStorage
          localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
        }
      } catch (storageErr) {
        console.error("Failed to save chat to localStorage:", storageErr);
      }

      // Clear the prompt input after submission
      setInputs((prev) => ({
        ...prev,
        prompt: "",
      }));

      return {
        success: true,
        messageId: assistantMessageId,
        updatedHistory: [
          ...newChatHistory,
          {
            ...assistantPlaceholder,
            content: data.result.completion,
          },
        ],
      };
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching the answer.");

      // Remove the placeholder on error
      updateChatHistory(newChatHistory);
      return {
        success: false,
        error: "API request failed",
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    inputs,
    setInputs,
    answer,
    displayedAnswer,
    isTyping,
    error,
    loading,
    currentTypingMessageId,
    handleChange,
    handleSubmit,
  };
};

export default useChatCompletion;
