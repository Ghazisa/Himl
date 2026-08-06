import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "../api";
import { useAuth } from "../auth";
import { Alert, Button, Card, Field, PageHeader, Spinner } from "../ui";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [personal, setPersonal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    setPersonal({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
    });
    api.get("/auth/me/profile/").then(({ data }) => setProfile(data));
  }, [user]);

  if (!personal || !profile) return <Spinner />;

  const isShipper = user.role === "shipper";
  const updatePersonal = (key) => (event) =>
    setPersonal({ ...personal, [key]: event.target.value });
  const updateProfile = (key) => (event) =>
    setProfile({ ...profile, [key]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setNotice("");
    try {
      const { data: updatedUser } = await api.patch("/auth/me/", personal);
      const editable = isShipper
        ? {
            company_name: profile.company_name,
            commercial_registration: profile.commercial_registration,
            city: profile.city,
          }
        : {
            national_id: profile.national_id,
            license_number: profile.license_number,
            city: profile.city,
            years_of_experience: profile.years_of_experience,
          };
      const { data: updatedProfile } = await api.patch("/auth/me/profile/", editable);
      setUser(updatedUser);
      setProfile(updatedProfile);
      setNotice(t("profile.saved"));
    } catch (error) {
      setErrors(readErrors(error));
    }
  }

  return (
    <>
      <PageHeader title={t("profile.title")} />
      <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="-mt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Alert>{errors}</Alert>
          {notice && <Alert tone="success">{notice}</Alert>}

          <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-gold-400"
            >
              {user.first_name?.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-900">{user.full_name}</p>
              <p className="truncate text-sm text-gray-500" dir="ltr">
                {user.email}
              </p>
              <span className="mt-1.5 inline-block rounded-full bg-sa-100 px-2.5 py-0.5 text-xs font-semibold text-sa-800">
                {isShipper ? t("auth.roleShipper") : t("auth.roleTransporter")}
              </span>
            </div>
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-base font-semibold text-gray-900">
              {t("profile.personal")}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("auth.firstName")}
                value={personal.first_name}
                onChange={updatePersonal("first_name")}
              />
              <Field
                label={t("auth.lastName")}
                value={personal.last_name}
                onChange={updatePersonal("last_name")}
              />
            </div>
            <Field
              label={t("auth.phone")}
              dir="ltr"
              value={personal.phone}
              onChange={updatePersonal("phone")}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-base font-semibold text-gray-900">
              {isShipper ? t("profile.company") : t("auth.roleTransporter")}
            </legend>
            {isShipper ? (
              <>
                <Field
                  label={t("profile.company")}
                  value={profile.company_name || ""}
                  onChange={updateProfile("company_name")}
                />
                <Field
                  label={t("profile.cr")}
                  dir="ltr"
                  value={profile.commercial_registration || ""}
                  onChange={updateProfile("commercial_registration")}
                />
              </>
            ) : (
              <>
                <Field
                  label={t("profile.nationalId")}
                  dir="ltr"
                  value={profile.national_id || ""}
                  onChange={updateProfile("national_id")}
                />
                <Field
                  label={t("profile.license")}
                  dir="ltr"
                  value={profile.license_number || ""}
                  onChange={updateProfile("license_number")}
                />
                <Field
                  label={t("profile.experience")}
                  type="number"
                  min="0"
                  value={profile.years_of_experience ?? 0}
                  onChange={updateProfile("years_of_experience")}
                />
              </>
            )}
            <Field
              label={t("profile.city")}
              value={profile.city || ""}
              onChange={updateProfile("city")}
            />
          </fieldset>

          <div>
            <Button type="submit">{t("profile.save")}</Button>
          </div>
        </form>
      </Card>
      </div>
    </>
  );
}
