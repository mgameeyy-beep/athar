import { useState } from "react";
import { supabase } from "./lib/supabase";

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      setMessage(
        error
          ? error.message
          : "تم إنشاء الحساب. تحقق من بريدك الإلكتروني ثم سجّل الدخول."
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور.");
      }
    }

    setLoading(false);
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card">
        <div className="logo">أ</div>
        <h1>أثَر</h1>
        <p className="subtitle">
          {isRegister
            ? "أنشئ حسابك وابدأ توثيق رحلتك المهنية"
            : "مرحبًا بعودتك إلى مساحتك المهنية"}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              الاسم
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="اكتب اسمك"
                required
              />
            </label>
          )}

          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              required
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة المرور"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading
              ? "جارٍ التنفيذ..."
              : isRegister
                ? "إنشاء الحساب"
                : "تسجيل الدخول"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <button
          className="switch-button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
        >
          {isRegister
            ? "لديك حساب؟ سجّل الدخول"
            : "ليس لديك حساب؟ أنشئ حسابًا"}
        </button>
      </section>
    </main>
  );
}

export default Auth;
