interface CodeBlockProps {
  lines: string[];
  className?: string;
}

const CodeBlock = ({ lines, className = "" }: CodeBlockProps) => {
  return (
    <div className={`font-mono text-sm md:text-base bg-card/50 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-primary/30 ${className}`}>
      {lines.map((line, index) => (
        <div key={index} className="flex gap-4">
          <span className="text-muted-foreground select-none">{(index + 1).toString().padStart(2, '0')}</span>
          <span className="text-foreground/80">{line}</span>
        </div>
      ))}
    </div>
  );
};

export default CodeBlock;
