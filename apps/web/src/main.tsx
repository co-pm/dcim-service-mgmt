import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./routes/App";
import "./styles.css";

const qc = new QueryClient();
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0b4a9f" },
    secondary: { main: "#0f766e" },
    background: { default: "#f2f6fb", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Manrope', sans-serif",
    h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f9 100%)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)"
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: "#f8fafc"
        }
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
