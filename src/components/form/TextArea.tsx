import { UseFormRegister } from "react-hook-form";

export default function Textarea({
  id,
  label,
  name,
  placeholder,
  colSpan = "col-span-6",
  register,
  error,
}: {
  id: string;
  label: string;
  name: string;
  placeholder: string;
  colSpan?: string;
  register?: UseFormRegister<any>;
  error?: string;
}) {
  return (
    <div className={`mb-4 text-sm ${colSpan}`}>
      <label htmlFor={id} className="block text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={id}
        className={`w-full px-3 py-2 border rounded h-40 focus:outline-none ${
          error ? "border-red-500" : ""
        }`}
        placeholder={placeholder}
        {...(register ? register(name as string) : { name })}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
