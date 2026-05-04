import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AdminAuthProvider } from "./hooks/useAdminAuth";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AdminAuthProvider>
    <App />
  </AdminAuthProvider>
);