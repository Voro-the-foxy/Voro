import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { File as FileIcon, Upload, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { addClass, loadClasses, type ClassItem } from "@/lib/classes";
import { addNote } from "@/lib/notes";

// MOCK: nothing is actually uploaded. The picked File's bytes are discarded;
// only its filename + size are saved to localStorage via lib/notes. See the
// TODO(backend) note in handleSave for the real multipart upload to wire later.

type Mode = "new" | "existing";

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
  const [phase, setPhase] = useState<"idle" | "anim" | "text">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave =
    file !== null &&
    (mode === "new" ? newName.trim().length > 0 : selectedClassId !== null);

  const handleSave = () => {
    if (!file) return;
    let classId: string;
    if (mode === "new") {
      const name = newName.trim();
      if (!name) return;
      // TODO(backend): POST /api/classes
      //                Body: { name } → ClassItem (server-assigned id).
      classId = addClass(name).id;
    } else {
      if (!selectedClassId) return;
      classId = selectedClassId;
    }
    // TODO(backend): POST /api/notes (multipart/form-data)
    //                Form: { classId, file: File }
    //                Response: Note. The current call only sends metadata
    //                (filename, size) — once wired, attach the actual `file`
    //                object so the backend stores the bytes too.
    addNote({ classId, filename: file.name, size: file.size });
    setPhase("anim");
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
          <h2 className="text-xs font-medium text-gray-700 mb-2">Note file</h2>
          <input
            ref={fileRef}
            type="file"
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
                <span className="flex-1 text-left text-gray-500">Choose a file</span>
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
          {phase === "anim" ? (
            <DotLottieReact
              src="/voro_1.lottie"
              autoplay
              loop={false}
              dotLottieRefCallback={(dotLottie) => {
                if (!dotLottie) return;
                dotLottie.addEventListener("complete", () => {
                  setPhase("text");
                  setTimeout(() => navigate({ to: "/home" }), 1800);
                });
              }}
              style={{ width: 260, height: 260 }}
            />
          ) : (
            <p className="text-3xl font-bold text-black text-center leading-tight">
              Voro devoured
              <br />
              your notes..!
            </p>
          )}
        </div>
      )}
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
