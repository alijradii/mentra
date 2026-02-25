interface ProgressBarProps {
  value: number;
  size?: "sm" | "md" | "lg";
}

const heightMap = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
};

export function ProgressBar({ value, size = "lg" }: ProgressBarProps) {
  const h = heightMap[size];
  return (
    <div className={`w-full bg-muted rounded-full ${h} overflow-hidden`}>
      <div
        className={`${h} rounded-full bg-primary transition-all`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
