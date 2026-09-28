import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import 'react-quill-new/dist/quill.snow.css';
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
// ============================================================================
// Type Definitions
// ============================================================================

interface RichTextEditorProps {
  /**
   * Initial content value for the editor
   * @default ""
   */
  value: string;

  /**
   * Callback fired when editor content changes
   * @param content The new editor content as HTML string
   */
  onChange: (content: string) => void;

  /**
   * Placeholder text when editor is empty
   * @default "Start typing..."
   */
  placeholder?: string;

  /**
   * Toolbar configuration - can be preset or custom
   * @default "full"
   */
  toolbarPreset?: 'minimal' | 'standard' | 'orderly' | 'full' | 'custom';

  /**
   * Custom toolbar configuration when toolbarPreset is "custom"
   */
  customToolbarConfig?: ToolbarConfig[];

  /**
   * Whether the editor is in read-only mode
   * @default false
   */
  readOnly?: boolean;

  /**
   * Theme for the editor
   * @default "snow"
   */
  theme?: 'snow' | 'bubble';

  /**
   * Height of the editor in pixels or string (e.g., "300px", "50vh")
   * @default "300px"
   */
  height?: string | number;

  /**
   * Max height of the editor when using auto-expand
   * @default "600px"
   */
  maxHeight?: string | number;

  /**
   * Minimum height of the editor
   * @default "200px"
   */
  minHeight?: string | number;

  /**
   * Whether to auto-expand editor as user types
   * @default false
   */
  autoExpand?: boolean;

  /**
   * Maximum character limit (null for unlimited)
   * @default null
   */
  maxLength?: number | null;

  /**
   * Enable spell check
   * @default true
   */
  spellCheck?: boolean;

  /**
   * Enable auto-save functionality
   * @default false
   */
  enableAutoSave?: boolean;

  /**
   * Auto-save interval in milliseconds
   * @default 5000
   */
  autoSaveInterval?: number;

  /**
   * Callback for auto-save
   */
  onAutoSave?: (content: string) => void;

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Custom CSS styles for the container
   */
  containerStyle?: React.CSSProperties;

  /**
   * Allowed formats in the editor
   */
  formats?: string[];

  /**
   * Enable character count display
   * @default true
   */
  showCharacterCount?: boolean;

  /**
   * Enable word count display
   * @default false
   */
  showWordCount?: boolean;

  /**
   * Debounce delay for onChange callback in ms
   * @default 0
   */
  debounceDelay?: number;

  /**
   * Custom modules for Quill
   */
  modules?: Record<string, any>;

  /**
   * Callback when editor gets focus
   */
  onFocus?: () => void;

  /**
   * Callback when editor loses focus
   */
  onBlur?: () => void;

  /**
   * Callback when editor is ready
   */
  onReady?: (editor: any) => void;

  /**
   * Enable paste cleanup (remove formatting from pasted content)
   * @default true
   */
  enablePasteCleanup?: boolean;

  /**
   * Enable markdown shortcuts
   * @default false
   */
  enableMarkdownShortcuts?: boolean;
}

interface ToolbarConfig {
  format: string;
  label?: string;
  icon?: string;
  tooltip?: string;
}

interface EditorStats {
  characters: number;
  words: number;
  paragraphs: number;
}

// ============================================================================
// Toolbar Presets
// ============================================================================

const TOOLBAR_PRESETS = {
  minimal: [
    ['bold', 'italic', 'underline'],
    ['link'],
  ],
  standard: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
  orderly: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
  full: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ script: 'sub' }, { script: 'super' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['clean'],
  ],
};

const DEFAULT_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'indent',
  'link',
  'image',
  'video',
  'code-block',
  'color',
  'background',
  'align',
  'script',
  'font',
  'size',
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate editor statistics (characters, words, paragraphs)
 */
const calculateStats = (html: string): EditorStats => {
  // Remove HTML tags and entities, replacing them with spaces to prevent word merging
  const safeHtml = html ?? '';   
  const text = safeHtml.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();

  // Remove multiple spaces
  const cleanText = text.replace(/\s+/g, ' ');

  const characters = cleanText.length;
  const words = cleanText.length > 0 ? cleanText.split(/\s+/).length : 0;
  const paragraphs = safeHtml.split(/<p>|<div>|<br\s*\/?>/gi).filter((p) => p.trim()).length;

  return { characters, words, paragraphs };
};

/**
 * Debounce function for onChange callback
 */
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Strip HTML tags and get plain text
 */
const getPlainText = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

/**
 * Clean pasted content by removing unwanted formatting
 */
