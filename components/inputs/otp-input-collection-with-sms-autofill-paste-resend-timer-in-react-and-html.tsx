import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactElement } from "react";

/*
  Every piece below is written once: the function renders the live demo and the
  string next to it is that same source file, so the code you copy is the code you see.
*/

type Lang = "react" | "html";
type Piece = {
  id: string;
  name: string;
  blurb: string;
  group: string;
  Demo: () => ReactElement;
  react: string;
  html?: string;
  stage: string;
};

const o1Demo = (() => {
const LENGTH = 6;

function OtpSingleField() {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebOTP: where the browser supports it (Chrome on Android), fill the code from the SMS.
  // The text message must end with a line like: @yourdomain.com #123456
  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((cred) => {
        const otp = (cred as unknown as { code?: string } | null)?.code;
        if (otp) setCode(otp.replace(/\D/g, "").slice(0, LENGTH));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const clean = (v: string) => v.replace(/\D/g, "").slice(0, LENGTH);
  const active = focused ? Math.min(code.length, LENGTH - 1) : -1;

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="otp-single" className="block text-sm font-semibold text-slate-900">
        Verification code
      </label>
      <p id="otp-single-help" className="mt-1 text-sm text-slate-600">
        We texted a 6-digit code to the number ending 0142.
      </p>
      <div className="relative mt-4">
        <input
          ref={inputRef}
          id="otp-single"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={LENGTH}
          value={code}
          aria-describedby="otp-single-help"
          onChange={(e) => setCode(clean(e.target.value))}
          onPaste={(e) => {
            e.preventDefault();
            setCode(clean(e.clipboardData.getData("text")));
          }}
          onFocus={(e) => {
            setFocused(true);
            const end = e.currentTarget.value.length;
            e.currentTarget.setSelectionRange(end, end);
          }}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none"
        />
        <div aria-hidden="true" className="grid grid-cols-6 gap-2">
          {Array.from({ length: LENGTH }, (_, i) => (
            <div
              key={i}
              className={`grid h-12 place-items-center rounded-lg border bg-white font-mono text-xl font-semibold text-slate-900 shadow-sm transition-colors ${
                i === active ? "border-indigo-600 ring-2 ring-indigo-600/25" : "border-slate-300"
              }`}
            >
              {code[i] ?? (i === active ? <span className="h-5 w-px animate-pulse bg-slate-900 motion-reduce:animate-none" /> : "")}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600">Paste the whole code or let your phone fill it in.</p>
    </div>
  );
}
  return OtpSingleField;
})();
const o1React = "import { useEffect, useRef, useState } from \"react\";\n\nconst LENGTH = 6;\n\nexport default function OtpSingleField() {\n  const [code, setCode] = useState(\"\");\n  const [focused, setFocused] = useState(false);\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  // WebOTP: where the browser supports it (Chrome on Android), fill the code from the SMS.\n  // The text message must end with a line like: @yourdomain.com #123456\n  useEffect(() => {\n    if (!(\"OTPCredential\" in window)) return;\n    const ac = new AbortController();\n    navigator.credentials\n      .get({ otp: { transport: [\"sms\"] }, signal: ac.signal } as CredentialRequestOptions)\n      .then((cred) => {\n        const otp = (cred as unknown as { code?: string } | null)?.code;\n        if (otp) setCode(otp.replace(/\\D/g, \"\").slice(0, LENGTH));\n      })\n      .catch(() => {});\n    return () => ac.abort();\n  }, []);\n\n  const clean = (v: string) => v.replace(/\\D/g, \"\").slice(0, LENGTH);\n  const active = focused ? Math.min(code.length, LENGTH - 1) : -1;\n\n  return (\n    <div className=\"w-full max-w-xs\">\n      <label htmlFor=\"otp-single\" className=\"block text-sm font-semibold text-slate-900\">\n        Verification code\n      </label>\n      <p id=\"otp-single-help\" className=\"mt-1 text-sm text-slate-600\">\n        We texted a 6-digit code to the number ending 0142.\n      </p>\n      <div className=\"relative mt-4\">\n        <input\n          ref={inputRef}\n          id=\"otp-single\"\n          type=\"text\"\n          inputMode=\"numeric\"\n          autoComplete=\"one-time-code\"\n          pattern=\"[0-9]*\"\n          maxLength={LENGTH}\n          value={code}\n          aria-describedby=\"otp-single-help\"\n          onChange={(e) => setCode(clean(e.target.value))}\n          onPaste={(e) => {\n            e.preventDefault();\n            setCode(clean(e.clipboardData.getData(\"text\")));\n          }}\n          onFocus={(e) => {\n            setFocused(true);\n            const end = e.currentTarget.value.length;\n            e.currentTarget.setSelectionRange(end, end);\n          }}\n          onBlur={() => setFocused(false)}\n          className=\"absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none\"\n        />\n        <div aria-hidden=\"true\" className=\"grid grid-cols-6 gap-2\">\n          {Array.from({ length: LENGTH }, (_, i) => (\n            <div\n              key={i}\n              className={`grid h-12 place-items-center rounded-lg border bg-white font-mono text-xl font-semibold text-slate-900 shadow-sm transition-colors ${\n                i === active ? \"border-indigo-600 ring-2 ring-indigo-600/25\" : \"border-slate-300\"\n              }`}\n            >\n              {code[i] ?? (i === active ? <span className=\"h-5 w-px animate-pulse bg-slate-900 motion-reduce:animate-none\" /> : \"\")}\n            </div>\n          ))}\n        </div>\n      </div>\n      <p className=\"mt-3 text-xs text-slate-600\">Paste the whole code or let your phone fill it in.</p>\n    </div>\n  );\n}\n";

const o1Html = `<div class="otp">
  <label for="otp-single" class="otp-label">Verification code</label>
  <p id="otp-single-help" class="otp-help">We texted a 6-digit code to the number ending 0142.</p>
  <div class="otp-wrap">
    <input id="otp-single" class="otp-input" type="text" inputmode="numeric"
      autocomplete="one-time-code" pattern="[0-9]*" maxlength="6"
      aria-describedby="otp-single-help">
    <div class="otp-boxes" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
  <p class="otp-note">Paste the whole code or let your phone fill it in.</p>
</div>

<style>
  .otp { max-width: 20rem; font-family: system-ui, sans-serif; color: #0f172a; }
  .otp-label { display: block; font-size: 14px; font-weight: 600; }
  .otp-help, .otp-note { margin: 4px 0 0; font-size: 14px; color: #475569; }
  .otp-note { margin-top: 12px; font-size: 12px; }
  .otp-wrap { position: relative; margin-top: 16px; }
  /* The real input sits on top, invisible, so typing, paste and autofill all work. */
  .otp-input { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%;
    opacity: 0; font-size: 16px; color: transparent; caret-color: transparent; border: 0; }
  .otp-boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .otp-boxes span { display: grid; place-items: center; height: 48px; border: 1px solid #cbd5e1;
    border-radius: 8px; background: #fff; font: 600 20px ui-monospace, monospace;
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.05); }
  .otp-boxes span.is-active { border-color: #4f46e5; box-shadow: 0 0 0 3px rgb(79 70 229 / 0.25); }
</style>

<script>
  (() => {
    const input = document.getElementById("otp-single");
    const boxes = [...document.querySelectorAll(".otp-boxes span")];
    const LENGTH = boxes.length;
    const clean = (v) => v.replace(/\\D/g, "").slice(0, LENGTH);

    function render() {
      const focused = document.activeElement === input;
      const active = Math.min(input.value.length, LENGTH - 1);
      boxes.forEach((box, i) => {
        box.textContent = input.value[i] || "";
        box.classList.toggle("is-active", focused && i === active);
      });
    }

    input.addEventListener("input", () => { input.value = clean(input.value); render(); });
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      input.value = clean(e.clipboardData.getData("text"));
      render();
    });
    input.addEventListener("focus", () => {
      input.setSelectionRange(input.value.length, input.value.length);
      render();
    });
    input.addEventListener("blur", render);

    // WebOTP (Chrome on Android): the SMS must end with "@your-domain #123456".
    if ("OTPCredential" in window) {
      const ac = new AbortController();
      navigator.credentials
        .get({ otp: { transport: ["sms"] }, signal: ac.signal })
        .then((otp) => { if (otp) { input.value = clean(otp.code); render(); } })
        .catch(() => {});
      input.form?.addEventListener("submit", () => ac.abort());
    }
  })();
</script>
`;

const o2Demo = (() => {
const SIZE = 6;

function OtpSplitFields() {
  const [digits, setDigits] = useState<string[]>(Array(SIZE).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusAt = (i: number) => refs.current[Math.max(0, Math.min(SIZE - 1, i))]?.focus();

  // Spreads pasted or autofilled text across the boxes from position `from`.
  function fill(from: number, text: string) {
    const chars = text.replace(/\D/g, "").split("").slice(0, SIZE - from);
    if (!chars.length) return;
    const next = [...digits];
    chars.forEach((c, k) => (next[from + k] = c));
    setDigits(next);
    focusAt(from + chars.length);
  }

  function onChange(i: number, value: string) {
    const v = value.replace(/\D/g, "");
    if (v.length > 1) return fill(i, v);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v) focusAt(i + 1);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  return (
    <div role="group" aria-labelledby="otp-split-label" aria-describedby="otp-split-help" className="w-full max-w-xs">
      <p id="otp-split-label" className="text-sm font-semibold text-slate-900">
        Sign-in code
      </p>
      <p id="otp-split-help" className="mt-1 text-sm text-slate-600">
        Sent to dana@lumenfield.co. It expires in 10 minutes.
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        {digits.map((d, i) => (
          <Fragment key={i}>
            {i === SIZE / 2 && <span aria-hidden="true" className="mx-0.5 h-0.5 w-2.5 shrink-0 rounded bg-slate-400" />}
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              aria-label={`Digit ${i + 1} of ${SIZE}`}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={SIZE}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => {
                e.preventDefault();
                fill(i, e.clipboardData.getData("text"));
              }}
              className="h-12 w-full min-w-0 max-w-[3rem] flex-1 rounded-xl border border-slate-300 bg-slate-50 text-center font-mono text-lg font-semibold text-slate-900 outline-none transition-colors focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/15"
            />
          </Fragment>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600">{digits.join("").length} of {SIZE} digits entered</p>
    </div>
  );
}
  return OtpSplitFields;
})();
const o2React = "import { Fragment, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst SIZE = 6;\n\nexport default function OtpSplitFields() {\n  const [digits, setDigits] = useState<string[]>(Array(SIZE).fill(\"\"));\n  const refs = useRef<(HTMLInputElement | null)[]>([]);\n  const focusAt = (i: number) => refs.current[Math.max(0, Math.min(SIZE - 1, i))]?.focus();\n\n  // Spreads pasted or autofilled text across the boxes from position `from`.\n  function fill(from: number, text: string) {\n    const chars = text.replace(/\\D/g, \"\").split(\"\").slice(0, SIZE - from);\n    if (!chars.length) return;\n    const next = [...digits];\n    chars.forEach((c, k) => (next[from + k] = c));\n    setDigits(next);\n    focusAt(from + chars.length);\n  }\n\n  function onChange(i: number, value: string) {\n    const v = value.replace(/\\D/g, \"\");\n    if (v.length > 1) return fill(i, v);\n    const next = [...digits];\n    next[i] = v;\n    setDigits(next);\n    if (v) focusAt(i + 1);\n  }\n\n  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {\n    if (e.key === \"Backspace\" && !digits[i] && i > 0) {\n      e.preventDefault();\n      const next = [...digits];\n      next[i - 1] = \"\";\n      setDigits(next);\n      focusAt(i - 1);\n    } else if (e.key === \"ArrowLeft\") {\n      e.preventDefault();\n      focusAt(i - 1);\n    } else if (e.key === \"ArrowRight\") {\n      e.preventDefault();\n      focusAt(i + 1);\n    }\n  }\n\n  return (\n    <div role=\"group\" aria-labelledby=\"otp-split-label\" aria-describedby=\"otp-split-help\" className=\"w-full max-w-xs\">\n      <p id=\"otp-split-label\" className=\"text-sm font-semibold text-slate-900\">\n        Sign-in code\n      </p>\n      <p id=\"otp-split-help\" className=\"mt-1 text-sm text-slate-600\">\n        Sent to dana@lumenfield.co. It expires in 10 minutes.\n      </p>\n      <div className=\"mt-4 flex items-center gap-1.5\">\n        {digits.map((d, i) => (\n          <Fragment key={i}>\n            {i === SIZE / 2 && <span aria-hidden=\"true\" className=\"mx-0.5 h-0.5 w-2.5 shrink-0 rounded bg-slate-400\" />}\n            <input\n              ref={(el) => {\n                refs.current[i] = el;\n              }}\n              value={d}\n              aria-label={`Digit ${i + 1} of ${SIZE}`}\n              type=\"text\"\n              inputMode=\"numeric\"\n              autoComplete={i === 0 ? \"one-time-code\" : \"off\"}\n              maxLength={SIZE}\n              onFocus={(e) => e.currentTarget.select()}\n              onChange={(e) => onChange(i, e.target.value)}\n              onKeyDown={(e) => onKeyDown(i, e)}\n              onPaste={(e) => {\n                e.preventDefault();\n                fill(i, e.clipboardData.getData(\"text\"));\n              }}\n              className=\"h-12 w-full min-w-0 max-w-[3rem] flex-1 rounded-xl border border-slate-300 bg-slate-50 text-center font-mono text-lg font-semibold text-slate-900 outline-none transition-colors focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/15\"\n            />\n          </Fragment>\n        ))}\n      </div>\n      <p className=\"mt-3 text-xs text-slate-600\">{digits.join(\"\").length} of {SIZE} digits entered</p>\n    </div>\n  );\n}\n";

const o3Demo = (() => {
const CODE_LENGTH = 6;
const DEMO_CODE = "246810"; // in a real app the server checks the code
const RESEND_AFTER = 30;
const MISMATCH = "That code does not match. Check the newest text and try again.";

function OtpWithResend() {
  const [code, setCode] = useState("246811");
  const [error, setError] = useState(MISMATCH);
  const [seconds, setSeconds] = useState(RESEND_AFTER);
  const [status, setStatus] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function update(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH));
    setError("");
    setStatus("");
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    if (code.length < CODE_LENGTH) setError(`Enter all ${CODE_LENGTH} digits.`);
    else if (code !== DEMO_CODE) setError(MISMATCH);
    else return setStatus("Code accepted. Signing you in.");
    inputRef.current?.focus();
  }

  function resend() {
    setSeconds(RESEND_AFTER);
    update("");
    setStatus("A new code is on its way.");
    inputRef.current?.focus();
  }

  const active = focused ? Math.min(code.length, CODE_LENGTH - 1) : -1;

  return (
    <form onSubmit={verify} noValidate className="w-full max-w-xs">
      <label htmlFor="otp-resend" className="block text-sm font-semibold text-slate-900">
        Enter your code
      </label>
      <p id="otp-resend-help" className="mt-1 text-sm text-slate-600">
        Demo code: 246810
      </p>
      <div className="relative mt-3">
        <input
          ref={inputRef}
          id="otp-resend"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={CODE_LENGTH}
          value={code}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "otp-resend-help otp-resend-error" : "otp-resend-help"}
          onChange={(e) => update(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            update(e.clipboardData.getData("text"));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none"
        />
        <div aria-hidden="true" className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <div
              key={i}
              className={`grid h-12 place-items-center rounded-md border-2 bg-white font-mono text-lg font-semibold tabular-nums transition-colors ${
                error ? "border-rose-500 text-rose-700" : i === active ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-900"
              }`}
            >
              {code[i] ?? ""}
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p id="otp-resend-error" role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        Verify
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span role="status" className="text-emerald-700">
          {status}
        </span>
        <button
          type="button"
          onClick={resend}
          disabled={seconds > 0}
          className="h-10 rounded-md px-2 font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent"
        >
          {seconds > 0 ? `Resend in 0:${String(seconds).padStart(2, "0")}` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
  return OtpWithResend;
})();
const o3React = "import { useEffect, useRef, useState, type FormEvent } from \"react\";\n\nconst CODE_LENGTH = 6;\nconst DEMO_CODE = \"246810\"; // in a real app the server checks the code\nconst RESEND_AFTER = 30;\nconst MISMATCH = \"That code does not match. Check the newest text and try again.\";\n\nexport default function OtpWithResend() {\n  const [code, setCode] = useState(\"246811\");\n  const [error, setError] = useState(MISMATCH);\n  const [seconds, setSeconds] = useState(RESEND_AFTER);\n  const [status, setStatus] = useState(\"\");\n  const [focused, setFocused] = useState(false);\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  useEffect(() => {\n    if (seconds <= 0) return;\n    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);\n    return () => clearTimeout(id);\n  }, [seconds]);\n\n  function update(value: string) {\n    setCode(value.replace(/\\D/g, \"\").slice(0, CODE_LENGTH));\n    setError(\"\");\n    setStatus(\"\");\n  }\n\n  function verify(e: FormEvent) {\n    e.preventDefault();\n    if (code.length < CODE_LENGTH) setError(`Enter all ${CODE_LENGTH} digits.`);\n    else if (code !== DEMO_CODE) setError(MISMATCH);\n    else return setStatus(\"Code accepted. Signing you in.\");\n    inputRef.current?.focus();\n  }\n\n  function resend() {\n    setSeconds(RESEND_AFTER);\n    update(\"\");\n    setStatus(\"A new code is on its way.\");\n    inputRef.current?.focus();\n  }\n\n  const active = focused ? Math.min(code.length, CODE_LENGTH - 1) : -1;\n\n  return (\n    <form onSubmit={verify} noValidate className=\"w-full max-w-xs\">\n      <label htmlFor=\"otp-resend\" className=\"block text-sm font-semibold text-slate-900\">\n        Enter your code\n      </label>\n      <p id=\"otp-resend-help\" className=\"mt-1 text-sm text-slate-600\">\n        Demo code: 246810\n      </p>\n      <div className=\"relative mt-3\">\n        <input\n          ref={inputRef}\n          id=\"otp-resend\"\n          type=\"text\"\n          inputMode=\"numeric\"\n          autoComplete=\"one-time-code\"\n          pattern=\"[0-9]*\"\n          maxLength={CODE_LENGTH}\n          value={code}\n          aria-invalid={error ? true : undefined}\n          aria-describedby={error ? \"otp-resend-help otp-resend-error\" : \"otp-resend-help\"}\n          onChange={(e) => update(e.target.value)}\n          onPaste={(e) => {\n            e.preventDefault();\n            update(e.clipboardData.getData(\"text\"));\n          }}\n          onFocus={() => setFocused(true)}\n          onBlur={() => setFocused(false)}\n          className=\"absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none\"\n        />\n        <div aria-hidden=\"true\" className=\"grid grid-cols-6 gap-1.5\">\n          {Array.from({ length: CODE_LENGTH }, (_, i) => (\n            <div\n              key={i}\n              className={`grid h-12 place-items-center rounded-md border-2 bg-white font-mono text-lg font-semibold tabular-nums transition-colors ${\n                error ? \"border-rose-500 text-rose-700\" : i === active ? \"border-slate-900 text-slate-900\" : \"border-slate-200 text-slate-900\"\n              }`}\n            >\n              {code[i] ?? \"\"}\n            </div>\n          ))}\n        </div>\n      </div>\n      {error && (\n        <p id=\"otp-resend-error\" role=\"alert\" className=\"mt-2 text-sm text-rose-700\">\n          {error}\n        </p>\n      )}\n      <button\n        type=\"submit\"\n        className=\"mt-4 h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2\"\n      >\n        Verify\n      </button>\n      <div className=\"mt-2 flex items-center justify-between gap-2 text-sm\">\n        <span role=\"status\" className=\"text-emerald-700\">\n          {status}\n        </span>\n        <button\n          type=\"button\"\n          onClick={resend}\n          disabled={seconds > 0}\n          className=\"h-10 rounded-md px-2 font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent\"\n        >\n          {seconds > 0 ? `Resend in 0:${String(seconds).padStart(2, \"0\")}` : \"Resend code\"}\n        </button>\n      </div>\n    </form>\n  );\n}\n";

const o3Html = `<form class="otpr" novalidate>
  <label for="otp-resend" class="otpr-label">Enter your code</label>
  <p id="otp-resend-help" class="otpr-help">Demo code: 246810</p>
  <div class="otpr-wrap">
    <input id="otp-resend" class="otpr-input" type="text" inputmode="numeric"
      autocomplete="one-time-code" pattern="[0-9]*" maxlength="6"
      aria-describedby="otp-resend-help">
    <div class="otpr-boxes" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
  <p id="otp-resend-error" class="otpr-error" role="alert" hidden></p>
  <button type="submit" class="otpr-submit">Verify</button>
  <div class="otpr-row">
    <span class="otpr-status" role="status"></span>
    <button type="button" class="otpr-resend" disabled>Resend in 0:30</button>
  </div>
</form>

<style>
  .otpr { max-width: 20rem; font-family: system-ui, sans-serif; color: #0f172a; }
  .otpr-label { display: block; font-size: 14px; font-weight: 600; }
  .otpr-help { margin: 4px 0 0; font-size: 14px; color: #475569; }
  .otpr-wrap { position: relative; margin-top: 12px; }
  .otpr-input { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%;
    opacity: 0; font-size: 16px; color: transparent; caret-color: transparent; border: 0; }
  .otpr-boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .otpr-boxes span { display: grid; place-items: center; height: 48px; border: 2px solid #e2e8f0;
    border-radius: 6px; background: #fff; font: 600 18px ui-monospace, monospace; }
  .otpr-boxes span.is-active { border-color: #0f172a; }
  .otpr.has-error .otpr-boxes span { border-color: #f43f5e; color: #be123c; }
  .otpr-error { margin: 8px 0 0; font-size: 14px; color: #be123c; }
  .otpr-submit { margin-top: 16px; width: 100%; height: 44px; border: 0; border-radius: 8px;
    background: #0f172a; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
  .otpr-submit:hover { background: #334155; }
  .otpr-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 14px; }
  .otpr-status { color: #047857; }
  .otpr-resend { height: 40px; padding: 0 8px; border: 0; border-radius: 6px; background: none;
    color: #4338ca; font: inherit; font-weight: 500; cursor: pointer; }
  .otpr-resend:disabled { color: #64748b; cursor: not-allowed; }
  .otpr button:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
</style>

<script>
  (() => {
    const form = document.querySelector(".otpr");
    const input = document.getElementById("otp-resend");
    const boxes = [...form.querySelectorAll(".otpr-boxes span")];
    const error = document.getElementById("otp-resend-error");
    const status = form.querySelector(".otpr-status");
    const resend = form.querySelector(".otpr-resend");
    const LENGTH = 6, DEMO_CODE = "246810", RESEND_AFTER = 30;
    let seconds = RESEND_AFTER, timer;

    function render() {
      const focused = document.activeElement === input;
      boxes.forEach((b, i) => {
        b.textContent = input.value[i] || "";
        b.classList.toggle("is-active", focused && i === Math.min(input.value.length, LENGTH - 1));
      });
    }
    function showError(msg) {
      error.textContent = msg;
      error.hidden = !msg;
      form.classList.toggle("has-error", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      input.setAttribute("aria-describedby", msg ? "otp-resend-help otp-resend-error" : "otp-resend-help");
    }
    function update(v) {
      input.value = v.replace(/\\D/g, "").slice(0, LENGTH);
      showError(""); status.textContent = ""; render();
    }
    function tick() {
      clearTimeout(timer);
      resend.disabled = seconds > 0;
      resend.textContent = seconds > 0 ? \`Resend in 0:\${String(seconds).padStart(2, "0")}\` : "Resend code";
      if (seconds > 0) timer = setTimeout(() => { seconds -= 1; tick(); }, 1000);
    }

    input.addEventListener("input", () => update(input.value));
    input.addEventListener("paste", (e) => { e.preventDefault(); update(e.clipboardData.getData("text")); });
    input.addEventListener("focus", render);
    input.addEventListener("blur", render);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value.length < LENGTH) showError(\`Enter all \${LENGTH} digits.\`);
      else if (input.value !== DEMO_CODE) showError("That code does not match. Check the newest text and try again.");
      else { status.textContent = "Code accepted. Signing you in."; return; }
      input.focus();
    });
    resend.addEventListener("click", () => {
      seconds = RESEND_AFTER; tick(); update("");
      status.textContent = "A new code is on its way.";
      input.focus();
    });
    tick(); render();
  })();
</script>
`;

const o6Demo = (() => {
const DIGITS = 6;
const VALID = "135790"; // demo only: your server decides

type Phase = "typing" | "checking" | "ok" | "wrong";

function OtpAutoSubmit() {
  const [code, setCode] = useState("1357");
  const [phase, setPhase] = useState<Phase>("typing");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Submits on its own as soon as the last digit lands.
  useEffect(() => {
    if (code.length < DIGITS) return;
    setPhase("checking");
    const id = setTimeout(() => setPhase(code === VALID ? "ok" : "wrong"), 900);
    return () => clearTimeout(id);
  }, [code]);

  function reset() {
    setCode("");
    setPhase("typing");
    inputRef.current?.focus();
  }

  const active = focused && phase === "typing" ? Math.min(code.length, DIGITS - 1) : -1;
  const line = phase === "wrong" ? "bg-rose-400" : phase === "ok" ? "bg-emerald-400" : "bg-slate-600";

  return (
    <div className="w-full max-w-xs rounded-2xl bg-slate-950 p-5 text-slate-100">
      <label htmlFor="otp-auto" className="block text-sm font-semibold">
        Two-step check
      </label>
      <p id="otp-auto-help" className="mt-1 text-sm text-slate-400">
        Code from your authenticator app. Demo: 135790
      </p>
      <div className="relative mt-5">
        <input
          ref={inputRef}
          id="otp-auto"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={DIGITS}
          value={code}
          disabled={phase === "checking" || phase === "ok"}
          aria-describedby="otp-auto-help otp-auto-status"
          onChange={(e) => {
            setPhase("typing");
            setCode(e.target.value.replace(/\D/g, "").slice(0, DIGITS));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none"
        />
        <div aria-hidden="true" className="grid grid-cols-6 gap-3">
          {Array.from({ length: DIGITS }, (_, i) => (
            <div key={i} className="flex h-12 flex-col items-center justify-end gap-2">
              <span className="font-mono text-2xl font-medium tabular-nums">{code[i] ?? ""}</span>
              <span className={`h-0.5 w-full rounded-full transition-colors ${i === active ? "bg-sky-400" : line}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex min-h-[40px] items-center justify-between gap-3">
        <p id="otp-auto-status" role="status" className="flex items-center gap-2 text-sm">
          {phase === "checking" && (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400 motion-reduce:animate-none" />
              Checking code
            </>
          )}
          {phase === "ok" && <span className="text-emerald-300">Verified. You are signed in.</span>}
          {phase === "wrong" && <span className="text-rose-300">Wrong code. Try again.</span>}
          {phase === "typing" && <span className="text-slate-400">Submits on the last digit</span>}
        </p>
        {(phase === "ok" || phase === "wrong") && (
          <button
            type="button"
            onClick={reset}
            className="h-10 shrink-0 rounded-lg bg-slate-800 px-3 text-sm font-medium text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
  return OtpAutoSubmit;
})();
const o6React = "import { useEffect, useRef, useState } from \"react\";\n\nconst DIGITS = 6;\nconst VALID = \"135790\"; // demo only: your server decides\n\ntype Phase = \"typing\" | \"checking\" | \"ok\" | \"wrong\";\n\nexport default function OtpAutoSubmit() {\n  const [code, setCode] = useState(\"1357\");\n  const [phase, setPhase] = useState<Phase>(\"typing\");\n  const [focused, setFocused] = useState(false);\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  // Submits on its own as soon as the last digit lands.\n  useEffect(() => {\n    if (code.length < DIGITS) return;\n    setPhase(\"checking\");\n    const id = setTimeout(() => setPhase(code === VALID ? \"ok\" : \"wrong\"), 900);\n    return () => clearTimeout(id);\n  }, [code]);\n\n  function reset() {\n    setCode(\"\");\n    setPhase(\"typing\");\n    inputRef.current?.focus();\n  }\n\n  const active = focused && phase === \"typing\" ? Math.min(code.length, DIGITS - 1) : -1;\n  const line = phase === \"wrong\" ? \"bg-rose-400\" : phase === \"ok\" ? \"bg-emerald-400\" : \"bg-slate-600\";\n\n  return (\n    <div className=\"w-full max-w-xs rounded-2xl bg-slate-950 p-5 text-slate-100\">\n      <label htmlFor=\"otp-auto\" className=\"block text-sm font-semibold\">\n        Two-step check\n      </label>\n      <p id=\"otp-auto-help\" className=\"mt-1 text-sm text-slate-400\">\n        Code from your authenticator app. Demo: 135790\n      </p>\n      <div className=\"relative mt-5\">\n        <input\n          ref={inputRef}\n          id=\"otp-auto\"\n          type=\"text\"\n          inputMode=\"numeric\"\n          autoComplete=\"one-time-code\"\n          maxLength={DIGITS}\n          value={code}\n          disabled={phase === \"checking\" || phase === \"ok\"}\n          aria-describedby=\"otp-auto-help otp-auto-status\"\n          onChange={(e) => {\n            setPhase(\"typing\");\n            setCode(e.target.value.replace(/\\D/g, \"\").slice(0, DIGITS));\n          }}\n          onFocus={() => setFocused(true)}\n          onBlur={() => setFocused(false)}\n          className=\"absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none\"\n        />\n        <div aria-hidden=\"true\" className=\"grid grid-cols-6 gap-3\">\n          {Array.from({ length: DIGITS }, (_, i) => (\n            <div key={i} className=\"flex h-12 flex-col items-center justify-end gap-2\">\n              <span className=\"font-mono text-2xl font-medium tabular-nums\">{code[i] ?? \"\"}</span>\n              <span className={`h-0.5 w-full rounded-full transition-colors ${i === active ? \"bg-sky-400\" : line}`} />\n            </div>\n          ))}\n        </div>\n      </div>\n      <div className=\"mt-5 flex min-h-[40px] items-center justify-between gap-3\">\n        <p id=\"otp-auto-status\" role=\"status\" className=\"flex items-center gap-2 text-sm\">\n          {phase === \"checking\" && (\n            <>\n              <span aria-hidden=\"true\" className=\"h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400 motion-reduce:animate-none\" />\n              Checking code\n            </>\n          )}\n          {phase === \"ok\" && <span className=\"text-emerald-300\">Verified. You are signed in.</span>}\n          {phase === \"wrong\" && <span className=\"text-rose-300\">Wrong code. Try again.</span>}\n          {phase === \"typing\" && <span className=\"text-slate-400\">Submits on the last digit</span>}\n        </p>\n        {(phase === \"ok\" || phase === \"wrong\") && (\n          <button\n            type=\"button\"\n            onClick={reset}\n            className=\"h-10 shrink-0 rounded-lg bg-slate-800 px-3 text-sm font-medium text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400\"\n          >\n            Start over\n          </button>\n        )}\n      </div>\n    </div>\n  );\n}\n";

const o5Demo = (() => {
const PIN_LENGTH = 4;

function OtpMaskedPin() {
  const [pin, setPin] = useState("39");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = focused ? Math.min(pin.length, PIN_LENGTH - 1) : -1;

  return (
    <div className="w-full max-w-[17rem] text-center">
      <label htmlFor="pin-masked" className="block text-sm font-semibold text-slate-900">
        Card PIN
      </label>
      <p id="pin-masked-help" className="mt-1 text-sm text-slate-600">
        Needed to unlock the card in the app.
      </p>
      <div className="relative mx-auto mt-4 w-fit">
        <input
          id="pin-masked"
          type={show ? "text" : "password"}
          inputMode="numeric"
          autoComplete="off"
          maxLength={PIN_LENGTH}
          value={pin}
          aria-describedby="pin-masked-help"
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none"
        />
        <div aria-hidden="true" className="flex gap-3">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <div
              key={i}
              className={`grid h-14 w-14 place-items-center rounded-full border-2 font-mono text-xl font-semibold text-slate-900 transition-colors ${
                i === active ? "border-amber-600" : pin[i] ? "border-slate-900" : "border-slate-300"
              }`}
            >
              {pin[i] ? show ? pin[i] : <span className="h-3 w-3 rounded-full bg-slate-900" /> : ""}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-pressed={show}
          aria-controls="pin-masked"
          onClick={() => setShow(!show)}
          className="h-10 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        >
          {show ? "Hide PIN" : "Show PIN"}
        </button>
        <a
          href="#"
          className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        >
          Forgot PIN?
        </a>
      </div>
    </div>
  );
}
  return OtpMaskedPin;
})();
const o5React = "import { useState } from \"react\";\n\nconst PIN_LENGTH = 4;\n\nexport default function OtpMaskedPin() {\n  const [pin, setPin] = useState(\"39\");\n  const [show, setShow] = useState(false);\n  const [focused, setFocused] = useState(false);\n  const active = focused ? Math.min(pin.length, PIN_LENGTH - 1) : -1;\n\n  return (\n    <div className=\"w-full max-w-[17rem] text-center\">\n      <label htmlFor=\"pin-masked\" className=\"block text-sm font-semibold text-slate-900\">\n        Card PIN\n      </label>\n      <p id=\"pin-masked-help\" className=\"mt-1 text-sm text-slate-600\">\n        Needed to unlock the card in the app.\n      </p>\n      <div className=\"relative mx-auto mt-4 w-fit\">\n        <input\n          id=\"pin-masked\"\n          type={show ? \"text\" : \"password\"}\n          inputMode=\"numeric\"\n          autoComplete=\"off\"\n          maxLength={PIN_LENGTH}\n          value={pin}\n          aria-describedby=\"pin-masked-help\"\n          onChange={(e) => setPin(e.target.value.replace(/\\D/g, \"\").slice(0, PIN_LENGTH))}\n          onFocus={() => setFocused(true)}\n          onBlur={() => setFocused(false)}\n          className=\"absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none\"\n        />\n        <div aria-hidden=\"true\" className=\"flex gap-3\">\n          {Array.from({ length: PIN_LENGTH }, (_, i) => (\n            <div\n              key={i}\n              className={`grid h-14 w-14 place-items-center rounded-full border-2 font-mono text-xl font-semibold text-slate-900 transition-colors ${\n                i === active ? \"border-amber-600\" : pin[i] ? \"border-slate-900\" : \"border-slate-300\"\n              }`}\n            >\n              {pin[i] ? show ? pin[i] : <span className=\"h-3 w-3 rounded-full bg-slate-900\" /> : \"\"}\n            </div>\n          ))}\n        </div>\n      </div>\n      <div className=\"mt-4 flex items-center justify-center gap-2\">\n        <button\n          type=\"button\"\n          aria-pressed={show}\n          aria-controls=\"pin-masked\"\n          onClick={() => setShow(!show)}\n          className=\"h-10 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600\"\n        >\n          {show ? \"Hide PIN\" : \"Show PIN\"}\n        </button>\n        <a\n          href=\"#\"\n          className=\"inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600\"\n        >\n          Forgot PIN?\n        </a>\n      </div>\n    </div>\n  );\n}\n";

const o4Demo = (() => {
const GROUP = 4;
const TOTAL = 8;

function OtpInviteCode() {
  const [value, setValue] = useState("KX7Q");
  const [focused, setFocused] = useState(false);
  const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, TOTAL);
  const active = focused ? Math.min(value.length, TOTAL - 1) : -1;

  const box = (i: number) => (
    <div
      key={i}
      className={`grid h-11 min-w-0 flex-1 place-items-center rounded-md font-mono text-base font-semibold transition-colors ${
        i === active ? "bg-white text-teal-900 ring-2 ring-teal-600" : value[i] ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-500"
      }`}
    >
      {value[i] ?? "·"}
    </div>
  );

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="invite-code" className="block text-sm font-semibold text-slate-900">
        Team invite code
      </label>
      <p id="invite-code-help" className="mt-1 text-sm text-slate-600">
        8 letters or numbers, from your invite email.
      </p>
      <div className="relative mt-3">
        <input
          id="invite-code"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={TOTAL + 1}
          value={value}
          aria-describedby="invite-code-help"
          onChange={(e) => setValue(clean(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none"
        />
        <div aria-hidden="true" className="flex items-center gap-1">
          {Array.from({ length: GROUP }, (_, i) => box(i))}
          <span className="px-0.5 text-slate-400">-</span>
          {Array.from({ length: TOTAL - GROUP }, (_, i) => box(i + GROUP))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600">
        {value.length === TOTAL ? `Ready: ${value.slice(0, GROUP)}-${value.slice(GROUP)}` : `${TOTAL - value.length} characters to go`}
      </p>
    </div>
  );
}
  return OtpInviteCode;
})();
const o4React = "import { useState } from \"react\";\n\nconst GROUP = 4;\nconst TOTAL = 8;\n\nexport default function OtpInviteCode() {\n  const [value, setValue] = useState(\"KX7Q\");\n  const [focused, setFocused] = useState(false);\n  const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, \"\").slice(0, TOTAL);\n  const active = focused ? Math.min(value.length, TOTAL - 1) : -1;\n\n  const box = (i: number) => (\n    <div\n      key={i}\n      className={`grid h-11 min-w-0 flex-1 place-items-center rounded-md font-mono text-base font-semibold transition-colors ${\n        i === active ? \"bg-white text-teal-900 ring-2 ring-teal-600\" : value[i] ? \"bg-teal-50 text-teal-900\" : \"bg-slate-100 text-slate-500\"\n      }`}\n    >\n      {value[i] ?? \"·\"}\n    </div>\n  );\n\n  return (\n    <div className=\"w-full max-w-xs\">\n      <label htmlFor=\"invite-code\" className=\"block text-sm font-semibold text-slate-900\">\n        Team invite code\n      </label>\n      <p id=\"invite-code-help\" className=\"mt-1 text-sm text-slate-600\">\n        8 letters or numbers, from your invite email.\n      </p>\n      <div className=\"relative mt-3\">\n        <input\n          id=\"invite-code\"\n          type=\"text\"\n          autoComplete=\"off\"\n          autoCapitalize=\"characters\"\n          spellCheck={false}\n          maxLength={TOTAL + 1}\n          value={value}\n          aria-describedby=\"invite-code-help\"\n          onChange={(e) => setValue(clean(e.target.value))}\n          onFocus={() => setFocused(true)}\n          onBlur={() => setFocused(false)}\n          className=\"absolute inset-0 z-10 h-full w-full cursor-text text-base text-transparent caret-transparent opacity-0 outline-none\"\n        />\n        <div aria-hidden=\"true\" className=\"flex items-center gap-1\">\n          {Array.from({ length: GROUP }, (_, i) => box(i))}\n          <span className=\"px-0.5 text-slate-400\">-</span>\n          {Array.from({ length: TOTAL - GROUP }, (_, i) => box(i + GROUP))}\n        </div>\n      </div>\n      <p className=\"mt-3 text-xs text-slate-600\">\n        {value.length === TOTAL ? `Ready: ${value.slice(0, GROUP)}-${value.slice(GROUP)}` : `${TOTAL - value.length} characters to go`}\n      </p>\n    </div>\n  );\n}\n";

const PIECES: Piece[] = [
  { id: "o1", name: "Single field, six boxes", blurb: "One invisible input laid over six drawn boxes, so autofill, paste and WebOTP behave like any text field.", group: "numeric", Demo: o1Demo, react: o1React, html: o1Html, stage: "bg-slate-50 ring-1 ring-inset ring-slate-200/70" },
  { id: "o2", name: "Six fields, split 3 and 3", blurb: "Separate boxes with auto-advance, Backspace to go back, arrow keys and paste spread.", group: "numeric", Demo: o2Demo, react: o2React, stage: "bg-slate-50 ring-1 ring-inset ring-slate-200/70" },
  { id: "o3", name: "Verify with error and resend timer", blurb: "Announced error message, a 30 second countdown and a resend button.", group: "flows", Demo: o3Demo, react: o3React, html: o3Html, stage: "bg-slate-50 ring-1 ring-inset ring-slate-200/70" },
  { id: "o6", name: "Auto-submit on the last digit", blurb: "Dark underline style that checks the code by itself and reports the result.", group: "flows", Demo: o6Demo, react: o6React, stage: "bg-slate-900" },
  { id: "o5", name: "Masked 4-digit PIN", blurb: "Dots by default, with a pressed state button to show the digits.", group: "other", Demo: o5Demo, react: o5React, stage: "bg-slate-50 ring-1 ring-inset ring-slate-200/70" },
  { id: "o4", name: "Letter and number invite code", blurb: "Eight characters in two groups, uppercased as you type, with spaces and dashes stripped.", group: "other", Demo: o4Demo, react: o4React, stage: "bg-slate-50 ring-1 ring-inset ring-slate-200/70" }
];
const GROUPS: { key: string; label: string }[] = [{"key":"numeric","label":"Numeric codes"},{"key":"flows","label":"Full flows"},{"key":"other","label":"PIN and invite codes"}];
const TEXT: { eyebrow: string; title: string; lead: string; refTitle: string; refNote: string } = {"eyebrow":"React · HTML, CSS and JS · no dependencies","title":"OTP inputs that work with SMS autofill","lead":"Six one-time code fields, from the single hidden input pattern to a full verify screen with an error and a resend timer. Each one accepts a pasted code, opens the number pad on phones and gives screen readers one clear label.","refTitle":"Attributes and APIs used here","refNote":"Checked against MDN (the autocomplete attribute, inputmode and the WebOTP API) and the HTML standard. Browser support notes describe MDN's compatibility data at the time of writing."};
const REF_HEAD: string[] = ["Attribute or API","What it does","Where it applies"];
const REF_ROWS: string[][] = [
  [
    "autocomplete=\"one-time-code\"",
    "Marks the field as a one-time code so the browser or password manager can offer a code it received, for example from a text message.",
    "Put it on the one input that receives the whole code. With split boxes, only on the first box."
  ],
  [
    "inputmode=\"numeric\"",
    "Hints that the on-screen keyboard should show digits. It does not validate anything.",
    "Numeric codes and PINs. Leave it off for letter and number invite codes."
  ],
  [
    "type=\"text\" (not number)",
    "Keeps leading zeros, avoids spin arrows and wheel changes, and allows paste of a code with spaces that you then strip.",
    "Every code field here."
  ],
  [
    "maxlength",
    "Stops typing past the code length. Paste is handled in script so a longer clipboard string is trimmed, not rejected.",
    "Single field pattern."
  ],
  [
    "pattern=\"[0-9]*\"",
    "Gives the browser a rule for constraint validation. Historically also used to get the number pad on older iOS.",
    "Optional when inputmode is present."
  ],
  [
    "navigator.credentials.get({ otp })",
    "WebOTP API. Resolves with the code from an SMS whose last line is @your-domain #code. Needs a secure context.",
    "Chromium on Android. Not available in Safari or Firefox, so treat it as an extra on top of autocomplete."
  ],
  [
    "aria-describedby + role=\"alert\"",
    "Links help and error text to the input, and announces a new error once without moving focus.",
    "Error and resend flow."
  ]
];

const COPY_ICON = "M9 9h10v10H9zM5 15V5h10";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";
const CODE_ICON = "M8 7l-5 5 5 5M16 7l5 5-5 5";

export default function OtpInputCollection() {
  const [group, setGroup] = useState("all");
  const [langs, setLangs] = useState<Record<string, Lang>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const shown = group === "all" ? PIECES : PIECES.filter((p) => p.group === group);
  const langOf = (p: Piece): Lang => (p.html ? langs[p.id] ?? "react" : "react");
  const codeOf = (p: Piece) => (langOf(p) === "html" && p.html ? p.html : p.react);
  const langName = (l: Lang) => (l === "html" ? "HTML, CSS and JS" : "React and Tailwind");

  async function copy(p: Piece) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(codeOf(p));
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(p.id);
    setCopied(ok ? p.id : null);
    setAnnounce(ok ? `${p.name}: ${langName(langOf(p))} copied` : "Copy was blocked, so the code is shown under the demo for you to select");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors ${ring}`;

  return (
    <section
      className="bg-[#f6f7f9] px-4 py-12 sm:px-8 sm:py-14"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">{TEXT.eyebrow}</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-stone-950 sm:text-[42px]">{TEXT.title}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">{TEXT.lead}</p>
        </header>

        <div role="group" aria-label="Filter the collection" className="mt-8 flex flex-wrap gap-1.5 border-y border-stone-300/70 py-4">
          {[{ key: "all", label: "All" }, ...GROUPS, { key: "ref", label: "Reference table" }].map((g) => {
            const on = group === g.key;
            const n = g.key === "ref" ? REF_ROWS.length : g.key === "all" ? PIECES.length : PIECES.filter((p) => p.group === g.key).length;
            return (
              <button
                key={g.key}
                type="button"
                aria-pressed={on}
                onClick={() => setGroup(g.key)}
                className={`${chip} ${on ? "bg-indigo-700 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
              >
                {g.label}
                <span className={`font-mono text-[11px] ${on ? "opacity-75" : "text-stone-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {group !== "ref" && (
        <ul className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const isOpen = open === p.id;
            const l = langOf(p);
            return (
              <li
                key={p.id}
                className={`flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] ${isOpen ? "md:col-span-2 lg:col-span-3" : ""}`}
              >
                <div className="px-4 pt-4">
                  <h3 className="text-[14px] font-semibold text-stone-950">{p.name}</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{p.blurb}</p>
                </div>
                <div className={`relative mx-3 mt-3 flex min-w-0 items-start justify-center rounded-xl px-3 py-6 sm:px-5 ${p.stage}`}>
                  <p.Demo />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                  {p.html && (
                    <div role="group" aria-label={`Code version for ${p.name}`} className="inline-flex rounded-lg bg-stone-100 p-0.5">
                      {(["react", "html"] as Lang[]).map((x) => (
                        <button
                          key={x}
                          type="button"
                          aria-pressed={l === x}
                          onClick={() => setLangs({ ...langs, [p.id]: x })}
                          className={`h-9 rounded-md px-2.5 text-[12px] font-semibold ${ring} ${l === x ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                        >
                          {x === "react" ? "React" : "HTML"}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="flex-1" />
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`code-${p.id}`}
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-stone-700 hover:bg-stone-100 ${ring}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d={CODE_ICON} />
                    </svg>
                    {isOpen ? "Hide code" : "Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(p)}
                    aria-label={`Copy ${langName(l)} for ${p.name}`}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring} ${copied === p.id ? "bg-emerald-700 text-white" : "bg-stone-900 text-white hover:bg-stone-700"}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d={copied === p.id ? CHECK_ICON : COPY_ICON} />
                    </svg>
                    {copied === p.id ? "Copied" : "Copy"}
                  </button>
                </div>
                {isOpen && (
                  <pre
                    id={`code-${p.id}`}
                    tabIndex={0}
                    aria-label={`${langName(l)} for ${p.name}`}
                    className="max-h-[440px] overflow-auto rounded-b-2xl border-t border-stone-800 bg-[#121316] p-4 font-mono text-[12px] leading-[1.65] text-stone-200"
                  >
                    <code>{codeOf(p)}</code>
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
        )}

        {group === "ref" && (
        <div className="mt-6">
          <h3 className="text-[17px] font-semibold tracking-tight text-stone-950">{TEXT.refTitle}</h3>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-stone-600">{TEXT.refNote}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white" tabIndex={0} role="region" aria-label={TEXT.refTitle}>
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead className="bg-stone-50 text-stone-700">
                <tr>
                  {REF_HEAD.map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REF_ROWS.map((r, i) => (
                  <tr key={i} className="border-t border-stone-200 align-top">
                    {r.map((c, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] font-medium text-stone-900">
                          {c}
                        </th>
                      ) : (
                        <td key={j} className="px-4 py-2.5 leading-relaxed text-stone-700">
                          {c}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
