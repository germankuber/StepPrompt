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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Update highlight div size when textarea is resized
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    
    if (!textarea || !highlight) return;

    const updateSize = () => {
      const rect = textarea.getBoundingClientRect();
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
    };

    // Initial size
    updateSize();

    // Watch for resize (handles both user resize and content changes)
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(textarea);

    // Also update on value change to handle content-driven size changes
    const timeoutId = setTimeout(updateSize, 0);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [value]);

  // Highlight {{UserMessage}} pattern
  const highlightText = (text: string) => {
    if (!text) return '';
    
    // Escape HTML and highlight {{UserMessage}}
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    // Replace {{UserMessage}} with highlighted version (Yellow)
    let highlighted = escaped.replace(
      /\{\{UserMessage\}\}/g,
      '<span style="background-color: #fef08a !important; color: #854d0e !important; font-weight: 600 !important; padding: 1px 3px !important; border-radius: 3px !important; display: inline-block;">{{UserMessage}}</span>'
    );
    
    // Replace {{CharacterMessage}} with highlighted version (Green)
    highlighted = highlighted.replace(
      /\{\{CharacterMessage\}\}/g,
      '<span style="background-color: #bbf7d0 !important; color: #166534 !important; font-weight: 600 !important; padding: 1px 3px !important; border-radius: 3px !important; display: inline-block;">{{CharacterMessage}}</span>'
    );
    
    return highlighted;
  };

  // Remove height classes from className to avoid conflicts with resize
  // Extract h-24 or similar and use as minHeight instead
  const heightMatch = className.match(/\b(h-|min-h-|max-h-)(\d+)\b/);
  const baseClassName = className.replace(/\b(h-|min-h-|max-h-)\d+\b/g, '').trim();
  const minHeight = heightMatch ? `${parseInt(heightMatch[2]) * 0.25}rem` : '96px'; // Convert Tailwind h-X to rem

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Highlighted background */}
      <div
        ref={highlightRef}
        className={`absolute p-2 border border-transparent rounded-md font-mono text-xs whitespace-pre-wrap break-words overflow-auto pointer-events-none ${baseClassName}`}
        style={{
          color: '#111827', // gray-900 - same as textarea text
          zIndex: 1,
          caretColor: 'transparent',
          top: 0,
          left: 0,
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
        className={`relative w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs bg-transparent resize-y ${baseClassName}`}
        style={{ 
          zIndex: 2,
          caretColor: '#3b82f6', // blue-500 - cursor will be visible
          color: 'transparent', // Make textarea text transparent so we see the highlight div
          minHeight: minHeight, // Use extracted height or default
        }}
      />
    </div>
  );
};

