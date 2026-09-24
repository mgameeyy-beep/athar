import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Play,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";

function formatDate(dateString) {
  if (!dateString) {
    return "غير محدد";
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

function isImageAttachment(achievement) {
  const type = achievement.attachment_type || "";
  const name = achievement.attachment_name || "";

  return (
    type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(name)
  );
}

function isVideoAttachment(achievement) {
  const type = achievement.attachment_type || "";
  const name = achievement.attachment_name || "";

  return (
    type.startsWith("video/") ||
    /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name)
  );
}

function AchievementDetails({ achievement, onClose }) {
  const [loading, setLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasAttachment = Boolean(
    achievement?.attachment_path
  );

  useEffect(() => {
    let active = true;

    async function loadAttachmentPreview() {
      if (!hasAttachment) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase.storage
        .from("achievement-files")
        .createSignedUrl(
          achievement.attachment_path,
          60 * 10
        );

      if (!active) {
        return;
      }

      setLoading(false);

      if (error) {
        console.error("Load attachment error:", error);
        setErrorMessage("تعذر تحميل معاينة المرفق.");
        return;
      }

      setAttachmentUrl(data?.signedUrl || "");
    }

    loadAttachmentPreview();

    return () => {
      active = false;
    };
  }, [achievement?.attachment_path, hasAttachment]);

  async function openAttachment() {
    if (!achievement?.attachment_path) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.storage
      .from("achievement-files")
      .createSignedUrl(
        achievement.attachment_path,
        60 * 10
      );

    setLoading(false);

    if (error) {
      console.error("Open attachment error:", error);
      setErrorMessage("تعذر فتح المرفق.");
      return;
    }

    if (data?.signedUrl) {
      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  if (!achievement) {
    return null;
  }

  const isImage = isImageAttachment(achievement);
  const isVideo = isVideoAttachment(achievement);

  return (
    <div
      className="achievement-details-overlay"
      dir="rtl"
      onClick={onClose}
    >
      <section
        className="achievement-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="achievement-details-header">
          <div className="achievement-details-header-content">
            <span className="achievement-details-label">
              تفاصيل الإنجاز
            </span>

            <h2>{achievement.title}</h2>
          </div>

          <button
            type="button"
            className="achievement-details-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </header>

        <div className="achievement-details-body">
          <div className="achievement-details-meta">
            <div className="achievement-details-meta-item">
              <span>
                <CalendarDays size={14} />
                تاريخ الإنجاز
              </span>

              <strong>
                {formatDate(
                  achievement.achievement_date
                )}
              </strong>
            </div>

            <div className="achievement-details-meta-item">
              <span>
                <FileText size={14} />
                التصنيف
              </span>

              <strong>
                {achievement.category || "عام"}
              </strong>
            </div>
          </div>

          <section className="achievement-details-section">
            <h3>وصف الإنجاز</h3>

            <p>
              {achievement.description ||
                "لا يوجد وصف مضاف لهذا الإنجاز."}
            </p>
          </section>

          <section className="achievement-details-section">
            <h3>
              <Paperclip size={17} />
              المرفق
            </h3>

            {!hasAttachment ? (
              <p>لا يوجد مرفق لهذا الإنجاز.</p>
            ) : loading && !attachmentUrl ? (
              <div className="achievement-details-loading">
                جارٍ تحميل المرفق...
              </div>
            ) : errorMessage ? (
              <div className="achievement-details-error">
                {errorMessage}
              </div>
            ) : (
              <>
                {isImage && attachmentUrl && (
                  <div className="achievement-details-attachment">
                    <img
                      src={attachmentUrl}
                      alt={`مرفق ${achievement.title}`}
                    />
                  </div>
                )}

                {isVideo && attachmentUrl && (
                  <div className="achievement-details-attachment">
                    <video
                      src={attachmentUrl}
                      controls
                      preload="metadata"
                    />
                  </div>
                )}

                {!isImage &&
                  !isVideo &&
                  attachmentUrl && (
                    <div className="achievement-details-file">
                      <FileText size={24} />

                      <span className="achievement-details-file-name">
                        {achievement.attachment_name ||
                          "ملف مرفق"}
                      </span>
                    </div>
                  )}

                <button
                  type="button"
                  className="open-attachment-button"
                  onClick={openAttachment}
                  disabled={loading}
                >
                  <Paperclip size={16} />

                  {loading
                    ? "جارٍ فتح المرفق..."
                    : "فتح المرفق بحجم كامل"}
                </button>
              </>
            )}
          </section>
        </div>

        <footer className="achievement-details-footer">
          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            إغلاق
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AchievementDetails;
