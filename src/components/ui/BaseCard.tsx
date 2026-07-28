interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseCard({ children, className = "" }: BaseCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm text-left p-6 ${className}`}
    >
      {children}
    </div>
  );
}
