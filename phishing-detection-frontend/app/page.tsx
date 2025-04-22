"use client";
import styles from "./page.module.css";
import AppBar from "@mui/material/AppBar";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useState, useRef } from "react";

export default function Home() {
  const [inputs, setInputs] = useState({
    model_name: "",
    prompt: "",
  });

  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Refs for dynamic focus chaining
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleKeyNext = (event: React.KeyboardEvent, nextIndex: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const next = inputRefs.current[nextIndex];
      if (next) next.focus();
    }
  };

  const handleKeyNextSubmit = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}:${process.env.NEXT_PUBLIC_API_PORT}/${process.env.NEXT_PUBLIC_API_PREFIX}/model/generate`,
        {
          model_name: inputs.model_name,
          prompt: inputs.prompt,
        }
      );
      setAnswer(data.result.completion);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching the answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            py: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: ".3rem",
            }}
          >
            AI ASSISTANT
          </Typography>
        </Container>
      </AppBar>

      <Container
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card variant="outlined" sx={{ minWidth: 512 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Model Name"
              name="model_name"
              placeholder="Enter model name"
              onChange={handleChange}
              value={inputs.model_name}
              onKeyDown={(e) => handleKeyNext(e, 1)}
              inputRef={(el) => (inputRefs.current[0] = el)}
            />
          </CardContent>

          <CardContent>
            <TextField
              fullWidth
              multiline
              label="Prompt"
              name="prompt"
              placeholder="Classify as ham or spam: ..."
              onChange={handleChange}
              value={inputs.prompt}
              onKeyDown={handleKeyNextSubmit}
              inputRef={(el) => (inputRefs.current[1] = el)}
            />
          </CardContent>

          <CardContent>
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </Button>
          </CardContent>

          {error && (
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          )}

          <CardContent>
            <Typography variant="subtitle1">Result</Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography>{answer}</Typography>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
