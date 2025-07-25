import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, Eye, Edit3, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
}

const ImprovedRichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Start typing..."
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isLoaded) {
      editorRef.current.innerHTML = value || '';
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
    formatText('insertUnorderedList');
  };

  // Handle paste to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  // Prevent default behavior for Enter key in contentEditable
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Allow normal paragraph creation
      formatText('formatBlock', 'p');
    }
  };

  // Create markup for preview
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <div className="space-y-2">
      {/* Header with label and mode toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'edit'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="border border-gray-300 rounded-md bg-white shadow-sm">
        {viewMode === 'edit' ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="inline-flex items-center px-2 py-1 rounded text-sm font-bold bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="inline-flex items-center px-2 py-1 rounded text-sm italic bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              <button
                type="button"
                onClick={insertList}
                className="inline-flex items-center px-2 py-1 rounded text-sm bg-white border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              <select
                onChange={(e) => formatText('formatBlock', e.target.value)}
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

            {/* Editor Area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className="w-full p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
              data-placeholder={placeholder}
            />

            {/* Helper text */}
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <span>Use toolbar buttons for formatting</span>
                <span>•</span>
                <span>Ctrl+B for bold, Ctrl+I for italic</span>
                <span>•</span>
                <span>Enter for new paragraph</span>
              </div>
            </div>
          </>
        ) : (
          /* Preview Mode */
          <div className="p-4 min-h-[200px] bg-gray-50">
            {value ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={createMarkup(value)}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#374151'
                }}
              />
            ) : (
              <div className="text-gray-500 italic text-sm">
                {placeholder}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.3em;
          font-weight: bold;
          margin: 0.4em 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin: 0.3em 0;
        }
        
        [contenteditable] p {
          margin: 0.5em 0;
        }
        
        [contenteditable] ul {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        
        [contenteditable] li {
          margin: 0.2em 0;
        }
        
        [contenteditable] strong {
          font-weight: bold;
        }
        
        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};


export default ImprovedRichTextEditor;