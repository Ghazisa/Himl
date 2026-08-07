import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "@/lib/api";
import { Alert, Button, Field } from "@/components/ui";
import { AuthShell } from "./AuthShell";

/** Three stages: ask for the email, enter the code, then confirm success. */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("request");
  const [form, setForm] = useState({ code: "", new_password: "", confirm_password: "" });
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function requestCode(event) {
    event.preventDefault();
    setErrors([]);
    try {
      await api.post("/auth/password/reset/", { email });
      setStage("confirm");
    } catch (error) {
      setErrors(readErrors(error));
    }
  }

  async function confirmReset(event) {
    event.preventDefault();
    setErrors([]);
    try {
      const { data } = await api.post("/auth/password/reset/confirm/", { email, ...form });
      setNotice(data.detail);
      setStage("done");
    } catch (error) {
      setErrors(readErrors(error));
    }
  }

  return (
    <AuthShell title={t("auth.resetTitle")}>
      {stage === "request" && (
        <form onSubmit={requestCode} className="flex flex-col gap-4" noValidate>
          <p className="text-sm text-gray-600">{t("auth.resetBody")}</p>
          <Alert>{errors}</Alert>
          <Field
            label={t("auth.email")}
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit">{t("auth.resetSend")}</Button>
        </form>
      )}

      {stage === "confirm" && (
        <form onSubmit={confirmReset} className="flex flex-col gap-4" noValidate>
          <Alert>{errors}</Alert>
          <Field
            label={t("auth.otpLabel")}
            required
            inputMode="numeric"
            maxLength={4}
            dir="ltr"
            value={form.code}
            onChange={update("code")}
          />
          <Field
            label={t("auth.resetNewPassword")}
            required
            type="password"
            autoComplete="new-password"
            hint={t("auth.passwordHint")}
            value={form.new_password}
            onChange={update("new_password")}
          />
          <Field
            label={t("auth.confirmPassword")}
            required
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={update("confirm_password")}
          />
          <Button type="submit">{t("auth.resetSubmit")}</Button>
        </form>
      )}

      {stage === "done" && (
        <div className="flex flex-col gap-4">
          <Alert tone="success">{notice}</Alert>
          <Link to="/login" className="text-center text-sm font-semibold text-sa-800 underline">
            {t("auth.backToLogin")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
