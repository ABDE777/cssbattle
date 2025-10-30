import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animated?: boolean;
}

const SkeletonLoader = ({
  className,
  width,
  height,
  borderRadius = "rounded",
  animated = true,
}: SkeletonLoaderProps) => {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        borderRadius,
        animated ? "animate-pulse" : "",
        className
      )}
      style={{ width, height }}
    />
  );
};

export default SkeletonLoader;
