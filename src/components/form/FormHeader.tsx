import { ReactNode } from "react";

export default function FormHeader({
  title,
  children,
  headerRight,
}: {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-md p-6">
      <div className="flex justify-between items-center">
        <h1 className="font-medium mb-4 text-lg">{title}</h1>
        {headerRight}
      </div>
      <div className="grid grid-cols-12 gap-4">{children}</div>
    </div>
  );
}
