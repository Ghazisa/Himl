import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "@/lib/api";
import { homePathFor, useAuth } from "@/features/auth/AuthContext";
import { Alert, Button, Field } from "@/components/ui";
import { AuthShell } from "./AuthShell";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const { data } = await api.post("/auth/login/", form);
      navigate(homePathFor(signIn(data)), { replace: true });
    } catch (error) {
      // An unverified account is not a failure — send them to finish verifying.
      if (error.response?.data?.verification_required) {
        navigate("/verify", { state: { email: error.response.data.email } });
        return;
      }
      setErrors(readErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t("auth.loginTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert>{errors}</Alert>
        <Field
          label={t("auth.identifier")}
          required
          type="text"
          autoComplete="username"
          value={form.identifier}
          onChange={update("identifier")}
        />
        <Field
          label={t("auth.password")}
          required
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update("password")}
        />
        <Link to="/forgot-password" className="text-sm font-medium text-sa-800 underline">
          {t("auth.forgot")}
        </Link>
        <Button type="submit" disabled={busy}>
          {busy ? t("common.loading") : t("auth.submitLogin")}
        </Button>
        <p className="text-center text-sm text-gray-600">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="font-semibold text-sa-800 underline">
            {t("auth.signupLink")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
