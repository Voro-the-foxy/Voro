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
    <div className="flex flex-col h-full bg-paper text-black">
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
        <div className="flex items-center gap-4 px-4 py-4 border-2 border-black rounded-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-paper">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black text-lg font-semibold shrink-0 sketch">
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
            className="flex items-center gap-3 w-full px-4 py-3 rounded-sm border-2 border-black text-sm text-black hover:bg-paper-dark sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-paper"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Danger Zone — GitHub style */}
        <div className="rounded-sm border-2 border-red-500 sketch shadow-[3px_3px_0_0_rgba(220,38,38,0.5)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-red-400 bg-red-50">
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
          <div className="mx-6 w-full max-w-sm rounded-sm border-2 border-black bg-paper px-6 py-6 sketch shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-semibold">
                Delete account?
              </h2>
            </div>
            <p className="mb-6 text-xs text-gray-500 leading-relaxed">
              All your data will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-sm border-2 border-black py-2.5 text-sm hover:bg-paper-dark sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-sm border-2 border-red-600 bg-red-500 py-2.5 text-sm text-white hover:bg-red-600 sketch shadow-[2px_2px_0_0_rgba(220,38,38,0.5)] disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
