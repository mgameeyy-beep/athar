import { useEffect, useRef, useState } from "react";
import {
  Camera,
  FileUp,
  Video,
} from "lucide-react";


import { supabase } from "./lib/supabase";

function AchievementForm({
  user,
  achievement,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(achievement);

  const [title, setTitle] = useState(achievement?.title || "");
  const [description, setDescription] = useState(
    achievement?.description || ""
  );
  const [category, setCategory] = useState(
    achievement?.category || "عام"
  );
  const [achievementDate, setAchievementDate] = useState(
    achievement?.achievement_date ||
      new Date().toISOString().split("T")[0]
  );

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type || "";

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

      ".xlsx",
      ".xls",
      ".csv",

      ".pptx",
      ".ppt",

      ".docx",
      ".doc",

      ".pdf",
    ];

    const extensionIsAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    const mimeTypeIsAllowed =
      fileType.startsWith("image/") ||
      fileType.startsWith("video/") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      fileType.includes("presentation") ||
      fileType.includes("powerpoint") ||
      fileType.includes("word") ||
      fileType.includes("document") ||
      fileType.includes("pdf") ||
      fileType.includes("csv");

    if (!extensionIsAllowed && !mimeTypeIsAllowed) {
      setMessage(
        "الملف غير مدعوم. اختر صورة أو فيديو أو Excel أو PowerPoint أو Word أو PDF."
      );
      return;
    }

    const maxSizeInBytes = 100 * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setMessage("حجم الملف كبير جدًا. الحد الأقصى 100 ميجابايت.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMessage("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");

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

  async function uploadFile(file, achievementId) {
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("achievement-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data, error: updateError } = await supabase
      .from("achievements")
      .update({
        attachment_path: filePath,
        attachment_name: file.name,
        attachment_type: file.type || "unknown",
        updated_at: new Date().toISOString(),
      })
      .eq("id", achievementId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("اكتب عنوان الإنجاز أولًا.");
      return;
    }

    if (!user?.id) {
      setMessage("لم يتم العثور على حساب المستخدم.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let savedAchievement;

      if (isEditing) {
        const { data, error } = await supabase
          .from("achievements")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            category,
            achievement_date: achievementDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", achievement.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedAchievement = data;
      } else {
        const { data, error } = await supabase
          .from("achievements")
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            category,
            achievement_date: achievementDate,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedAchievement = data;
      }

      if (selectedFile) {
        savedAchievement = await uploadFile(
          selectedFile,
          savedAchievement.id
        );
      }

      onSaved(savedAchievement);
    } catch (error) {
      console.error("Achievement save error:", error);

      setMessage(
        error?.message ||
          "حدث خطأ أثناء حفظ الإنجاز أو المرفق."
      );
    } finally {
      setLoading(false);
    }
  }

  function isImageFile(file) {
    const type = file?.type || "";
    const name = file?.name?.toLowerCase() || "";

    return (
      type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(name)
    );
  }

  function isVideoFile(file) {
    const type = file?.type || "";
    const name = file?.name?.toLowerCase() || "";

    return (
      type.startsWith("video/") ||
      /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name)
    );
  }

  return (
    <div className="modal-overlay" dir="rtl">
      <section className="achievement-form-card">
        <div className="form-header">
          <div>
            <h2>
              {isEditing ? "تعديل الإنجاز" : "إضافة إنجاز جديد"}
            </h2>

            <p>
              {isEditing
                ? "عدّل تفاصيل الإنجاز ثم احفظ التغييرات."
                : "وثّق إنجازك وأرفق صورة أو فيديو أو ملفًا."}
            </p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            عنوان الإنجاز

            <input
              type="text"
              placeholder="مثال: إعداد تقرير الأداء الشهري"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label>
            وصف الإنجاز

            <textarea
              rows="5"
              placeholder="اكتب تفاصيل العمل الذي أنجزته..."
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />
          </label>

          <label>
            التصنيف

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="عام">عام</option>
              <option value="تقرير">تقرير</option>
              <option value="اجتماع">اجتماع</option>
              <option value="مشروع">مشروع</option>
              <option value="تطوير">تطوير</option>
              <option value="تعلم">تعلم</option>
            </select>
          </label>

          <label>
            تاريخ الإنجاز

            <input
              type="date"
              value={achievementDate}
              onChange={(event) =>
                setAchievementDate(event.target.value)
              }
              required
            />
          </label>

          <div className="attachment-section">
            <div className="attachment-title">
              <strong>إرفاق إثبات الإنجاز</strong>
              <span>اختياري</span>
            </div>

            <div className="attachment-options">
  <button
    type="button"
    className="attachment-option"
    onClick={() =>
      cameraInputRef.current?.click()
    }
  >
    <span className="attachment-option-icon camera-icon">
      <Camera size={24} strokeWidth={2} />
    </span>

    <strong>التقاط صورة</strong>
    <small>استخدم كاميرا الجوال</small>
  </button>

  <button
    type="button"
    className="attachment-option"
    onClick={() =>
      videoInputRef.current?.click()
    }
  >
    <span className="attachment-option-icon video-icon">
      <Video size={24} strokeWidth={2} />
    </span>

    <strong>تصوير فيديو</strong>
    <small>صوّر إثباتًا قصيرًا</small>
  </button>

  <button
    type="button"
    className="attachment-option"
    onClick={() =>
      fileInputRef.current?.click()
    }
  >
    <span className="attachment-option-icon file-icon">
      <FileUp size={24} strokeWidth={2} />
    </span>

    <strong>رفع ملف</strong>
    <small>Excel أو PowerPoint أو PDF</small>
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
              accept="image/*,video/*,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc,.pdf,.heic,.heif,.mov,.mkv"
              className="hidden-file-input"
              onChange={handleFileSelected}
            />

            {selectedFile && (
              <div className="selected-file">
                <div className="file-preview">
                  {isImageFile(selectedFile) ? (
                    <img
                      src={previewUrl}
                      alt="معاينة المرفق"
                    />
                  ) : isVideoFile(selectedFile) ? (
                    <video
                      src={previewUrl}
                      controls
                    />
                  ) : (
                    <div className="document-preview">
                      ملف
                    </div>
                  )}
                </div>

                <div className="selected-file-info">
                  <strong>{selectedFile.name}</strong>

                  <span>
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    ميجابايت
                  </span>
                </div>

                <button
                  type="button"
                  className="remove-file-button"
                  onClick={removeSelectedFile}
                >
                  حذف
                </button>
              </div>
            )}

            {!selectedFile &&
              achievement?.attachment_name && (
                <p className="existing-file">
                  المرفق الحالي:{" "}
                  {achievement.attachment_name}
                </p>
              )}
          </div>

          {message && (
            <p className="form-message">{message}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading
                ? "جارٍ الحفظ..."
                : isEditing
                  ? "حفظ التعديلات"
                  : "حفظ الإنجاز"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AchievementForm;
