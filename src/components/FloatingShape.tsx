interface FloatingShapeProps {
  color: "purple" | "pink" | "yellow";
  size: number;
  top: string;
  left: string;
  delay?: number;
  rotation?: boolean;
}

const FloatingShape = ({ color, size, top, left, delay = 0, rotation = false }: FloatingShapeProps) => {
  const colorClasses = {
    purple: "bg-battle-purple shadow-glow",
    pink: "bg-battle-pink shadow-glow-pink",
    yellow: "bg-battle-accent shadow-glow-accent",
  };

  return (
    <div
      className={`absolute ${colorClasses[color]} rounded-lg ${rotation ? 'animate-rotate' : 'animate-float'} opacity-20`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top,
        left,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

export default FloatingShape;