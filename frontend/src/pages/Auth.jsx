import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "../api";
import { homePathFor, useAuth } from "../auth";
import { Alert, Button, Card, Field } from "../ui";

function AuthShell({ title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div className="relative isolate min-h-[80vh] bg-gray-950 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(45rem 24rem at 75% -10%, #14573a 0%, transparent 62%), radial-gradient(35rem 20rem at 15% 110%, #472400 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-md px-4">
        <p className="mb-5 text-center text-xs font-semibold tracking-wide text-gold-400">
          {t("app.name")} · {t("app.tagline")}
        </p>
        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Login() {
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
        <Link to="/forgot-password" className="text-sm font-medium text-sa-700 underline">
          {t("auth.forgot")}
        </Link>
        <Button type="submit" disabled={busy}>
          {busy ? t("common.loading") : t("auth.submitLogin")}
        </Button>
        <p className="text-center text-sm text-gray-500">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="font-semibold text-sa-700 underline">
            {t("auth.signupLink")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "shipper",
  });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      await api.post("/auth/register/", {
        ...form,
        preferred_language: i18n.resolvedLanguage,
      });
      navigate("/verify", { state: { email: form.email } });
    } catch (error) {
      setErrors(readErrors(error));
    } finally {
      setBusy(false);
    }
  }

  const roles = [
    { value: "shipper", label: t("auth.roleShipper"), hint: t("auth.roleShipperHint") },
    {
      value: "transporter",
      label: t("auth.roleTransporter"),
      hint: t("auth.roleTransporterHint"),
    },
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
                <span className="mt-1 block text-xs text-gray-500">{role.hint}</span>
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
        <p className="text-center text-sm text-gray-500">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-sa-700 underline">
            {t("auth.loginLink")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function VerifyOTP() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const email = location.state?.email || "";
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const inputs = useRef([]);

  function handleDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const { data } = await api.post("/auth/otp/verify/", {
        email,
        code: digits.join(""),
      });
      navigate(homePathFor(signIn(data)), { replace: true });
    } catch (error) {
      setErrors(readErrors(error));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setNotice("");
    setErrors([]);
    try {
      await api.post("/auth/otp/resend/", { email });
      setNotice(t("auth.otpResent"));
    } catch (error) {
      setErrors(readErrors(error));
    }
  }

  return (
    <AuthShell title={t("auth.otpTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-sm leading-relaxed text-gray-500">{t("auth.otpBody", { email })}</p>
        <Alert>{errors}</Alert>
        {notice && <Alert tone="success">{notice}</Alert>}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-900">{t("auth.otpLabel")}</legend>
          {/* Fixed LTR: the code reads left-to-right in both languages. */}
          <div className="flex justify-center gap-3" dir="ltr">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => (inputs.current[index] = element)}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                required
                aria-label={t("auth.otpDigit", { n: index + 1 })}
                value={digit}
                onChange={(event) => handleDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="h-16 w-14 rounded-xl border-2 border-gray-300 bg-white text-center text-3xl font-bold text-gray-900"
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" disabled={busy || digits.some((d) => !d)}>
          {busy ? t("common.loading") : t("auth.otpSubmit")}
        </Button>
        <Button type="button" variant="ghost" onClick={resend}>
          {t("auth.otpResend")}
        </Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
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
          <p className="text-sm text-gray-500">{t("auth.resetBody")}</p>
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
          <Link to="/login" className="text-center text-sm font-semibold text-sa-700 underline">
            {t("auth.backToLogin")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
