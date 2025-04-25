import { TextField, Button, Box, Typography } from "@mui/material";
import { useRef } from "react";
import { ThemeConfig } from "../types/chat";

interface ChatFormProps {
  inputs: {
    model_name: string;
    prompt: string;
  };
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  handleKeyNext: (event: React.KeyboardEvent, nextIndex: number) => void;
  handleKeyNextSubmit: (event: React.KeyboardEvent) => void;
  theme: ThemeConfig;
  loading: boolean;
  error: string;
  isMobile: boolean;
}

export const ChatForm = ({
  inputs,
  handleChange,
  handleSubmit,
  handleKeyNext,
  handleKeyNextSubmit,
  theme,
  loading,
  error,
  isMobile,
}: ChatFormProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const textFieldStyles = {
    "& .MuiInputBase-input": {
      color: theme.inputTextColor,
      fontSize: { xs: "0.9rem", md: "1rem" },
    },
    "& .MuiInputLabel-root": {
      color: theme.inputLabelColor,
      fontSize: { xs: "0.9rem", md: "1rem" },
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: theme.inputBorderColor },
      "&:hover fieldset": { borderColor: theme.inputHoverBorderColor },
      "&.Mui-focused fieldset": { borderColor: theme.buttonBackground },
    },
    "& .MuiOutlinedInput-root.Mui-focused": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.buttonBackground,
      },
    },
    "& .MuiTouchRipple-root": { color: theme.buttonBackground },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.buttonBackground },
    "& .MuiFilledInput-underline:after": {
      borderBottomColor: theme.buttonBackground,
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: theme.buttonBackground,
    },
  };

  return (
    <>
      {/* Model name field (middle) */}
      <TextField
        fullWidth
        label="Model Name"
        name="model_name"
        placeholder="Enter model name"
        onChange={handleChange}
        value={inputs.model_name}
        onKeyDown={(e) => handleKeyNext(e, 1)}
        inputRef={(el) => (inputRefs.current[0] = el)}
        disabled={loading}
        sx={{
          ...textFieldStyles,
          mb: 2,
        }}
      />

      {/* Prompt field (bottom) */}
      <TextField
        fullWidth
        multiline
        label="Prompt"
        name="prompt"
        placeholder="Ask a question..."
        onChange={handleChange}
        value={inputs.prompt}
        onKeyDown={handleKeyNextSubmit}
        inputRef={(el) => (inputRefs.current[1] = el)}
        disabled={loading}
        sx={{
          mb: 2,
          ...textFieldStyles,
        }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          size={isMobile ? "small" : "medium"}
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            backgroundColor: loading
              ? theme.buttonBackground + "80"
              : theme.buttonBackground,
            "&:hover": { backgroundColor: theme.buttonHoverBackground },
            color: theme.buttonTextColor,
            fontSize: { xs: "0.8rem", md: "0.875rem" },
            py: { xs: 0.5, md: 0.75 },
          }}
        >
          {loading ? "Generating..." : "Send"}
        </Button>

        {error && (
          <Typography color="#ff6b6b" variant="caption" sx={{ ml: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default ChatForm;
