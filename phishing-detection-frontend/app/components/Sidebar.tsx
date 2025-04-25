import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { ChatSession, ThemeConfig } from "../types/chat";
import { getChatTitle, formatSessionDate } from "../utils/formatting";

interface SidebarProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  drawerWidth: number;
  theme: ThemeConfig;
  chatSessions: ChatSession[];
  activeSessionId: string;
  handleNewChat: () => void;
  handleSessionChange: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string, event: React.MouseEvent) => void;
  isHydrated: boolean;
}

export const Sidebar = ({
  drawerOpen,
  setDrawerOpen,
  drawerWidth,
  theme,
  chatSessions,
  activeSessionId,
  handleNewChat,
  handleSessionChange,
  handleDeleteSession,
  isHydrated,
}: SidebarProps) => {
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: theme.cardBackground,
          color: theme.userTextColor,
          borderRight: `1px solid ${theme.borderColor}`,
        },
      }}
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <Typography variant="h6" sx={{ color: theme.userTextColor }}>
          Chats
        </Typography>
        <IconButton
          onClick={() => setDrawerOpen(false)}
          sx={{ color: theme.userTextColor }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* New Chat button in sidebar */}
      <Button
        onClick={() => {
          handleNewChat();
          setDrawerOpen(false);
        }}
        startIcon={<AddIcon />}
        variant="outlined"
        sx={{
          margin: 2,
          color: theme.userTextColor,
          borderColor: theme.inputBorderColor,
          "&:hover": {
            backgroundColor: theme.userBubbleBackground,
            borderColor: theme.userTextColor,
          },
        }}
      >
        New Chat
      </Button>

      <Divider sx={{ borderColor: theme.borderColor }} />

      {/* Chat list */}
      <List sx={{ pt: 0 }}>
        {isHydrated &&
          chatSessions.map((session) => (
            <ListItem
              disablePadding
              key={session.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  sx={{
                    color: theme.inputLabelColor,
                    "&:hover": {
                      color: "#ff6b6b",
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                onClick={() => {
                  if (session.id !== activeSessionId) {
                    handleSessionChange(session.id);
                  }
                }}
                sx={{
                  backgroundColor:
                    session.id === activeSessionId
                      ? theme.userBubbleBackground
                      : "transparent",
                  "&:hover": {
                    backgroundColor:
                      session.id === activeSessionId
                        ? theme.userBubbleBackground
                        : "rgba(255,255,255,0.05)",
                  },
                  pr: 6,
                }}
              >
                <ListItemIcon sx={{ color: theme.userTextColor, minWidth: 36 }}>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText
                  primary={getChatTitle(session)}
                  secondary={formatSessionDate(session.createdAt)}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: { color: theme.userTextColor },
                  }}
                  secondaryTypographyProps={{
                    style: { color: theme.inputLabelColor },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
