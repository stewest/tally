import { UseFormRegister } from "react-hook-form";

export default function Select({
  id,
  label,
  name,
  defaultValue,
  options = [],
  colSpan = "col-span-6",
  register,
  error,
  required = false,
  value,
  sort = true,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  options?: Array<{ value: string; label: string }>;
  colSpan?: string;
  register?: UseFormRegister<any>;
  error?: string;
  required?: boolean;
  value?: string;
  sort?: boolean;
}) {
  // Determine if this should be controlled or uncontrolled
  const isControlled = value !== undefined;

  // Sort options alphabetically by label
  const sortedOptions = sort
    ? [...options].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      )
    : options;

  return (
    <div className={`w-full mb-4 text-sm ${colSpan}`}>
      <label htmlFor={id} className="block text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        className={`w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none ${
          error ? "border-red-500" : ""
        }`}
        {...(isControlled ? { value } : {})}
        {...(register ? register(name as string) : { name })}
      >
        {!required && <option value="">{defaultValue}</option>}
        {sortedOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