const cleanPastedContent = (html: string): string => {
  // Remove style attributes but keep basic formatting
  let cleaned = html.replace(/\s*style="[^"]*"/g, '');
  // Remove class attributes
  cleaned = cleaned.replace(/\s*class="[^"]*"/g, '');
  // Remove script tags and content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers
  cleaned = cleaned.replace(/\s*on\w+="[^"]*"/g, '');
  return cleaned;
};

// ============================================================================
// RichTextEditor Component
// ============================================================================

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  toolbarPreset = 'full',
  customToolbarConfig,
  readOnly = false,
  theme = 'snow',
  height = '300px',
  maxHeight = '600px',
  minHeight = '200px',
  autoExpand = false,
  maxLength = null,
  spellCheck = true,
  enableAutoSave = false,
  autoSaveInterval = 5000,
  onAutoSave,
  className,
  containerStyle,
  formats = DEFAULT_FORMATS,
  showCharacterCount = true,
  showWordCount = false,
  debounceDelay = 0,
  modules: customModules,
  onFocus,
  onBlur,
  onReady,
  enablePasteCleanup = true,
  enableMarkdownShortcuts = false,
}) => {
  // ========================================================================
  // Refs
  // ========================================================================

  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const debounceCallbackRef = useRef<((content: string) => void) | undefined>(undefined);

  // ========================================================================
  // State
  // ========================================================================

  const [editorValue, setEditorValue] = useState<string>(value ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [stats, setStats] = useState<EditorStats>({ characters: 0, words: 0, paragraphs: 0 });

  const [hasExceededLimit, setHasExceededLimit] = useState(false);

  // ========================================================================
  // ========================================================================
  // Memoized Toolbar Configuration
  // ========================================================================

  const toolbarConfig = useMemo(() => {
    if (toolbarPreset === 'custom' && customToolbarConfig) {
      return customToolbarConfig;
    }
    return TOOLBAR_PRESETS[toolbarPreset as keyof typeof TOOLBAR_PRESETS] || TOOLBAR_PRESETS.full;
  }, [toolbarPreset, customToolbarConfig]);

  // ========================================================================
  // Memoized Modules Configuration
  // ========================================================================

  const modules = useMemo(
    () => ({
      toolbar: toolbarConfig,
    }),
    [toolbarConfig]
  );
  // ========================================================================



  // ========================================================================
  // Initialize debounced onChange callback
  // ========================================================================

  useEffect(() => {
    if (debounceDelay > 0) {
      debounceCallbackRef.current = debounce((content: string) => {
        onChange(content);
      }, debounceDelay);
    } else {
      debounceCallbackRef.current = onChange;
    }
  }, [debounceDelay, onChange]);

  // ========================================================================
  // Synchronize external value prop with internal state
  // ========================================================================

  useEffect(() => {
    const safeValue = value ?? ''; // Ensure we never pass undefined
    if (safeValue !== editorValue && !isFocused) {
      setEditorValue(safeValue);
    }
  }, [value, isFocused, editorValue]);

  // ========================================================================
  // Calculate and update editor statistics
  // ========================================================================

  useEffect(() => {
    const newStats = calculateStats(editorValue);
    setStats(newStats);

    // Check max length
    if (maxLength && newStats.characters > maxLength) {
      setHasExceededLimit(true);
    } else {
      setHasExceededLimit(false);
    }
  }, [editorValue, maxLength]);

  // ========================================================================
  // Auto-save functionality
  // ========================================================================

  useEffect(() => {
    if (!enableAutoSave || !onAutoSave) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(editorValue);
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorValue, enableAutoSave, autoSaveInterval, onAutoSave]);

  // ========================================================================
  // Initialize editor when Quill is ready
  // ========================================================================

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      onReady?.(quill);

      // Set up paste event listener for cleanup
      if (enablePasteCleanup) {
        quill.root.addEventListener('paste', (e: ClipboardEvent) => {
          e.preventDefault();
          const html = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text/plain') || '';
          const cleaned = cleanPastedContent(html);
          quill.clipboard.dangerouslyPasteHTML(cleaned);
        });
      }

      // Set up markdown shortcuts
      if (enableMarkdownShortcuts) {
        setupMarkdownShortcuts(quill);
      }
    }
  }, [enablePasteCleanup, enableMarkdownShortcuts, onReady]);

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleChange = useCallback(
    (content: string) => {
      // Check character limit
      if (maxLength && stats.characters >= maxLength) {
        const plainText = getPlainText(content);
        if (plainText.length > maxLength) {
          // Revert to previous value
          setEditorValue(editorValue);
          return;
        }
      }

      setEditorValue(content);
      debounceCallbackRef.current?.(content);
    },
    [editorValue, maxLength, stats.characters]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // ========================================================================
  // Markdown Shortcuts Setup
  // ========================================================================

  const setupMarkdownShortcuts = (quill: any) => {
    quill.root.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        // Ctrl+Enter for something
        e.preventDefault();
      }
    });
  };

  // ========================================================================
  // Public Methods (via ref)
  // ========================================================================

  useEffect(() => {
    if (quillRef.current) {
      (quillRef.current as any).clear = () => {
        quillRef.current?.getEditor().setContents([]);
        setEditorValue('');
      };

      (quillRef.current as any).getContent = () => editorValue;

      (quillRef.current as any).getPlainText = () => getPlainText(editorValue);

      (quillRef.current as any).getStats = () => stats;

      (quillRef.current as any).insertText = (text: string, index = 0) => {
        quillRef.current?.getEditor().insertText(index, text);
      };

      (quillRef.current as any).setContent = (html: string) => {
        quillRef.current?.getEditor().setContents(quillRef.current.getEditor().clipboard.convert(html));
      };
    }
  }, [editorValue, stats]);

  // ========================================================================
  // Styles
  // ========================================================================

  const containerClasses = `rich-text-editor-container ${className || ''} ${isFocused ? 'focused' : ''} ${
    hasExceededLimit ? 'limit-exceeded' : ''
  }`.trim();

  const editorContainerStyle: React.CSSProperties = {
    height: autoExpand ? 'auto' : height,
    maxHeight: autoExpand ? maxHeight : 'none',
    minHeight: minHeight,
    ...containerStyle,
  };

  const editorWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: minHeight,
    border: isFocused ? '1px solid #80Deea' : '1px solid #374151',
    boxShadow: isFocused ? '0 0 0 1px rgba(128, 222, 234, 0.3)' : 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: 'transparent',
  };

  const statsStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    borderTop: '1px solid #374151',
    fontSize: '12px',
    color: '#a1a1aa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const countWarningStyle: React.CSSProperties = {
    color: hasExceededLimit ? '#ef4444' : '#a1a1aa',
    fontWeight: hasExceededLimit ? 'bold' : 'normal',
  };

  // ========================================================================
  // Render
  // ========================================================================

  const ReactQuillAny = ReactQuill as any;

  return (
    <div className={containerClasses} style={editorContainerStyle} ref={editorRef}>
      <div style={editorWrapperStyle}>
        <ReactQuillAny
          ref={quillRef}
          value={editorValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          theme={theme}
          modules={modules}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          spellCheck={spellCheck}
        />

        {/* Stats Footer */}
        {(showCharacterCount || showWordCount) && (
          <div style={statsStyle}>
            <div>
              {showCharacterCount && (
                <span style={countWarningStyle}>
                  Characters: {stats.characters}
                  {maxLength ? ` / ${maxLength}` : ''}
                </span>
              )}
              {showCharacterCount && showWordCount && <span> • </span>}
              {showWordCount && <span>Words: {stats.words}</span>}
            </div>
            {enableAutoSave && <span style={{ fontSize: '11px', color: '#999' }}>Auto-saving...</span>}
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style>{`
        .rich-text-editor-container {
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .rich-text-editor-container .ql-container {
          font-size: 14px;
          border: none;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .rich-text-editor-container .ql-editor {
          padding: 12px;
          line-height: 1.6;
          flex: 1;
          color: #ffffff;
        }

        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #71717a;
          font-style: normal;
        }

        .rich-text-editor-container .ql-toolbar {
          border: none;
          border-bottom: 1px solid #374151;
          background: transparent;
          border-radius: 8px 8px 0 0;
        }

        .rich-text-editor-container.focused .ql-toolbar {
          background: transparent;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-label {
          color: #e4e4e7;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-stroke {
          stroke: #e4e4e7;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-stroke.ql-fill {
          fill: #e4e4e7;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {
          border: 1px solid #374151;
          background: #18181b;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item {
          color: #e4e4e7;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button:hover,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button.ql-active,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-label:hover,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item:hover,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item.ql-selected {
          color: #80Deea;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button:hover .ql-stroke,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button.ql-active .ql-stroke,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item:hover .ql-stroke,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-stroke {
          stroke: #80Deea;
        }

        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button:hover .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-button.ql-active .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-label:hover .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item:hover .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item:hover .ql-stroke.ql-fill,
        .rich-text-editor-container .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-stroke.ql-fill {
          fill: #80Deea;
        }

        .rich-text-editor-container.limit-exceeded .ql-container {
          border-color: #ef4444;
        }

        @media (max-width: 768px) {
          .rich-text-editor-container .ql-toolbar {
            padding: 8px;
          }

          .rich-text-editor-container .ql-editor {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

// ============================================================================
// Export Types
// ============================================================================

export type { RichTextEditorProps, ToolbarConfig, EditorStats };