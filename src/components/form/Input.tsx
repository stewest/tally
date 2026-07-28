import type { UseFormRegister, FieldValues, Path } from "react-hook-form";

interface InputProps<T extends FieldValues> {
  id: string;
  label: string;
  name: Path<T>;
  inputType: string;
  placeholder: string;
  className?: string;
  register?: UseFormRegister<T>;
  error?: string;
  customProps?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function Input<T extends FieldValues>({
  id,
  label,
  name,
  inputType,
  placeholder,
  className,
  register,
  error,
  customProps,
  ...rest
}: InputProps<T>) {
  return (
    <div className={`w-full mb-4 ${className || ""}`}>
      <label
        htmlFor={id}
        className="block text-left text-gray-700 text-sm font-medium mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={inputType}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-black ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        }`}
        placeholder={placeholder}
        {...(register ? register(name) : { name })}
        {...rest}
        {...(customProps || {})}
      />
      {error && <p className="text-left text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
