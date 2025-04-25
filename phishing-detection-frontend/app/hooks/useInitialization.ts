import { useState, useEffect } from "react";
import { themes } from "../constants/themes";
import { ChatSession } from "../types/chat";

export const useInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [initialChatSessions, setInitialChatSessions] = useState<ChatSession[]>(
    []
  );

  useEffect(() => {
    // Only run once
    if (isInitialized) return;

    // Main initialization function
    const initialize = () => {
      // First handle device detection
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 600);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);

      // Then handle theme
      const savedTheme = localStorage.getItem("chatTheme");
      if (savedTheme && themes[savedTheme]) {
        setCurrentTheme(savedTheme);
      }

      // Finally handle chat sessions
      const savedSessions = localStorage.getItem("chatSessions");
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          // Convert string dates back to Date objects
          const loadedSessions = parsed.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));

          setInitialChatSessions(loadedSessions);
        } catch (e) {
          console.error("Error parsing stored chat sessions:", e);

          // Initialize with a new empty session on error
          const newSessionId = Date.now().toString();
          const newSession = {
            id: newSessionId,
            messages: [],
            createdAt: new Date(),
          };

          setInitialChatSessions([newSession]);
        }
      } else {
        // No saved sessions, create a new one
        const newSessionId = Date.now().toString();
        const newSession = {
          id: newSessionId,
          messages: [],
          createdAt: new Date(),
        };

        setInitialChatSessions([newSession]);
      }

      // Mark initialization as complete
      setIsHydrated(true);
      setIsInitialized(true);
    };

    // Wait until we're fully on client side
    if (typeof window !== "undefined") {
      // We use requestAnimationFrame to ensure DOM is fully ready
      requestAnimationFrame(() => {
        initialize();
      });
    }

    // Cleanup function
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", () =>
          setIsMobile(window.innerWidth < 600)
        );
      }
    };
  }, [isInitialized]);

  const changeTheme = (themeKey: string) => {
    setCurrentTheme(themeKey);
    localStorage.setItem("chatTheme", themeKey);
  };

  return {
    isInitialized,
    isHydrated,
    isMobile,
    currentTheme,
    initialChatSessions,
    changeTheme,
  };
};

export default useInitialization;
