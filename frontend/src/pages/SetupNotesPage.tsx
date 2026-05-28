import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { File as FileIcon, Info, Upload, X } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadClasses, type ClassItem } from "@/lib/classes";
import { listNotesByClass, uploadNote } from "@/lib/notes";
import { markStepDone } from "@/lib/setup";

type UploadState = "idle" | "uploading" | "succeeded" | "failed";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function SetupNotesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [noteCount, setNoteCount] = useState<Record<string, number>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [phase, setPhase] = useState<"idle" | "anim" | "text">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClasses()
      .then((cs) => {
        setClasses(cs);
        cs.forEach((c) =>
          listNotesByClass(c.id)
            .then((notes) =>
              setNoteCount((prev) => ({ ...prev, [c.id]: notes.length })),
            )
            .catch(() => {}),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase === "text" && uploadState === "succeeded") {
      const t = setTimeout(() => navigate({ to: "/welcome" }), 1800);
      return () => clearTimeout(t);
    }
  }, [phase, uploadState, navigate]);

  const canSave =
    file !== null && selectedClassId !== null && uploadState !== "uploading";

  const handleSave = async () => {
    if (!file || !selectedClassId) return;
    setErrorMsg(null);
    setPhase("anim");
    setUploadState("uploading");
    try {
      await uploadNote({ classId: selectedClassId, file });
      await markStepDone("notes");
      setUploadState("succeeded");
    } catch (e) {
      setUploadState("failed");
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };

  if (phase !== "idle") {
    return (
      <div className="flex flex-col h-full bg-white text-black items-center justify-center px-6">
        {uploadState === "failed" ? (
          <div className="flex flex-col items-center gap-4 max-w-xs">
            <p className="text-base text-red-700 text-center">
              {errorMsg ?? "Upload failed"}
            </p>
            <button
              onClick={() => {
                setPhase("idle");
                setUploadState("idle");
                setErrorMsg(null);
              }}
              className="px-4 py-2 border border-black rounded-md text-sm"
            >
              Try again
            </button>
          </div>
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
        ) : (
          <p className="text-3xl font-bold text-black text-center leading-tight">
            Voro devoured
            <br />
            your notes..!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black shrink-0">
        <h1 className="text-base font-medium">Upload note</h1>
        <button
          onClick={() => window.history.back()}
          aria-label="Close"
          className="p-1 -mr-1"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        <section>
          <h2 className="text-xs font-medium text-gray-700 mb-2">Lecture</h2>
          {classes.filter((c) => c.slots.length > 0).length === 0 ? (
            <div className="px-3 py-4 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 text-center flex flex-col gap-2">
              <span>No scheduled lectures yet.</span>
              <button
                onClick={() => navigate({ to: "/set-up/schedule" })}
                className="text-black underline text-xs"
              >
                Set up your schedule in Step 1 first
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {classes
                .filter((c) => c.slots.length > 0)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedClassId(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
                        selectedClassId === c.id
                          ? "border-black bg-gray-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-full border ${selectedClassId === c.id ? "border-black" : "border-gray-400"}`}
                      >
                        {selectedClassId === c.id && (
                          <span className="w-2 h-2 rounded-full bg-black" />
                        )}
                      </span>
                      <span className="flex-1 truncate">{c.name}</span>
                      {noteCount[c.id] === undefined ? null : noteCount[
                          c.id
                        ] === 0 ? (
                        <span className="text-[10px] text-gray-400">
                          no notes
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          {noteCount[c.id]} note
                          {noteCount[c.id] !== 1 ? "s" : ""}
                        </span>
                      )}
                    </button>
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
            className="w-full flex items-center gap-3 px-3 py-3 border border-black rounded-lg text-sm"
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
      </div>

      <footer className="px-5 pb-5 shrink-0 flex flex-col gap-2">
        {!canSave && (
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            at least 1 note is required per class.
          </p>
        )}
        <button
          disabled={!canSave}
          onClick={handleSave}
          className="w-full py-3 rounded-xl border border-black bg-black text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200"
        >
          Save
        </button>
      </footer>
    </div>
  );
}

export default SetupNotesPage;
