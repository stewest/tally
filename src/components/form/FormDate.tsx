import { UseFormRegister } from "react-hook-form";

export default function FormDate({
  id,
  label,
  name,
  placeholder,
  colSpan = "col-span-6",
  register,
  error,
  defaultValue,
  ...rest
}: {
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  colSpan?: string;
  register?: UseFormRegister<any>;
  error?: string;
  defaultValue?: Date | string;
  [key: string]: any;
}) {
  // Convert Date object to YYYY-MM-DD string for HTML date input display
  const getDisplayValue = (value: Date | string | undefined): string => {
    if (!value) return "";

    if (value instanceof Date) {
      // Convert Date to YYYY-MM-DD format using UTC to avoid timezone issues
      return value.toISOString().split("T")[0];
    }

    if (typeof value === "string") {
      return value;
    }

    return "";
  };

  return (
    <div className={`w-full text-sm ${colSpan}`}>
      <label htmlFor={id} className="block text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className={`w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none ${
          error ? "border-red-500" : ""
        }`}
        placeholder={placeholder}
        defaultValue={getDisplayValue(defaultValue)}
        {...(register
          ? register(name as string, {
              setValueAs: (value: string | Date) => {
                if (!value) return undefined;

                // If it's already a Date object, convert to UTC date string
                if (value instanceof Date) {
                  return value.toISOString().split("T")[0];
                }

                // If it's not a string, return undefined
                if (typeof value !== "string") return undefined;

                // Create a UTC date from the input string to avoid timezone conversion
                // The input string is in YYYY-MM-DD format, so we create a UTC date
                try {
                  const [year, month, day] = value.split("-").map(Number);
                  const utcDate = new Date(Date.UTC(year, month - 1, day));
                  return utcDate.toISOString().split("T")[0];
                } catch (error) {
                  console.error("Error parsing date:", error);
                  return undefined;
                }
              },
            })
          : { name })}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
