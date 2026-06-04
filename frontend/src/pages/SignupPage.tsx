import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { UserPlus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { signup } from "@/lib/auth";

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({ email, name, password });
      void navigate({ to: "/" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.trim() || "Sign up failed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper text-black px-6 py-7">
      <div className="flex items-end justify-center gap-3 h-[150px]">
        <DotLottieReact
          src="/voro_2.lottie"
          autoplay
          loop
          aria-label="voro"
          style={{ width: 118, height: 126 }}
        />
        <div className="mb-7 px-5 py-3 border-2 border-black rounded-2xl sketch bg-paper shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-sm italic">Nice to meet you!</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 rounded-sm border-2 border-black px-4 outline-none bg-paper focus:shadow-[3px_3px_0_0_rgba(0,0,0,1)] sketch"
            autoComplete="name"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-sm border-2 border-black px-4 outline-none bg-paper focus:shadow-[3px_3px_0_0_rgba(0,0,0,1)] sketch"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-sm border-2 border-black px-4 outline-none bg-paper focus:shadow-[3px_3px_0_0_rgba(0,0,0,1)] sketch"
            autoComplete="new-password"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>Confirm Password</span>
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-12 rounded-sm border-2 border-black px-4 outline-none bg-paper focus:shadow-[3px_3px_0_0_rgba(0,0,0,1)] sketch"
            autoComplete="new-password"
            required
          />
        </label>

        <div className="min-h-5 text-xs text-red-600" role="alert">
          {error}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex h-12 items-center justify-center gap-2 rounded-sm border-2 border-black bg-black text-sm text-white disabled:opacity-50 sketch shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(0,0,0,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>{submitting ? "Creating account..." : "Sign up"}</span>
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default SignupPage;
