import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef as useReactRef, useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Box, Button, Stack } from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  StrikethroughS,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Link as LinkIcon,
} from "@mui/icons-material";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  editorRef?: (editor: any) => void;
  triggerReset?: string | number; // When this changes, reset editor content to value prop (e.g. templateId)
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "",
  readOnly = false,
  minHeight = "200px",
  editorRef,
  triggerReset,
}: RichTextEditorProps) => {
  const editorInstanceRef = useReactRef<any>(null);
  const lastTriggerRef = useReactRef<string | number | undefined>(triggerReset);

  // Memoize extensions array to prevent editor recreation
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      TextStyle,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    []
  );

  // Memoize editorProps to prevent editor recreation
  const editorProps = useMemo(
    () => ({
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
        style: `min-height: ${minHeight}; padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px;`,
      },
    }),
    [minHeight]
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    onUpdate: ({ editor }) => {
      // Always call onChange when user types - editor is uncontrolled
      const newHtml = editor.getHTML();
      onChange(newHtml);
    },
    editable: !readOnly,
    editorProps,
  });

  useEffect(() => {
    if (editor) {
      editorInstanceRef.current = editor;
      if (editorRef) {
        editorRef(editor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // ONLY sync editor content when triggerReset changes (template selected, signature applied, etc.)
  // Do NOT sync on every value prop change - that causes the typing loop
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    
    // Only reset when triggerReset changes (external update like template/signature)
    if (triggerReset !== undefined && triggerReset !== lastTriggerRef.current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      lastTriggerRef.current = triggerReset;
    }
  }, [editor, value, triggerReset]);

  // Initialize editor content only once on mount
  useEffect(() => {
    if (editor && !editor.isDestroyed && value && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      size="small"
      onClick={onClick}
      disabled={disabled || readOnly}
      variant={isActive ? "contained" : "outlined"}
      sx={{
        minWidth: "auto",
        width: 32,
        height: 32,
        padding: 0,
        color: isActive ? "white" : "inherit",
      }}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <Box>
      {!readOnly && (
        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderBottom: "none",
            borderRadius: "4px 4px 0 0",
            p: 0.5,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            bgcolor: "#f5f5f5",
          }}
        >
          <Stack direction="row" spacing={0.5}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <FormatBold fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <FormatItalic fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline"
            >
              <FormatUnderlined fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <StrikethroughS fontSize="small" />
            </ToolbarButton>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <FormatListBulleted fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <FormatListNumbered fontSize="small" />
            </ToolbarButton>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <FormatAlignLeft fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <FormatAlignCenter fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <FormatAlignRight fontSize="small" />
            </ToolbarButton>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <ToolbarButton
              onClick={() => {
                const url = window.prompt("Enter URL:");
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              isActive={editor.isActive("link")}
              title="Insert Link"
            >
              <LinkIcon fontSize="small" />
            </ToolbarButton>
          </Stack>
        </Box>
      )}
      <EditorContent editor={editor} />
      {placeholder && !value && (
        <Box
          sx={{
            position: "absolute",
            top: readOnly ? 12 : 48,
            left: 12,
            color: "#999",
            pointerEvents: "none",
            fontStyle: "italic",
          }}
        >
          {placeholder}
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;
