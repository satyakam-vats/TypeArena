import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SoundProvider } from "./context/SoundContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(<StrictMode><BrowserRouter><AuthProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
      </AuthProvider></BrowserRouter></StrictMode>);
