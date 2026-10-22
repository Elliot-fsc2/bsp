"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { uploadFile } from "@/components/MediaUploader";

type TinyEditorInstance = {
  on: (name: string, handler: () => void) => void;
  getContent: () => string;
  setContent: (value: string) => void;
  insertContent: (content: string) => void;
  ui: {
    registry: {
      addButton: (
        name: string,
        config: { text?: string; icon?: string; tooltip?: string; onAction: () => void },
      ) => void;
    };
  };
  destroy: () => void;
};

type TinymceGlobal = {
  init: (options: Record<string, unknown>) => Promise<TinyEditorInstance[]>;
};

const SYNC_EVENTS = "change input keyup undo redo SetContent ExecCommand paste NodeChange";

let loader: Promise<TinymceGlobal> | null = null;

function loadTinymce(): Promise<TinymceGlobal> {
  const w = window as unknown as { tinymce?: TinymceGlobal };
  if (w.tinymce) return Promise.resolve(w.tinymce);
  if (!loader) {
    loader = new Promise<TinymceGlobal>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/tinymce/tinymce.min.js";
      script.async = true;
      script.onload = () => {
        const loaded = (window as unknown as { tinymce?: TinymceGlobal }).tinymce;
        if (loaded) resolve(loaded);
        else reject(new Error("TinyMCE did not initialise"));
      };
      script.onerror = () => reject(new Error("TinyMCE failed to load"));
      document.head.appendChild(script);
    });
  }
  return loader;
}

function attachMediaButton(editor: TinyEditorInstance, kind: "image" | "video") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = kind === "image" ? "image/*" : "video/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      editor.insertContent(
        kind === "image" ? `<img src="${url}" alt="" />` : `<video controls src="${url}"></video>`,
      );
    } catch {
      window.alert("Could not upload that file.");
    }
  };
  input.click();
}

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Write something wonderful…",
  minHeight = 220,
  label,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeight?: number;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "ready" | "fallback">("idle");
  const hostRef = useRef<HTMLTextAreaElement | null>(null);
  const initialRef = useRef(defaultValue);
  const reactId = useId();
  const editorId = `rt-${name}-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let disposed = false;
    let editor: TinyEditorInstance | undefined;

    loadTinymce()
      .then((tinymce) => {
        if (disposed || !hostRef.current) return undefined;
        return tinymce.init({
          selector: `#${editorId}`,
          target: hostRef.current,
          skin: "oxide",
          promotion: false,
          branding: false,
          menubar: "file edit view insert format tools table help",
          statusbar: true,
          resize: "vertical",
          width: "100%",
          min_height: minHeight,
          max_height: 720,
          placeholder,
          convert_urls: false,
          relative_urls: false,
          plugins:
            "advlist anchor autolink charmap code codesample directionality emoticons fullscreen help image insertdatetime link lists media nonbreaking pagebreak preview quickbars searchreplace table visualblocks visualchars wordcount",
          toolbar:
            "undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link unlink | image media uploadimage uploadvideo | table emoticons codesample charmap | code preview fullscreen",
          toolbar_mode: "wrap",
          toolbar_sticky: true,
          contextmenu: "link image table",
          image_advtab: true,
          media_live_embeds: true,
          link_default_target: "_blank",
          automatic_uploads: true,
          images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
            const blob = blobInfo.blob();
            const file = new File([blob], blobInfo.filename() || "image.png", { type: blob.type || "image/png" });
            const uploaded = await uploadFile(file);
            return uploaded.url;
          },
          setup: (editor: TinyEditorInstance) => {
            editor.ui.registry.addButton("uploadimage", {
              icon: "image",
              tooltip: "Upload an image from this device",
              onAction: () => attachMediaButton(editor, "image"),
            });
            editor.ui.registry.addButton("uploadvideo", {
              icon: "embed",
              tooltip: "Upload a video from this device",
              onAction: () => attachMediaButton(editor, "video"),
            });
          },
          quickbars_selection_toolbar: "bold italic | blocks | quicklink blockquote",
          style_formats: [
            { title: "Paragraph styles", block: "p" },
            { title: "Sunny heading", block: "h3" },
            { title: "Tiny subtitle", block: "h4" },
            { title: "Callout note", block: "div", classes: "rt-note" },
            { title: "Checklist", block: "ul", classes: "rt-check" },
          ],
          style_formats_merge: true,
          content_style: `
            body { font-family: Nunito, "Trebuchet MS", sans-serif; color: #2b1b4e; font-size: 15px; line-height: 1.65; }
            h3 { font-size: 22px; margin: 14px 0 6px; }
            h4 { font-size: 18px; margin: 12px 0 4px; }
            ul, ol { padding-left: 22px; }
            blockquote { border-left: 4px solid #ffd166; margin-left: 0; padding-left: 12px; color: #6b5b83; }
            .rt-note { background: #fff3c4; border-left: 6px solid #ffd166; border-radius: 12px; padding: 10px 14px; }
            .rt-check { list-style: none; padding-left: 4px; }
            .rt-check li::before { content: "\\2705  "; }
          `,
        });
      })
      .then((editors) => {
        if (disposed || !editors || editors.length === 0) return;
        editor = editors[0];
        editor.setContent(initialRef.current || "");
        editor.on(SYNC_EVENTS, () => {
          if (editor) setValue(editor.getContent());
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("fallback");
      });

    return () => {
      disposed = true;
      try {
        editor?.destroy();
      } catch {
        /* already torn down */
      }
    };
  }, [minHeight, placeholder, editorId]);

  return (
    <div className="w-full">
      {label ? <span className="mb-1 block text-sm font-extrabold">{label}</span> : null}
      <input type="hidden" name={name} value={value} />
      <div className="relative rounded-[18px]">
        {status === "fallback" ? (
          <span className="mb-1 flex items-center gap-2 text-xs font-extrabold text-[var(--muted)]">
            <PenLine size={14} /> Plain text mode — the rich editor is still loading
          </span>
        ) : null}
        <textarea
          id={editorId}
          ref={hostRef}
          defaultValue={defaultValue}
          placeholder={placeholder}
          readOnly={status === "idle"}
          onChange={(event) => setValue(event.target.value)}
          className="bloom-area min-h-[150px] w-full resize-y"
        />
        {status === "idle" ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-[18px] bg-white/75 text-sm font-bold text-[var(--muted)] backdrop-blur-[1px]">
            <Loader2 className="animate-spin" size={16} /> Warming up the writing desk…
          </div>
        ) : null}
      </div>
    </div>
  );
}
