import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { File as FileIcon, Upload, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { addClass, loadClasses, type ClassItem } from "@/lib/classes";
import { uploadNote } from "@/lib/notes";

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
  const [classes] = useState<ClassItem[]>(loadClasses);
  const [mode, setMode] = useState<Mode>(classes.length === 0 ? "new" : "existing");
  const [newName, setNewName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave =
    file !== null &&
    uploadState !== "uploading" &&
    (mode === "new" ? newName.trim().length > 0 : selectedClassId !== null);

  const handleSave = async () => {
    if (!file) return;
    let classId: string;
    if (mode === "new") {
      const name = newName.trim();
      if (!name) return;
      classId = addClass(name).id;
    } else {
      if (!selectedClassId) return;
      classId = selectedClassId;
    }

    setErrorMsg(null);
    setPhase("anim");
    setUploadState("uploading");

    try {
      await uploadNote({ classId, file });
      setUploadState("succeeded");
    } catch (e) {
      setUploadState("failed");
      setErrorMsg(e instanceof Error ? e.message : "업로드에 실패했습니다");
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

  return (
    <div className="relative flex flex-col h-full bg-white text-black">
      <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black">
        <h1 className="text-base font-medium">Upload note</h1>
        <Link to="/home" aria-label="Close" className="p-1 -mr-1">
          <X className="w-5 h-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        <section>
          <h2 className="text-xs font-medium text-gray-700 mb-2">Lecture</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ModeTab label="New lecture" active={mode === "new"} onClick={() => setMode("new")} />
            <ModeTab
              label="Existing lecture"
              active={mode === "existing"}
              onClick={() => setMode("existing")}
            />
          </div>

          {mode === "new" ? (
            <input
              type="text"
              placeholder="Lecture name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-black rounded-lg text-sm focus:outline-none"
            />
          ) : classes.length === 0 ? (
            <p className="px-3 py-4 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 text-center">
              No lectures yet. Switch to "New lecture" to create one.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {classes.map((c) => (
                <li key={c.id}>
                  <ExistingClassRow
                    name={c.name}
                    selected={selectedClassId === c.id}
                    onSelect={() => setSelectedClassId(c.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xs font-medium text-gray-700 mb-2">Note file (PDF)</h2>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-3 border border-black rounded-lg text-sm"
          >
            {file ? (
              <>
                <FileIcon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left truncate">{file.name}</span>
                <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left text-gray-500">Choose a PDF</span>
              </>
            )}
          </button>
        </section>
      </div>

      <footer className="px-5 pb-5">
        <button
          disabled={!canSave}
          onClick={handleSave}
          className="w-full py-3 rounded-xl border border-black bg-black text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200"
        >
          Save
        </button>
      </footer>

      {phase !== "idle" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
          {uploadState === "failed" ? (
            <ErrorOverlay message={errorMsg ?? "업로드 실패"} onDismiss={dismissError} />
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
              <span className="text-xs text-gray-500">자료 분석 + 임베딩 중</span>
            </p>
          )}
        </div>
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
      className={`py-2 border rounded-lg text-sm transition-colors ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-black border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function ExistingClassRow({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
        selected ? "border-black bg-gray-50" : "border-gray-300 bg-white"
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
    </button>
  );
}

export default UploadNotePage;
