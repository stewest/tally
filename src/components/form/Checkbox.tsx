import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Checkbox as UICheckbox } from "../ui/Checkbox";

export default function Checkbox<T extends FieldValues = FieldValues>({
  id,
  label,
  name,
  colSpan = "col-span-6",
  control,
  error,
  ...rest
}: {
  id: string;
  label: string;
  name: Path<T>;
  colSpan?: string;
  control?: Control<T>;
  error?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={`w-full mb-4 text-sm ${colSpan}`}>
      <div className="flex items-center space-x-2">
        {control ? (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <UICheckbox
                id={id}
                checked={!!field.value}
                onCheckedChange={checked => {
                  field.onChange(checked);
                }}
                {...rest}
              />
            )}
          />
        ) : (
          <UICheckbox id={id} {...rest} />
        )}
        <label
          htmlFor={id}
          className="text-gray-700 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
