import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
}

const WYSIWYGRichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Start typing...",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isLoaded) {
      editorRef.current.innerHTML = value || "";
      setIsLoaded(true);
    }
  }, [value, isLoaded]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Format text functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Insert list
  const insertList = () => {
    formatText("insertUnorderedList");
  };

  // Insert ordered list
  const insertOrderedList = () => {
    formatText("insertOrderedList");
  };

  // Handle paste to preserve some formatting but clean up messy HTML
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste =
      e.clipboardData.getData("text/html") ||
      e.clipboardData.getData("text/plain");

    // Clean up the pasted content
    const cleanHtml = paste
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gi, "") // Remove styles
      .replace(/style="[^"]*"/gi, "") // Remove inline styles
      .replace(/class="[^"]*"/gi, "") // Remove classes
      .replace(/<span[^>]*>/gi, "") // Remove span tags
      .replace(/<\/span>/gi, ""); // Remove closing span tags

    document.execCommand("insertHTML", false, cleanHtml);
    handleInput();
  };

  // Handle key combinations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          formatText("bold");
          break;
        case "i":
          e.preventDefault();
          formatText("italic");
          break;
        case "u":
          e.preventDefault();
          formatText("underline");
          break;
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Editor Container */}
      <div className="border border-gray-300 rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        {/* Toolbar */}
        <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50">
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => formatText("bold")}
            className="inline-flex items-center px-2 py-1 rounded text-sm font-bold bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => formatText("italic")}
            className="inline-flex items-center px-2 py-1 rounded text-sm italic bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => formatText("underline")}
            className="inline-flex items-center px-2 py-1 rounded text-sm underline bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Underline (Ctrl+U)"
          >
            U
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Lists */}
          <button
            type="button"
            onClick={insertList}
            className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={insertOrderedList}
            className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Numbered List"
          >
            1.
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Alignment */}
          <button
            type="button"
            onClick={() => formatText("justifyLeft")}
            className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => formatText("justifyCenter")}
            className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => formatText("justifyRight")}
            className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Headings */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                formatText("formatBlock", e.target.value);
                e.target.value = ""; // Reset select
              }
            }}
            className="px-2 py-1 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue=""
          >
            <option value="">Format</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="p">Paragraph</option>
          </select>
        </div>

        {/* Editor Area - WYSIWYG */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className="w-full p-4 min-h-[200px] focus:outline-none prose prose-sm max-w-none"
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            lineHeight: "1.6",
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />

        {/* Helper text */}
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span>Format text as you type</span>
            <span>•</span>
            <span>
              Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
            </span>
            <span>•</span>
            <span>Use toolbar for lists and headings</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
          display: block;
        }

        [contenteditable] {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        [contenteditable] h1 {
          font-size: 1.75em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
          line-height: 1.2;
          color: #1f2937;
        }

        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.8em 0 0.4em 0;
          line-height: 1.3;
          color: #1f2937;
        }

        [contenteditable] h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.6em 0 0.3em 0;
          line-height: 1.4;
          color: #1f2937;
        }

        [contenteditable] p {
          margin: 0.75em 0;
          line-height: 1.6;
        }

        [contenteditable] ul {
          margin: 0.75em 0;
          padding-left: 1.5em;
          list-style-type: disc;
        }

        [contenteditable] ol {
          margin: 0.75em 0;
          padding-left: 1.5em;
          list-style-type: decimal;
        }

        [contenteditable] li {
          margin: 0.25em 0;
          line-height: 1.6;
        }

        [contenteditable] ul ul {
          list-style-type: circle;
          margin: 0.25em 0;
        }

        [contenteditable] ul ul ul {
          list-style-type: square;
        }

        [contenteditable] strong {
          font-weight: 700;
        }

        [contenteditable] em {
          font-style: italic;
        }

        [contenteditable] u {
          text-decoration: underline;
        }

        [contenteditable] br {
          line-height: 1.6;
        }

        /* Ensure proper spacing between different elements */
        [contenteditable] > *:first-child {
          margin-top: 0;
        }

        [contenteditable] > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default WYSIWYGRichTextEditor;
