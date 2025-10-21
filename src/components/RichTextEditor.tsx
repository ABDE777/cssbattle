import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className = "",
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  return (
    <div className={`border border-input rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("underline")}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyLeft")}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyCenter")}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyRight")}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[120px] p-3 focus:outline-none"
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
