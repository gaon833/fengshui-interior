"use client";

import { useId, type ChangeEvent, type ReactNode } from "react";

type Props = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  help?: ReactNode;
  className?: string;
};

export default function AdminFilePicker({
  accept = "image/*",
  multiple = false,
  disabled = false,
  onChange,
  label = "파일 선택",
  help,
  className = "",
}: Props) {
  const id = useId();
  return (
    <label className={`admin-file-picker ${disabled ? "is-disabled" : ""} ${className}`.trim()} htmlFor={id}>
      <span className="admin-file-picker-icon" aria-hidden="true">↥</span>
      <strong>{label}</strong>
      {help ? <small>{help}</small> : null}
      <input id={id} type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={onChange} />
    </label>
  );
}
