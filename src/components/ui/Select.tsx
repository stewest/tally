interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "w-full py-2 px-4 border border-gray-300 rounded-md",
}: SelectProps) {
  // Check if options are objects or strings
  const isObjectOptions = options.length > 0 && typeof options[0] === "object";

  // Sort options alphabetically
  const sortedOptions = [...options].sort((a, b) => {
    const aLabel = isObjectOptions ? (a as SelectOption).label : (a as string);
    const bLabel = isObjectOptions ? (b as SelectOption).label : (b as string);
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
  });

  return (
    <select
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {sortedOptions.map(option => {
        if (isObjectOptions) {
          const opt = option as SelectOption;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        }
        const opt = option as string;
        return (
          <option key={opt} value={opt}>
            {opt}
          </option>
        );
      })}
    </select>
  );
}
