import {
  AppBar,
  Container,
  IconButton,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ThemeConfig } from "../types/chat";
import { useState } from "react";

interface AppHeaderProps {
  setDrawerOpen: (open: boolean) => void;
  theme: ThemeConfig;
  themes: Record<string, ThemeConfig>;
  currentTheme: string;
  changeTheme: (themeKey: string) => void;
}

export const AppHeader = ({
  setDrawerOpen,
  theme,
  themes,
  currentTheme,
  changeTheme,
}: AppHeaderProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(menuAnchor);

  const handleThemeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleThemeChange = (themeKey: string) => {
    changeTheme(themeKey);
    handleThemeMenuClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: theme.appBar }}>
      <Container
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 0.5, sm: 0.75, md: 1 },
          position: "relative",
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={() => setDrawerOpen(true)}
          edge="start"
          sx={{
            position: "absolute",
            left: { xs: 8, sm: 12, md: 16 },
            color: theme.userTextColor,
          }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: { xs: ".2rem", md: ".3rem" },
            fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.75rem" },
            color: theme.userTextColor,
          }}
        >
          AI ASSISTANT
        </Typography>

        <Box
          sx={{
            position: "absolute",
            right: { xs: 8, sm: 12, md: 16 },
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            onClick={handleThemeMenuOpen}
            variant="text"
            size="small"
            sx={{
              color: theme.userTextColor,
              minWidth: "auto",
              padding: { xs: "4px 8px", md: "6px 10px" },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Theme
          </Button>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={open}
          onClose={handleThemeMenuClose}
          MenuListProps={{
            "aria-labelledby": "theme-button",
          }}
          PaperProps={{
            sx: {
              backgroundColor: theme.cardBackground,
              color: theme.userTextColor,
              border: `1px solid ${theme.borderColor}`,
            },
          }}
        >
          {Object.entries(themes).map(([key, value]) => (
            <MenuItem
              key={key}
              onClick={() => handleThemeChange(key)}
              sx={{
                backgroundColor:
                  currentTheme === key
                    ? `${value.userBubbleBackground} !important`
                    : "transparent",
                "&:hover": {
                  backgroundColor: value.userBubbleBackground,
                },
              }}
            >
              {value.name}
            </MenuItem>
          ))}
        </Menu>
      </Container>
    </AppBar>
  );
};

export default AppHeader;
