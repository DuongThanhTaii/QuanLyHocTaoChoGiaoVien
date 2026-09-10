import { Archive24Regular, Document24Regular, DocumentPdf24Regular, DocumentTable24Regular, DocumentText24Regular, Image24Regular, SlideText24Regular, Video24Regular } from '@fluentui/react-icons';

type Props = { fileType?: string | null; name?: string | null; className?: string };

/** Semantic Fluent UI file glyphs; MIME type takes precedence over the extension. */
export function FileTypeIcon({ fileType, name, className = '' }: Props) {
  const mime = (fileType ?? '').toLowerCase();
  const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? '';
  let label = 'Tệp'; let tone = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'; let glyph = <Document24Regular className="size-5" />;
  if (mime.includes('pdf') || ext === 'pdf') { label = 'PDF'; tone = 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'; glyph = <DocumentPdf24Regular className="size-5" />; }
  else if (mime.includes('video') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) { label = 'Video'; tone = 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300'; glyph = <Video24Regular className="size-5" />; }
  else if (mime.includes('word') || ['doc', 'docx'].includes(ext)) { label = 'Word'; tone = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'; glyph = <DocumentText24Regular className="size-5" />; }
  else if (mime.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) { label = 'Bảng tính'; tone = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'; glyph = <DocumentTable24Regular className="size-5" />; }
  else if (mime.includes('presentation') || ['ppt', 'pptx'].includes(ext)) { label = 'Trình chiếu'; tone = 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'; glyph = <SlideText24Regular className="size-5" />; }
  else if (mime.includes('zip') || ['zip', 'rar', '7z', 'tar'].includes(ext)) { label = 'Tệp nén'; tone = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'; glyph = <Archive24Regular className="size-5" />; }
  else if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) { label = 'Hình ảnh'; tone = 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'; glyph = <Image24Regular className="size-5" />; }
  return <span title={label} aria-label={label} className={`grid size-9 place-items-center rounded-lg ${tone} ${className}`}>{glyph}</span>;
}
