import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "@/lib/api";
import { Alert, Button, Field } from "@/components/ui";
import { AuthShell } from "./AuthShell";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  role: "shipper",
};

export function SignupPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      await api.post("/auth/register/", { ...form, preferred_language: i18n.resolvedLanguage });
      navigate("/verify", { state: { email: form.email } });
    } catch (error) {
      setErrors(readErrors(error));
    } finally {
      setBusy(false);
    }
  }

  const roles = [
    { value: "shipper", label: t("auth.roleShipper"), hint: t("auth.roleShipperHint") },
    { value: "transporter", label: t("auth.roleTransporter"), hint: t("auth.roleTransporterHint") },
  ];

  return (
    <AuthShell title={t("auth.signupTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert>{errors}</Alert>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-gray-900">{t("auth.role")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`cursor-pointer rounded-xl border-2 p-3.5 text-sm transition-colors ${
                  form.role === role.value
                    ? "border-sa-600 bg-sa-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={update("role")}
                  />
                  {role.label}
                </span>
                <span className="mt-1 block text-xs text-gray-600">{role.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("auth.firstName")}
            required
            autoComplete="given-name"
            value={form.first_name}
            onChange={update("first_name")}
          />
          <Field
            label={t("auth.lastName")}
            required
            autoComplete="family-name"
            value={form.last_name}
            onChange={update("last_name")}
          />
        </div>
        <Field
          label={t("auth.email")}
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update("email")}
        />
        <Field
          label={t("auth.phone")}
          required
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          hint={t("auth.phoneHint")}
          value={form.phone}
          onChange={update("phone")}
        />
        <Field
          label={t("auth.password")}
          required
          type="password"
          autoComplete="new-password"
          hint={t("auth.passwordHint")}
          value={form.password}
          onChange={update("password")}
        />
        <Field
          label={t("auth.confirmPassword")}
          required
          type="password"
          autoComplete="new-password"
          value={form.confirm_password}
          onChange={update("confirm_password")}
        />
        <Button type="submit" disabled={busy}>
          {busy ? t("common.loading") : t("auth.submitSignup")}
        </Button>
        <p className="text-center text-sm text-gray-600">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-sa-800 underline">
            {t("auth.loginLink")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
