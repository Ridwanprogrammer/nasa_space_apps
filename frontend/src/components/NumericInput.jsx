import { useEffect, useRef, useState } from 'react';

function formatValue(next, digits) {
  return digits > 0 ? Number(next).toFixed(digits) : String(next);
}

/**
 * Text-backed numeric input. Keeps the user's raw keystrokes visible (so typing
 * "-" or "12." does not jump to zero) while committing every parseable value.
 */
export default function NumericInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  digits = 0,
  hint,
  invalid = false,
  disabled = false,
  inputMode = 'decimal'
}) {
  const [text, setText] = useState(() => formatValue(value, digits));
  const focused = useRef(false);
  const hintId = hint ? `${id}-hint` : undefined;

  useEffect(() => {
    if (!focused.current) setText(formatValue(value, digits));
  }, [value, digits]);

  const handleChange = (event) => {
    const next = event.target.value.trim();
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      setText(next);
      return;
    }
    if (!/^-?\d*\.?\d*$/.test(next)) return;
    setText(next);
    const parsed = digits > 0 ? Number(next) : Number.parseInt(next, 10);
    if (Number.isFinite(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    focused.current = false;
    const parsed = Number(text);
    if (text.trim() === '' || !Number.isFinite(parsed)) {
      setText(formatValue(value, digits));
      return;
    }
    setText(formatValue(parsed, digits));
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        value={text}
        min={min}
        max={max}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className={`numeric h-10 w-full rounded-lg border bg-base px-2.5 font-mono text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/70 focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid ? 'border-danger/70' : 'border-line'
        }`}
      />
      {hint && (
        <p id={hintId} className={`mt-1 text-[10px] ${invalid ? 'text-danger' : 'text-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
