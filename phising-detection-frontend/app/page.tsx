"use client";
import styles from "./page.module.css";
import QnAForm from "./components/QnAForm";
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
import { useState } from "react";

export default function Home() {
  const [inputs, setInputs] = useState({
    model_name: "",
    prompt: "",
  });

  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  function handleChange(e: any) {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  }

  const handleSubmit = async () => {
    axios.defaults.headers.common = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    };
    try {
      let { status, data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API_HOST}:${process.env.NEXT_PUBLIC_BACKEND_API_PORT}/${process.env.NEXT_PUBLIC_BACKEND_API_PREFIX}/model/generate`,
        {
          model_name: inputs.model_name,
          prompt: inputs.prompt,
        }
      );
      console.log(data);
      for (let cur_result of data.result) {
        setAnswer(cur_result.completion);
      }
      setAnswer(data.result);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Container
          style={{
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 5,
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
      <>
        <Container
          style={{
            marginTop: 20,
            flexDirection: "column",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card variant="outlined" style={{ minWidth: 512 }}>
            <CardContent>
              <TextField
                fullWidth
                label="model_name"
                name="model_name"
                placeholder="Model name"
                onChange={handleChange}
                value={inputs.model_name}
              />
            </CardContent>
            <CardContent>
              <TextField
                fullWidth
                label="prompt"
                name="prompt"
                placeholder="Classify as ham or spam: "
                multiline
                onChange={handleChange}
                value={inputs.prompt}
              />
            </CardContent>
            <CardContent>
              <Button size="small" variant="contained" onClick={handleSubmit}>
                Generate
              </Button>
            </CardContent>
            <CardContent>
              <Typography>Result</Typography>
              <Card variant="outlined">
                <CardContent></CardContent>
              </Card>
            </CardContent>
          </Card>
        </Container>
      </>
    </>
  );
}
