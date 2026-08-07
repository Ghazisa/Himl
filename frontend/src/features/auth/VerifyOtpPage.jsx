import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "@/lib/api";
import { homePathFor, useAuth } from "@/features/auth/AuthContext";
import { Alert, Button } from "@/components/ui";
import { AuthShell } from "./AuthShell";

const CODE_LENGTH = 4;

export function VerifyOtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const email = location.state?.email || "";
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const inputs = useRef([]);

  function handleDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
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
      const { data } = await api.post("/auth/otp/verify/", { email, code: digits.join("") });
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
        <p className="text-sm leading-relaxed text-gray-600">{t("auth.otpBody", { email })}</p>
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

        <Button type="submit" disabled={busy || digits.some((digit) => !digit)}>
          {busy ? t("common.loading") : t("auth.otpSubmit")}
        </Button>
        <Button type="button" variant="ghost" onClick={resend}>
          {t("auth.otpResend")}
        </Button>
      </form>
    </AuthShell>
  );
}
