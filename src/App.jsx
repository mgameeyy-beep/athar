import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Auth from "./Auth";
import Dashboard from "./Dashboard";
import AchievementForm from "./AchievementForm";
import AchievementDetails from "./AchievementDetails";
import DailyNotes from "./DailyNotes";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [achievements, setAchievements] = useState([]);

  const [showAchievementForm, setShowAchievementForm] =
    useState(false);

  const [editingAchievement, setEditingAchievement] =
    useState(null);

  const [viewingAchievement, setViewingAchievement] =
    useState(null);

  useEffect(() => {
    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (!currentUser) {
          setAchievements([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadAchievements(user.id);
    }
  }, [user?.id]);

  async function loadCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Load user error:", error);
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(data?.user || null);
    setLoading(false);
  }

  async function loadAchievements(userId) {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load achievements error:", error);
      return;
    }

    setAchievements(data || []);
  }

  function handleAddAchievement() {
    setEditingAchievement(null);
    setShowAchievementForm(true);
  }

  function handleEditAchievement(achievement) {
    setEditingAchievement(achievement);
    setShowAchievementForm(true);
  }

  function handleViewAchievement(achievement) {
    setViewingAchievement(achievement);
  }

  function handleCloseAchievementForm() {
    setEditingAchievement(null);
    setShowAchievementForm(false);
  }

  function handleAchievementSaved(savedAchievement) {
    setAchievements((currentAchievements) => {
      const exists = currentAchievements.some(
        (achievement) =>
          achievement.id === savedAchievement.id
      );

      if (exists) {
        return currentAchievements.map((achievement) =>
          achievement.id === savedAchievement.id
            ? savedAchievement
            : achievement
        );
      }

      return [savedAchievement, ...currentAchievements];
    });

    setEditingAchievement(null);
    setShowAchievementForm(false);
  }

  async function handleDeleteAchievement(achievementId) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الإنجاز؟"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", achievementId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete achievement error:", error);
      alert("تعذر حذف الإنجاز.");
      return;
    }

    setAchievements((currentAchievements) =>
      currentAchievements.filter(
        (achievement) => achievement.id !== achievementId
      )
    );

    if (viewingAchievement?.id === achievementId) {
      setViewingAchievement(null);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("تعذر تسجيل الخروج.");
      return;
    }

    setUser(null);
    setAchievements([]);
    setShowAchievementForm(false);
    setEditingAchievement(null);
    setViewingAchievement(null);
  }

  if (loading) {
    return (
      <div className="loading-page" dir="rtl">
        جارٍ تحميل أثَر...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Dashboard
        user={user}
        achievements={achievements}
        onAddAchievement={handleAddAchievement}
        onViewAchievement={handleViewAchievement}
        onEditAchievement={handleEditAchievement}
        onDeleteAchievement={handleDeleteAchievement}
        onLogout={handleLogout}
      />

      <DailyNotes user={user} />

      {showAchievementForm && (
        <AchievementForm
          user={user}
          achievement={editingAchievement}
          onClose={handleCloseAchievementForm}
          onSaved={handleAchievementSaved}
        />
      )}

      {viewingAchievement && (
        <AchievementDetails
          achievement={viewingAchievement}
          onClose={() => setViewingAchievement(null)}
        />
      )}
    </>
  );
}

export default App;
