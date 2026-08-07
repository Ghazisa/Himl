import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/features/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AppRoutes } from "./routes";

function Shell() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-sa-800 focus:px-4 focus:py-2 focus:text-white"
      >
        {t("nav.skipToContent")}
      </a>

      <Header />
      <main id="main" className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
