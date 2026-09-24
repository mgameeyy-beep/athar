import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Edit3,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const NOTE_BUCKET = "daily-note-files";

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
}

function isImageFile(file) {
  const type = file?.type || "";
  const name = file?.name || "";

  return (
    type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(name)
  );
}

function isVideoFile(file) {
  const type = file?.type || "";
  const name = file?.name || "";

  return (
    type.startsWith("video/") ||
    /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name)
  );
}

function isAllowedFile(file) {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
    ".mp4",
    ".webm",
    ".mov",
    ".avi",
    ".mkv",
    ".m4v",
    ".pdf",
    ".xlsx",
    ".xls",
    ".csv",
    ".pptx",
    ".ppt",
    ".docx",
    ".doc",
  ];

  const name = file?.name?.toLowerCase() || "";
  const type = file?.type || "";

  return (
    allowedExtensions.some((extension) =>
      name.endsWith(extension)
    ) ||
    type.startsWith("image/") ||
    type.startsWith("video/") ||
    type.includes("pdf") ||
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("word") ||
    type.includes("document")
  );
}

function DailyNotes({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [noteDate, setNoteDate] = useState(getTodayDate());
  const [content, setContent] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [removeExistingFile, setRemoveExistingFile] =
    useState(false);

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadNotes();
    } else {
      setNotes([]);
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadNotes() {
    setLoadingNotes(true);
    setMessage("");

    const { data, error } = await supabase
      .from("daily_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("note_date", { ascending: false });

    if (error) {
      console.error("Load notes error:", error);
      setMessage("تعذر تحميل المذكرات.");
      setLoadingNotes(false);
      return;
    }

    setNotes(data || []);
    setLoadingNotes(false);
  }

  function resetFileInputs() {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    resetFileInputs();
  }

  function resetEditor() {
    clearSelectedFile();
    setSelectedNoteId(null);
    setNoteDate(getTodayDate());
    setContent("");
    setExistingFileUrl("");
    setRemoveExistingFile(false);
    setMessage("");
  }

  function openNotes() {
    setIsOpen(true);
    setMessage("");
  }

  function closeNotes() {
    setIsOpen(false);
    setMessage("");
  }

  async function getSignedFileUrl(filePath) {
    if (!filePath) {
      return "";
    }

    const { data, error } = await supabase.storage
      .from(NOTE_BUCKET)
      .createSignedUrl(filePath, 60 * 10);

    if (error) {
      console.error("Get note attachment URL error:", error);
      return "";
    }

    return data?.signedUrl || "";
  }

  async function selectNote(note) {
    clearSelectedFile();

    setSelectedNoteId(note.id);
    setNoteDate(note.note_date);
    setContent(note.content || "");
    setRemoveExistingFile(false);
    setMessage("");

    if (note.attachment_path) {
      const signedUrl = await getSignedFileUrl(
        note.attachment_path
      );

      setExistingFileUrl(signedUrl);
    } else {
      setExistingFileUrl("");
    }
  }

  function handleFileSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isAllowedFile(file)) {
      setMessage(
        "نوع الملف غير مدعوم. اختر صورة أو فيديو أو PDF أو Excel أو PowerPoint أو Word."
      );
      resetFileInputs();
      return;
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("حجم الملف كبير. الحد الأقصى 100 ميجابايت.");
      resetFileInputs();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveExistingFile(false);
    setMessage("");
  }

  async function uploadFile(file) {
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from(NOTE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      throw error;
    }

    return filePath;
  }

  async function deleteStorageFile(filePath) {
    if (!filePath) {
      return;
    }

    const { error } = await supabase.storage
      .from(NOTE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Delete note file error:", error);
    }
  }

  async function saveNote(event) {
    event.preventDefault();

    if (!noteDate) {
      setMessage("اختر تاريخ المذكرة.");
      return;
    }

    if (!content.trim()) {
      setMessage("اكتب محتوى المذكرة أولًا.");
      return;
    }

    if (!user?.id) {
      setMessage("لم يتم العثور على المستخدم.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const currentNote = notes.find(
        (note) => note.id === selectedNoteId
      );

      let attachmentPath = currentNote?.attachment_path || null;
      let attachmentName = currentNote?.attachment_name || null;
      let attachmentType = currentNote?.attachment_type || null;

      if (selectedFile) {
        const newPath = await uploadFile(selectedFile);

        if (attachmentPath) {
          await deleteStorageFile(attachmentPath);
        }

        attachmentPath = newPath;
        attachmentName = selectedFile.name;
        attachmentType =
          selectedFile.type || "application/octet-stream";
      }

      if (removeExistingFile && !selectedFile) {
        if (attachmentPath) {
          await deleteStorageFile(attachmentPath);
        }

        attachmentPath = null;
        attachmentName = null;
        attachmentType = null;
      }

      const noteData = {
        user_id: user.id,
        note_date: noteDate,
        content: content.trim(),
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("daily_notes")
        .upsert(noteData, {
          onConflict: "user_id,note_date",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setNotes((currentNotes) => {
        const exists = currentNotes.some(
          (note) => note.id === data.id
        );

        const updatedNotes = exists
          ? currentNotes.map((note) =>
              note.id === data.id ? data : note
            )
          : [data, ...currentNotes];

        return updatedNotes.sort((first, second) =>
          second.note_date.localeCompare(first.note_date)
        );
      });

      setSelectedNoteId(data.id);
      setSelectedFile(null);
      setPreviewUrl("");
      setRemoveExistingFile(false);
      resetFileInputs();

      if (data.attachment_path) {
        const signedUrl = await getSignedFileUrl(
          data.attachment_path
        );

        setExistingFileUrl(signedUrl);
      } else {
        setExistingFileUrl("");
      }

      setMessage("تم حفظ المذكرة والمرفق بنجاح.");
    } catch (error) {
      console.error("Save note error:", error);
      setMessage(
        error?.message || "حدث خطأ أثناء حفظ المذكرة."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(noteId) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه المذكرة والمرفق؟"
    );

    if (!confirmed) {
      return;
    }

    const note = notes.find((item) => item.id === noteId);

    const { error } = await supabase
      .from("daily_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete note error:", error);
      setMessage("تعذر حذف المذكرة.");
      return;
    }

    if (note?.attachment_path) {
      await deleteStorageFile(note.attachment_path);
    }

    setNotes((currentNotes) =>
      currentNotes.filter((item) => item.id !== noteId)
    );

    resetEditor();
    setMessage("تم حذف المذكرة.");
  }

  function renderAttachmentPreview() {
    const currentFile = selectedFile;
    const currentUrl = previewUrl || existingFileUrl;

    if (!currentUrl) {
      return null;
    }

    const fileName =
      currentFile?.name ||
      notes.find((note) => note.id === selectedNoteId)
        ?.attachment_name ||
      "";

    const fileType =
      currentFile?.type ||
      notes.find((note) => note.id === selectedNoteId)
        ?.attachment_type ||
      "";

    const image = isImageFile({
      type: fileType,
      name: fileName,
    });

    const video = isVideoFile({
      type: fileType,
      name: fileName,
    });

    if (image) {
      return (
        <div className="note-attachment-preview">
          <img src={currentUrl} alt="معاينة مرفق المذكرة" />
        </div>
      );
    }

    if (video) {
      return (
        <div className="note-attachment-preview">
          <video src={currentUrl} controls />
        </div>
      );
    }

    return (
      <div className="note-file-preview">
        <FileText size={22} />

        <span>{fileName || "ملف مرفق"}</span>

        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
        >
          فتح الملف
        </a>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="floating-notes-button"
        onClick={openNotes}
        title="مذكرتي اليومية"
      >
        <BookOpen size={23} />
        <span>مذكرتي</span>
      </button>

      {isOpen && (
        <div
          className="notes-modal-overlay"
          dir="rtl"
          onClick={closeNotes}
        >
          <section
            className="notes-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="notes-modal-header">
              <div className="notes-modal-title">
                <div className="notes-modal-icon">
                  <BookOpen size={22} />
                </div>

                <div>
                  <span>مساحتك الخاصة</span>
                  <h2>مذكرتي اليومية</h2>
                </div>
              </div>

              <button
                type="button"
                className="notes-modal-close"
                onClick={closeNotes}
              >
                <X size={20} />
              </button>
            </header>

            <div className="notes-modal-body">
              <form
                className="note-editor-panel"
                onSubmit={saveNote}
              >
                <div className="note-editor-heading">
                  <div>
                    <span>
                      {selectedNoteId
                        ? "تعديل المذكرة"
                        : "مذكرة جديدة"}
                    </span>

                    <h3>
                      {selectedNoteId
                        ? "حدّث تفاصيل يومك"
                        : "ماذا حدث اليوم؟"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="new-note-small-button"
                    onClick={resetEditor}
                  >
                    مذكرة جديدة
                  </button>
                </div>

                <label className="note-field">
                  <span>
                    <CalendarDays size={15} />
                    تاريخ المذكرة
                  </span>

                  <input
                    type="date"
                    value={noteDate}
                    onChange={(event) =>
                      setNoteDate(event.target.value)
                    }
                  />
                </label>

                <label className="note-field">
                  <span>
                    <FileText size={15} />
                    تفاصيل اليوم
                  </span>

                  <textarea
                    rows="9"
                    value={content}
                    onChange={(event) =>
                      setContent(event.target.value)
                    }
                    placeholder="اكتب هنا الاجتماعات، الأعمال، المتابعات، الملاحظات، أو أي شيء تريد الاحتفاظ به..."
                  />
                </label>

                <div className="note-attachment-section">
                  <div className="note-attachment-heading">
                    <span>
                      <Paperclip size={15} />
                      مرفق المذكرة
                    </span>

                    <small>اختياري</small>
                  </div>

                  <div className="note-attachment-actions">
                    <button
                      type="button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      <ImageIcon size={16} />
                      التقاط صورة
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        videoInputRef.current?.click()
                      }
                    >
                      <Video size={16} />
                      تصوير فيديو
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      <Upload size={16} />
                      رفع ملف
                    </button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden-file-input"
                    onChange={handleFileSelected}
                  />

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden-file-input"
                    onChange={handleFileSelected}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc"
                    className="hidden-file-input"
                    onChange={handleFileSelected}
                  />

                  {selectedFile && (
                    <div className="selected-note-file">
                      <span>{selectedFile.name}</span>

                      <button
                        type="button"
                        onClick={clearSelectedFile}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  {!selectedFile &&
                    existingFileUrl &&
                    !removeExistingFile && (
                      <div className="existing-note-file">
                        {renderAttachmentPreview()}

                        <button
                          type="button"
                          onClick={() => {
                            setRemoveExistingFile(true);
                            setExistingFileUrl("");
                          }}
                        >
                          حذف المرفق عند الحفظ
                        </button>
                      </div>
                    )}

                  {selectedFile && (
                    <div className="new-note-file-preview">
                      {renderAttachmentPreview()}
                    </div>
                  )}
                </div>

                {message && (
                  <p className="note-status-message">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="save-note-main-button"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? "جارٍ الحفظ..."
                    : selectedNoteId
                      ? "حفظ التعديلات"
                      : "حفظ المذكرة"}
                </button>

                <p className="note-editor-hint">
                  إذا استخدمت نفس التاريخ، سيتم تحديث المذكرة
                  السابقة بدل إنشاء مذكرة جديدة.
                </p>
              </form>

              <div className="notes-list-panel">
                <div className="notes-list-heading">
                  <div>
                    <span>الأرشيف</span>
                    <h3>المذكرات السابقة</h3>
                  </div>

                  <strong>{notes.length}</strong>
                </div>

                {loadingNotes ? (
                  <div className="notes-list-empty">
                    جارٍ تحميل المذكرات...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="notes-list-empty">
                    لا توجد مذكرات سابقة.
                      

                    ابدأ بكتابة أول مذكرة لك.
                  </div>
                ) : (
                  <div className="notes-items">
                    {notes.map((note) => (
                      <article
                        className={`note-list-item ${
                          selectedNoteId === note.id
                            ? "active"
                            : ""
                        }`}
                        key={note.id}
                        onClick={() => selectNote(note)}
                      >
                        <div className="note-list-item-top">
                          <span>
                            <CalendarDays size={14} />
                            {formatDate(note.note_date)}
                          </span>

                          {note.attachment_path && (
                            <Paperclip
                              size={15}
                              className="note-list-attachment-icon"
                            />
                          )}

                          <div className="note-item-actions">
                            <button
                              type="button"
                              title="تعديل"
                              onClick={(event) => {
                                event.stopPropagation();
                                selectNote(note);
                              }}
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              title="حذف"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteNote(note.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p>{note.content}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default DailyNotes;
