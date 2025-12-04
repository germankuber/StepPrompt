import React, { useRef, useEffect } from 'react';

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 6,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight div
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (textarea && highlight) {
      const handleScroll = () => {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      };
      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Highlight {{UserMessage}} pattern
  const highlightText = (text: string) => {
    if (!text) return '';
    
    // Escape HTML and highlight {{UserMessage}}
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    // Replace {{UserMessage}} with highlighted version
    // Using inline styles with !important to ensure visibility
    const highlighted = escaped.replace(
      /\{\{UserMessage\}\}/g,
      '<span style="background-color: #fef08a !important; color: #854d0e !important; font-weight: 600 !important; padding: 1px 3px !important; border-radius: 3px !important; display: inline-block;">{{UserMessage}}</span>'
    );
    
    return highlighted;
  };

  return (
    <div className="relative w-full">
      {/* Highlighted background */}
      <div
        ref={highlightRef}
        className={`absolute inset-0 p-2 border border-transparent rounded-md font-mono text-xs whitespace-pre-wrap break-words overflow-auto pointer-events-none ${className}`}
        style={{
          color: '#111827', // gray-900 - same as textarea text
          zIndex: 1,
          caretColor: 'transparent',
        }}
        dangerouslySetInnerHTML={{ __html: highlightText(value) }}
      />
      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`relative w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs bg-transparent ${className}`}
        style={{ 
          zIndex: 2,
          caretColor: '#3b82f6', // blue-500 - cursor will be visible
          color: 'transparent', // Make textarea text transparent so we see the highlight div
        }}
      />
    </div>
  );
};

