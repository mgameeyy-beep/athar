import { useState } from "react";
import {
  Archive,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  Image as ImageIcon,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

function parseAchievementDate(dateString) {
  if (!dateString) {
    return null;
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  return new Date(year, month - 1, day);
}

function startOfWorkWeek(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();

  // بداية الأسبوع يوم السبت
  const daysFromSaturday = (day + 1) % 7;

  result.setDate(result.getDate() - daysFromSaturday);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWorkWeek(date = new Date()) {
  const result = startOfWorkWeek(date);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

function isDateBetween(date, start, end) {
  return date >= start && date <= end;
}

function StatCard({
  icon: Icon,
  title,
  number,
  description,
  color,
  progress,
  onClick,
}) {
  return (
    <div
      className={`stat-card ${
        onClick ? "stat-card-clickable" : ""
      }`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          onClick &&
          (event.key === "Enter" || event.key === " ")
        ) {
          onClick();
        }
      }}
    >
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>

      <p className="stat-title">{title}</p>

      <h3>{number}</h3>

      <p className="stat-description">{description}</p>

      <div className="progress-background">
        <div
          className={`progress-bar ${color}`}
          style={{
            width: `${Math.min(progress, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function SummaryModal({
  summary,
  onClose,
  onViewAchievement,
}) {
  if (!summary) {
    return null;
  }

  return (
    <div
      className="summary-modal-overlay"
      dir="rtl"
      onClick={onClose}
    >
      <section
        className="summary-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-modal-header">
          <div>
            <span className="summary-modal-label">
              عرض مختصر
            </span>

            <h2>{summary.title}</h2>

            <p>
              عدد الإنجازات: {summary.items.length}
            </p>
          </div>

          <button
            type="button"
            className="summary-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="summary-list">
          {summary.items.length === 0 ? (
            <div className="summary-empty">
              لا توجد إنجازات في هذه الفترة.
            </div>
          ) : (
            summary.items.slice(0, 8).map((achievement) => (
              <button
                type="button"
                className="summary-item"
                key={achievement.id}
                onClick={() => {
                  onClose();
                  onViewAchievement(achievement);
                }}
              >
                <div className="summary-item-icon">
                  <FileText size={18} />
                </div>

                <div className="summary-item-content">
                  <strong>{achievement.title}</strong>

                  <span>
                    {achievement.category || "عام"} ·{" "}
                    {formatDate(
                      achievement.achievement_date
                    )}
                  </span>
                </div>

                {achievement.attachment_path && (
                  <span className="summary-attachment">
                    <ImageIcon size={13} />
                  </span>
                )}

                <ChevronLeft
                  size={17}
                  className="summary-item-arrow"
                />
              </button>
            ))
          )}
        </div>

        {summary.items.length > 8 && (
          <p className="summary-more">
            يتم عرض أول 8 إنجازات فقط في الملخص.
          </p>
        )}

        <div className="summary-modal-footer">
          <button
            type="button"
            className="summary-close-footer"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </section>
    </div>
  );
}

function AchievementLogModal({
  achievements,
  filteredAchievements,
  searchText,
  searchDate,
  setSearchText,
  setSearchDate,
  availableDates,
  onClearSearch,
  onClose,
  onViewAchievement,
  onEditAchievement,
  onDeleteAchievement,
}) {
  return (
    <div
      className="achievements-log-overlay"
      dir="rtl"
      onClick={onClose}
    >
      <section
        className="achievements-log-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="achievements-log-header">
          <div>
            <span>الأرشيف المهني</span>

            <h2>سجل إنجازاتك</h2>

            <p>
              ابحث واستعرض جميع الأعمال التي وثّقتها.
            </p>
          </div>

          <button
            type="button"
            className="achievements-log-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="search-box achievements-search-box">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={19} />

            <input
              type="search"
              list="achievement-suggestions"
              placeholder="ابحث باسم الإنجاز أو التصنيف..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <datalist id="achievement-suggestions">
              {achievements.map((achievement) => (
                <option
                  key={achievement.id}
                  value={achievement.title}
                />
              ))}
            </datalist>
          </div>

          <div className="date-search-wrapper">
            <label htmlFor="log-search-date">
              اختر التاريخ
            </label>

            <select
              id="log-search-date"
              value={searchDate}
              onChange={(event) =>
                setSearchDate(event.target.value)
              }
            >
              <option value="">كل التواريخ</option>

              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>

          {(searchText || searchDate) && (
            <button
              type="button"
              className="clear-search-button"
              onClick={onClearSearch}
            >
              <X size={15} />
              مسح
            </button>
          )}
        </div>

        <div className="achievements-log-results">
          <div className="achievements-log-count">
            {filteredAchievements.length} إنجاز
          </div>

          {filteredAchievements.length === 0 ? (
            <div className="empty-achievements">
              لا توجد نتائج مطابقة للبحث.
            </div>
          ) : (
            filteredAchievements.map((achievement) => (
              <div
                className="achievement-log-row"
                key={achievement.id}
              >
                <div className="achievement-icon green">
                  <FileText size={20} />
                </div>

                <div className="achievement-info">
                  <strong>{achievement.title}</strong>

                  <span>
                    {achievement.category || "عام"} ·{" "}
                    {formatDate(
                      achievement.achievement_date
                    )}
                  </span>
                </div>

                {achievement.attachment_path && (
                  <span className="attachment-badge">
                    <ImageIcon size={13} />
                    مرفق
                  </span>
                )}

                <button
                  type="button"
                  className="view-achievement-button"
                  onClick={() =>
                    onViewAchievement(achievement)
                  }
                >
                  عرض
                </button>

                <button
                  type="button"
                  className="edit-achievement-button"
                  onClick={() =>
                    onEditAchievement(achievement)
                  }
                >
                  تعديل
                </button>

                <button
                  type="button"
                  className="delete-achievement-button"
                  onClick={() =>
                    onDeleteAchievement(achievement.id)
                  }
                >
                  حذف
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Dashboard({
  user,
  achievements = [],
  onAddAchievement,
  onViewAchievement,
  onEditAchievement,
  onDeleteAchievement,
  onLogout,
}) {
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [summaryView, setSummaryView] = useState(null);
  const [showAchievementsLog, setShowAchievementsLog] =
    useState(false);

  const now = new Date();

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "بك";

  const todayString = getLocalDateString(now);

  const weekStart = startOfWorkWeek(now);
  const weekEnd = endOfWorkWeek(now);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const yearStart = new Date(
    now.getFullYear(),
    0,
    1,
    0,
    0,
    0,
    0
  );

  const yearEnd = new Date(
    now.getFullYear(),
    11,
    31,
    23,
    59,
    59,
    999
  );

  const todayAchievements = achievements.filter(
    (achievement) =>
      achievement.achievement_date === todayString
  );

  const weekAchievements = achievements.filter((achievement) => {
    const date = parseAchievementDate(
      achievement.achievement_date
    );

    return date
      ? isDateBetween(date, weekStart, weekEnd)
      : false;
  });

  const monthAchievements = achievements.filter((achievement) => {
    const date = parseAchievementDate(
      achievement.achievement_date
    );

    return date
      ? isDateBetween(date, monthStart, monthEnd)
      : false;
  });

  const yearAchievements = achievements.filter((achievement) => {
    const date = parseAchievementDate(
      achievement.achievement_date
    );

    return date
      ? isDateBetween(date, yearStart, yearEnd)
      : false;
  });

  const filteredAchievements = [...achievements]
    .filter((achievement) => {
      const searchValue = searchText.trim().toLowerCase();

      if (!searchValue) {
        return true;
      }

      const title = achievement.title || "";
      const description = achievement.description || "";
      const category = achievement.category || "";

      return (
        title.toLowerCase().includes(searchValue) ||
        description.toLowerCase().includes(searchValue) ||
        category.toLowerCase().includes(searchValue)
      );
    })
    .filter((achievement) => {
      if (!searchDate) {
        return true;
      }

      return achievement.achievement_date === searchDate;
    })
    .sort((first, second) => {
      const firstDate = new Date(first.created_at || 0);
      const secondDate = new Date(second.created_at || 0);

      return secondDate - firstDate;
    });

  const availableDates = [
    ...new Set(
      achievements
        .map((achievement) => achievement.achievement_date)
        .filter(Boolean)
    ),
  ].sort((first, second) => second.localeCompare(first));

  const weeklyDays = [
    { name: "السبت", offset: 0 },
    { name: "الأحد", offset: 1 },
    { name: "الإثنين", offset: 2 },
    { name: "الثلاثاء", offset: 3 },
    { name: "الأربعاء", offset: 4 },
    { name: "الخميس", offset: 5 },
    { name: "الجمعة", offset: 6 },
  ];

  const weeklyBars = weeklyDays.map((day) => {
    const currentDay = new Date(weekStart);

    currentDay.setDate(currentDay.getDate() + day.offset);

    const dateString = getLocalDateString(currentDay);

    const count = weekAchievements.filter(
      (achievement) =>
        achievement.achievement_date === dateString
    ).length;

    return {
      ...day,
      dateString,
      count,
    };
  });

  const highestWeeklyCount = Math.max(
    ...weeklyBars.map((day) => day.count),
    1
  );

  function clearSearch() {
    setSearchText("");
    setSearchDate("");
  }

  function openSummary(title, items) {
    setSummaryView({
      title,
      items,
    });
  }

  function handleViewFromLog(achievement) {
    setShowAchievementsLog(false);
    onViewAchievement(achievement);
  }

  function handleEditFromLog(achievement) {
    setShowAchievementsLog(false);
    onEditAchievement(achievement);
  }

  async function handleDeleteFromLog(achievementId) {
    await onDeleteAchievement(achievementId);
  }

  return (
    <div className="dashboard-page" dir="rtl">
      <button
        type="button"
        className="floating-achievement-button"
        onClick={onAddAchievement}
        title="أضف إنجازك اليوم"
      >
        <Plus size={23} />
        <span>إنجازي</span>
      </button>

      <header className="top-bar">
        <div className="brand">
          <div className="brand-logo" title="أثَر">
            <Sparkles size={23} />
          </div>

          <div>
            <strong>أثَر</strong>
            <small>رحلتك المهنية</small>
          </div>
        </div>

        <div className="account-area">
          <span>مساحتك آمنة وخاصة</span>

          <button type="button" onClick={onLogout}>
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="dashboard-container">
        <section className="welcome-box">
          <div>
            <p className="welcome-label">
              مساحتك المهنية، في مكان واحد
            </p>

            <h1>
              صباح الخير، {userName}
              <span>!</span>
            </h1>

            <p className="welcome-description">
              وثّق إنجازاتك اليوم، ودع أثرك المهني يكبر خطوة بعد خطوة.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            icon={Target}
            title="إنجازات اليوم"
            number={todayAchievements.length}
            description="اضغط لعرض إنجازات اليوم"
            color="green"
            progress={todayAchievements.length * 25}
            onClick={() =>
              openSummary(
                "إنجازات اليوم",
                todayAchievements
              )
            }
          />

          <StatCard
            icon={TrendingUp}
            title="ملخص الأسبوع"
            number={weekAchievements.length}
            description="اضغط لعرض إنجازات الأسبوع"
            color="orange"
            progress={weekAchievements.length * 10}
            onClick={() =>
              openSummary(
                "إنجازات الأسبوع",
                weekAchievements
              )
            }
          />

          <StatCard
            icon={BarChart3}
            title="ملخص الشهر"
            number={monthAchievements.length}
            description="اضغط لعرض إنجازات الشهر"
            color="purple"
            progress={monthAchievements.length * 10}
            onClick={() =>
              openSummary(
                "إنجازات الشهر",
                monthAchievements
              )
            }
          />

          <StatCard
            icon={CalendarDays}
            title="ملخص السنة"
            number={yearAchievements.length}
            description="اضغط لعرض إنجازات السنة"
            color="blue"
            progress={yearAchievements.length * 2}
            onClick={() =>
              openSummary(
                `إنجازات سنة ${now.getFullYear()}`,
                yearAchievements
              )
            }
          />

          <div className="stat-card streak-card">
            <div className="stat-icon green">
              <Clock3 size={22} />
            </div>

            <p className="stat-title">
              إجمالي الإنجازات
            </p>

            <h3>
              {achievements.length}
              <small> إنجاز</small>
            </h3>

            <p className="stat-description">
              <CheckCircle2 size={15} />
              كل أعمالك محفوظة بأمان
            </p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>نشاطك خلال الأسبوع</h2>
                <p>
                  عدد الإنجازات التي وثّقتها في كل يوم
                </p>
              </div>

              <span>{weekAchievements.length} إنجاز</span>
            </div>

            <div className="chart">
              {weeklyBars.map((day) => {
                const barHeight =
                  day.count === 0
                    ? 8
                    : Math.max(
                        Math.round(
                          (day.count / highestWeeklyCount) * 100
                        ),
                        18
                      );

                return (
                  <div
                    className="chart-column"
                    key={day.dateString}
                  >
                    <strong className="chart-count">
                      {day.count}
                    </strong>

                    <div
                      className="chart-bar"
                      style={{
                        height: `${barHeight}%`,
                      }}
                      title={`${day.name}: ${day.count} إنجاز`}
                    />

                    <small>{day.name}</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel monthly-goal">
            <div className="panel-heading">
              <div>
                <h2>تقدمك الشهري</h2>
                <p>
                  ملخص إنجازاتك خلال الشهر الحالي
                </p>
              </div>

              <div className="goal-icon">
                <Target size={21} />
              </div>
            </div>

            <div className="monthly-progress-simple">
              <div className="monthly-number">
                {monthAchievements.length}
              </div>

              <div>
                <h3>إنجاز موثّق</h3>

                <p>
                  مجموع الإنجازات التي وثّقتها
                    

                  خلال الشهر الحالي.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="monthly-view-button"
              onClick={() =>
                openSummary(
                  "إنجازات الشهر",
                  monthAchievements
                )
              }
            >
              عرض إنجازات الشهر
              <ChevronLeft size={17} />
            </button>
          </div>
        </section>

        <section className="achievement-log-launcher">
          <div className="achievement-log-icon">
            <Archive size={25} />
          </div>

          <div className="achievement-log-content">
            <h2>سجل إنجازاتك</h2>

            <p>
              استعرض وابحث في جميع الأعمال التي وثّقتها.
            </p>

            <span>
              {achievements.length} إنجاز محفوظ
            </span>
          </div>

          <button
            type="button"
            className="open-achievements-log-button"
            onClick={() => setShowAchievementsLog(true)}
          >
            <Archive size={17} />
            <span>فتح سجل الإنجازات</span>
            <ChevronLeft size={18} />
          </button>
        </section>

        <div className="dashboard-hint">
          <CalendarDays size={18} />

          <span>
            يتم احتساب المؤشرات تلقائيًا حسب تاريخ كل إنجاز.
          </span>
        </div>
      </main>

      <SummaryModal
        summary={summaryView}
        onClose={() => setSummaryView(null)}
        onViewAchievement={onViewAchievement}
      />

      {showAchievementsLog && (
        <AchievementLogModal
          achievements={achievements}
          filteredAchievements={filteredAchievements}
          searchText={searchText}
          searchDate={searchDate}
          setSearchText={setSearchText}
          setSearchDate={setSearchDate}
          availableDates={availableDates}
          onClearSearch={clearSearch}
          onClose={() => setShowAchievementsLog(false)}
          onViewAchievement={handleViewFromLog}
          onEditAchievement={handleEditFromLog}
          onDeleteAchievement={handleDeleteFromLog}
        />
      )}
    </div>
  );
}

export default Dashboard;
