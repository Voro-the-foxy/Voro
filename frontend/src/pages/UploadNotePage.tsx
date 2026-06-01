import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { File as FileIcon, Info, Upload, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  deleteClassWithMaterialsDeep,
  loadClasses,
  type ClassItem,
} from "@/lib/classes";
import { listNotesByClass, uploadNote, type Note } from "@/lib/notes";

type Mode = "new" | "existing";
type UploadState = "idle" | "uploading" | "succeeded" | "failed";
type Phase = "idle" | "anim" | "text";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function UploadNotePage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [notesByClass, setNotesByClass] = useState<Record<string, Note[]>>({});

  useEffect(() => {
    loadClasses()
      .then((cs) => {
        setClasses(cs);
        cs.forEach((c) => {
          listNotesByClass(c.id)
            .then((notes) =>
              setNotesByClass((prev) => ({ ...prev, [c.id]: notes })),
            )
            .catch(() => {});
        });
      })
      .catch(() => {});
  }, []);
  const [mode, setMode] = useState<Mode>("existing");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [deleteOptionsClassId, setDeleteOptionsClassId] = useState<
    string | null
  >(null);
  const [deleteCheckedClassId, setDeleteCheckedClassId] = useState<
    string | null
  >(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] =
    useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave =
    file !== null && uploadState !== "uploading" && selectedClassId !== null;

  const handleSave = async () => {
    if (!file || !selectedClassId) return;
    const classId = selectedClassId;

    setErrorMsg(null);
    setPhase("anim");
    setUploadState("uploading");

    try {
      await uploadNote({ classId, file });
      setUploadState("succeeded");
    } catch (e) {
      setUploadState("failed");
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };

  useEffect(() => {
    if (phase === "text" && uploadState === "succeeded") {
      const t = setTimeout(() => navigate({ to: "/home" }), 1800);
      return () => clearTimeout(t);
    }
  }, [phase, uploadState, navigate]);

  const dismissError = () => {
    setPhase("idle");
    setUploadState("idle");
    setErrorMsg(null);
  };

  const handleSelectClass = (id: string) => {
    setSelectedClassId(id);
    if (selectedClassId !== id) {
      setDeleteOptionsClassId(null);
      setDeleteCheckedClassId(null);
      setDeleteError(null);
    }
  };

  const handleDeleteClass = async (target: ClassItem) => {
    if (deleteCheckedClassId !== target.id) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteClassWithMaterialsDeep(target.id);
      const nextClasses = classes.filter((c) => c.id !== target.id);
      setClasses(nextClasses);
      setSelectedClassId(null);
      setDeleteOptionsClassId(null);
      setDeleteCheckedClassId(null);
      setConfirmDeleteTarget(null);
      if (nextClasses.length === 0) setMode("new");
      if (result.failedDocumentIds.length > 0) {
        setDeleteError("Some materials could not be deleted from the server.");
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (phase !== "idle") {
    return (
      <div className="flex flex-col h-full bg-paper text-black items-center justify-center px-6">
        {uploadState === "failed" ? (
          <ErrorOverlay
            message={errorMsg ?? "Upload failed"}
            onDismiss={dismissError}
          />
        ) : phase === "anim" ? (
          <DotLottieReact
            src="/voro_1.lottie"
            autoplay
            loop={false}
            dotLottieRefCallback={(dotLottie) => {
              if (!dotLottie) return;
              dotLottie.addEventListener("complete", () => setPhase("text"));
            }}
            style={{ width: 260, height: 260 }}
          />
        ) : uploadState === "succeeded" ? (
          <p className="text-3xl font-bold text-black text-center leading-tight">
            Voro devoured
            <br />
            your notes..!
          </p>
        ) : (
          <p className="text-base text-gray-700 text-center">
            Voro is digesting your notes…
            <br />
            <span className="text-xs text-gray-500">
              Analyzing &amp; embedding notes…
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-paper text-black">
      <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black shrink-0">
        <h1 className="text-base font-medium">Upload note</h1>
        <Link to="/home" aria-label="Close" className="p-1 -mr-1">
          <X className="w-5 h-5" />
        </Link>
      </header>

      <div
        className={`flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6 transition-opacity ${
          confirmDeleteTarget ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <section>
          <h2 className="text-xs font-medium text-gray-700 mb-2">Lecture</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ModeTab
              label="New lecture"
              active={mode === "new"}
              onClick={() => setMode("new")}
            />
            <ModeTab
              label="Existing lecture"
              active={mode === "existing"}
              onClick={() => setMode("existing")}
            />
          </div>

          {mode === "new" ? (
            <Link
              to="/set-up/schedule"
              search={{ from: "upload" }}
              className="w-full flex items-center justify-between px-3 py-3 border-2 border-black rounded-sm text-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-paper hover:bg-paper-dark active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
            >
              <span>Create new lecture in schedule</span>
              <span>→</span>
            </Link>
          ) : classes.filter((c) => c.slots.length > 0).length === 0 ? (
            <div className="px-3 py-4 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 text-center flex flex-col gap-2">
              <span>No scheduled lectures.</span>
              <Link
                to="/set-up/schedule"
                search={{ from: "upload" }}
                className="text-black underline text-xs"
              >
                Set up a lecture in the schedule first
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {classes
                .filter((c) => c.slots.length > 0)
                .map((c) => (
                  <li key={c.id}>
                    <ExistingClassRow
                      name={c.name}
                      noteCount={(notesByClass[c.id] ?? []).length}
                      selected={selectedClassId === c.id}
                      onSelect={() => handleSelectClass(c.id)}
                    />
                    {selectedClassId === c.id && (
                      <SelectedClassActions
                        className={c.name}
                        noteCount={(notesByClass[c.id] ?? []).length}
                        expanded={deleteOptionsClassId === c.id}
                        checked={deleteCheckedClassId === c.id}
                        deleting={deleting}
                        onReveal={() => {
                          setDeleteError(null);
                          setDeleteOptionsClassId(c.id);
                        }}
                        onToggleCheck={() =>
                          setDeleteCheckedClassId((current) =>
                            current === c.id ? null : c.id,
                          )
                        }
                        onDelete={() => setConfirmDeleteTarget(c)}
                      />
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xs font-medium text-gray-700 mb-2">
            Note file (PDF)
          </h2>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-3 border-2 border-black rounded-sm text-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-paper hover:bg-paper-dark"
          >
            {file ? (
              <>
                <FileIcon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {formatSize(file.size)}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left text-gray-500">
                  Choose a PDF
                </span>
              </>
            )}
          </button>
        </section>

        {deleteError && (
          <div className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700">
            {deleteError}
          </div>
        )}
      </div>

      {confirmDeleteTarget ? (
        <div className="shrink-0 border-t-2 border-black bg-paper px-5 pt-4 pb-6 flex flex-col gap-3">
          <p className="text-sm font-medium">Delete this class?</p>
          <p className="text-xs leading-relaxed text-gray-600">
            {confirmDeleteTarget.name} and{" "}
            {(notesByClass[confirmDeleteTarget.id] ?? []).length} note
            {(notesByClass[confirmDeleteTarget.id] ?? []).length !== 1
              ? "s"
              : ""}{" "}
            will be permanently deleted.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!deleting) setConfirmDeleteTarget(null);
              }}
              disabled={deleting}
              className="h-11 rounded-sm border-2 border-black text-sm bg-paper hover:bg-paper-dark sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClass(confirmDeleteTarget)}
              disabled={deleting}
              className="h-11 rounded-sm border-2 border-red-600 bg-red-600 text-sm text-white sketch shadow-[2px_2px_0_0_rgba(220,38,38,0.5)] disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <footer className="px-5 pb-5 shrink-0 flex flex-col gap-2">
          {!canSave && !deleting && (
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Each lecture needs at least 1 note.
            </p>
          )}
          <button
            disabled={!canSave || deleting}
            onClick={handleSave}
            className="w-full py-3 rounded-sm border-2 border-black bg-black text-white text-sm font-medium sketch shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none"
          >
            Save
          </button>
        </footer>
      )}
    </div>
  );
}

function ErrorOverlay({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-xs">
      <p className="text-base text-red-700 text-center">{message}</p>
      <button
        onClick={onDismiss}
        className="px-4 py-2 border border-black rounded-md text-sm"
      >
        Try again
      </button>
    </div>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 border-2 rounded-sm text-sm sketch ${
        active
          ? "bg-black text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
          : "bg-paper text-black border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-paper-dark"
      }`}
    >
      {label}
    </button>
  );
}

function ExistingClassRow({
  name,
  noteCount,
  selected,
  onSelect,
}: {
  name: string;
  noteCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 border-2 rounded-sm text-sm text-left sketch ${
        selected
          ? "border-black bg-paper-dark shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          : "border-black bg-paper shadow-[2px_2px_0_0_rgba(0,0,0,0.4)] hover:bg-paper-dark"
      }`}
    >
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-full border ${
          selected ? "border-black" : "border-gray-400"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-black" />}
      </span>
      <span className="flex-1 truncate">{name}</span>
      {noteCount === 0 ? (
        <span className="text-[10px] text-gray-400">no notes</span>
      ) : (
        <span className="text-[10px] text-gray-400">
          {noteCount} note{noteCount !== 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}

function SelectedClassActions({
  className,
  noteCount,
  expanded,
  checked,
  deleting,
  onReveal,
  onToggleCheck,
  onDelete,
}: {
  className: string;
  noteCount: number;
  expanded: boolean;
  checked: boolean;
  deleting: boolean;
  onReveal: () => void;
  onToggleCheck: () => void;
  onDelete: () => void;
}) {
  if (!expanded) {
    return (
      <div className="mt-1 flex justify-end pr-1">
        <button
          type="button"
          onClick={onReveal}
          className="rounded-md border border-gray-300 bg-paper px-2 py-1 text-[10px] text-gray-500 shadow-[1px_1px_0_0_rgba(0,0,0,0.25)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          Manage notes
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex justify-end pr-1">
      <div className="w-fit max-w-full rounded-md border border-black bg-paper px-2.5 py-2 text-[10px] text-gray-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
        <p className="mb-1.5 text-right leading-tight">
          {noteCount} note{noteCount !== 1 ? "s" : ""} will also be deleted
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onToggleCheck}
            aria-pressed={checked}
            className="flex items-center gap-1 rounded-sm border border-gray-300 bg-paper px-1.5 py-1 hover:border-black"
          >
            <span
              className={[
                "flex h-4 w-4 items-center justify-center border text-xs leading-none",
                checked
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-transparent",
              ].join(" ")}
            >
              ×
            </span>
            <span className="max-w-[140px] truncate">{className}</span>
          </button>
          <button
            type="button"
            disabled={!checked || deleting}
            onClick={onDelete}
            className="rounded-sm border border-red-600 px-1.5 py-1 text-[10px] text-red-600 disabled:border-gray-200 disabled:text-gray-300"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadNotePage;
