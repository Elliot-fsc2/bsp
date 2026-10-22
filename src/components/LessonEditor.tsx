"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[360px] place-items-center rounded-2xl border border-[#1B365F]/10 bg-white text-sm text-[#718096]">
      Loading TinyMCE…
    </div>
  ),
});

type TinyEditor = {
  insertContent: (html: string) => void;
};

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function LessonEditor({ value, onChange }: Props) {
  const editorRef = useRef<TinyEditor | null>(null);

  const init = useMemo(
    () => ({
      height: 520,
      menubar: true,
      plugins:
        "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table wordcount",
      toolbar:
        "undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media table | code fullscreen preview",
      extended_valid_elements:
        "iframe[src|width|height|name|align|class|frameborder|allow|allowfullscreen|style|scrolling],video[src|controls|width|height],source[src|type]",
      media_live_embeds: true,
      convert_urls: false,
      branding: false,
      content_style:
        "body { font-family: Georgia, serif; font-size: 16px; line-height: 1.65; color: #1B365F; }",
    }),
    [],
  );

  return (
    <div className="space-y-4">
      <Editor
        licenseKey="gpl"
        tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@7.6.0/tinymce.min.js"
        value={value}
        onEditorChange={(html: string) => onChange(html)}
        onInit={(_event: unknown, editor: TinyEditor) => {
          editorRef.current = editor;
        }}
        init={init}
      />
    </div>
  );
}
