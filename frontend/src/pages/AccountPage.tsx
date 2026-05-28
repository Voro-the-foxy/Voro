import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, AlertTriangle, Trash2 } from "lucide-react";
import { loadSession, logout, deleteAccount } from "@/lib/auth";

function AccountPage() {
  const navigate = useNavigate();
  const session = loadSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initial = session?.user.name?.slice(0, 1).toUpperCase() ?? "?";

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/login" });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await navigate({ to: "/login" });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-black">
        <button
          onClick={() => void navigate({ to: "/mypage" })}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold">Account</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {/* User info */}
        <div className="flex items-center gap-4 px-4 py-4 border border-black rounded-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black text-lg font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold truncate">
              {session?.user.name ?? "—"}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {session?.user.email ?? "—"}
            </span>
            <span className="inline-flex items-center self-start rounded-full border border-black px-2 py-0.5 text-[10px] font-medium leading-none mt-0.5">
              Voro Learner
            </span>
          </div>
        </div>

        {/* Logout */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 px-1">
            Session
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Danger Zone — GitHub style */}
        <div className="rounded-md border border-red-300 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-300 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              Danger Zone
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">Delete this account</span>
              <span className="text-xs text-gray-500 leading-relaxed">
                Once you delete your account, there is no going back. Please be
                certain.
              </span>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="shrink-0 rounded-md border border-red-400 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-black bg-white px-6 py-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-semibold">
                계정을 삭제하시겠습니까?
              </h2>
            </div>
            <p className="mb-6 text-xs text-gray-500 leading-relaxed">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수
              없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-black py-2.5 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
