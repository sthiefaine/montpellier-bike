interface ChartHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export default function ChartHeader({ title, description, className = "" }: ChartHeaderProps) {
  if (!title && !description) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
} 