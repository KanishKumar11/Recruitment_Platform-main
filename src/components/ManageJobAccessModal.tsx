"use client";

import { useEffect, useMemo, useState } from "react";
import { useGetUsersQuery } from "@/app/store/services/adminApi";
import {
  useGetJobAccessControlQuery,
  useUpdateJobAccessControlMutation,
} from "@/app/store/services/jobsApi";
import { FaBan, FaCheck, FaChevronLeft, FaSearch, FaTimes } from "react-icons/fa";

interface ManageJobAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  jobCode?: string;
}

interface RecruiterRow {
  id: string;
  name: string;
  email: string;
  companyName?: string;
}

const VisibilityCopy: Record<"ALL" | "SELECTED", string> = {
  ALL: "All recruiters can view this job. Use blocks to hide it from specific recruiters.",
  SELECTED: "Only the recruiters you select can view this job. Others are blocked.",
};

export default function ManageJobAccessModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  jobCode,
}: ManageJobAccessModalProps) {
  const [mode, setMode] = useState<"ALL" | "SELECTED">("ALL");
  const [allowed, setAllowed] = useState<RecruiterRow[]>([]);
  const [blocked, setBlocked] = useState<RecruiterRow[]>([]);
  const [search, setSearch] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    data: accessData,
    refetch: refetchAccess,
  } = useGetJobAccessControlQuery(jobId, { skip: !isOpen });

  // Cast role to any to avoid client-side dependency on server-side enum type
  // (the API expects a UserRole enum imported from server models)
  const recruiterQueryParams = {
    role: "RECRUITER" as any,
    page: 1,
    limit: 20,
    search: search || undefined,
  };

  const {
    data: recruitersData,
    isLoading: recruitersLoading,
  } = useGetUsersQuery(recruiterQueryParams, { skip: !isOpen });

  const [updateAccess, { isLoading: isSaving }]
    = useUpdateJobAccessControlMutation();

  useEffect(() => {
    if (!isOpen) return;
    if (accessData) {
      setMode(accessData.visibility || "ALL");
      setAllowed(accessData.allowedRecruiters || []);
      setBlocked(accessData.blockedRecruiters || []);
    }
  }, [accessData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSaveError(null);
    }
  }, [isOpen]);

  const recruiterOptions = useMemo<RecruiterRow[]>(() => {
    if (!recruitersData?.users) return [];
    return recruitersData.users
      .map((user: any) => ({
        id: user.id || user._id || "",
        name: user.name,
        email: user.email,
        companyName: user.companyName || user.recruiterCompanyName,
      }))
      .filter((user) => user.id);
  }, [recruitersData]);

  const addAllowed = (user: RecruiterRow) => {
    setAllowed((prev) => {
      if (prev.some((r) => r.id === user.id)) return prev;
      return [...prev, user];
    });
    setBlocked((prev) => prev.filter((r) => r.id !== user.id));
  };

  const addBlocked = (user: RecruiterRow) => {
    setBlocked((prev) => {
      if (prev.some((r) => r.id === user.id)) return prev;
      return [...prev, user];
    });
    setAllowed((prev) => prev.filter((r) => r.id !== user.id));
  };

  const removeAllowed = (id: string) =>
    setAllowed((prev) => prev.filter((r) => r.id !== id));
  const removeBlocked = (id: string) =>
    setBlocked((prev) => prev.filter((r) => r.id !== id));

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updateAccess({
        jobId,
        visibility: mode,
        allowedRecruiterIds: allowed.map((r) => r.id),
        blockedRecruiterIds: blocked.map((r) => r.id),
      }).unwrap();
      await refetchAccess();
      onClose();
    } catch (err: any) {
      setSaveError(err?.data?.error || "Failed to update access");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Job Access Control
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              {jobTitle}
              {jobCode ? (
                <span className="ml-2 text-sm text-gray-500">{jobCode}</span>
              ) : null}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition shadow-sm ${
                mode === "ALL"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setMode("ALL")}
            >
              <div className="mt-1 text-indigo-600">
                <FaChevronLeft className="rotate-180" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Open to all recruiters
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Use the block list to hide this job from specific recruiters.
                </p>
              </div>
            </button>

            <button
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition shadow-sm ${
                mode === "SELECTED"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setMode("SELECTED")}
            >
              <div className="mt-1 text-indigo-600">
                <FaCheck />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Only selected recruiters
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Add the recruiters who are allowed to view and work on this job.
                </p>
              </div>
            </button>

            <div className="p-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Current rule</p>
              <p className="mt-2 text-sm text-gray-700">{VisibilityCopy[mode]}</p>
              {mode === "SELECTED" ? (
                <p className="mt-2 text-xs text-gray-500">
                  This job will be hidden from all other recruiters.
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">
                  Recruiters in the block list will not see the job in their feed.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Find recruiters</p>
                <p className="text-xs text-gray-600">Search by name, email, or company.</p>
              </div>
              <div className="flex items-center w-full md:w-96 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                <FaSearch className="text-gray-400 mr-2" />
                <input
                  type="text"
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="Start typing to search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recruitersLoading ? (
                <div className="col-span-2 text-sm text-gray-500">Loading recruiters...</div>
              ) : recruiterOptions.length === 0 ? (
                <div className="col-span-2 text-sm text-gray-500">
                  {search ? "No recruiters match that search" : "Start typing to search recruiters"}
                </div>
              ) : (
                recruiterOptions.map((user) => {
                  const alreadyAllowed = allowed.some((r) => r.id === user.id);
                  const alreadyBlocked = blocked.some((r) => r.id === user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        {user.companyName ? (
                          <p className="text-xs text-gray-500 mt-1">{user.companyName}</p>
                        ) : null}
                      </div>
                      {mode === "SELECTED" ? (
                        <button
                          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
                            alreadyAllowed
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-green-600 text-green-700 hover:bg-green-50"
                          }`}
                          onClick={() => addAllowed(user)}
                        >
                          {alreadyAllowed ? "Allowed" : "Allow"}
                        </button>
                      ) : (
                        <button
                          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
                            alreadyBlocked
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-red-600 text-red-700 hover:bg-red-50"
                          }`}
                          onClick={() => addBlocked(user)}
                        >
                          {alreadyBlocked ? "Blocked" : "Block"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">
                  {mode === "SELECTED" ? "Allowed recruiters" : "Blocked recruiters"}
                </p>
                {mode === "SELECTED" ? (
                  <span className="text-xs text-gray-500">{allowed.length} selected</span>
                ) : (
                  <span className="text-xs text-gray-500">{blocked.length} blocked</span>
                )}
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(mode === "SELECTED" ? allowed : blocked).length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {mode === "SELECTED"
                      ? "No recruiters are allowed yet."
                      : "No recruiters are blocked."}
                  </p>
                ) : (
                  (mode === "SELECTED" ? allowed : blocked).map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{rec.name}</p>
                        <p className="text-xs text-gray-600">{rec.email}</p>
                        {rec.companyName ? (
                          <p className="text-xs text-gray-500">{rec.companyName}</p>
                        ) : null}
                      </div>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          mode === "SELECTED"
                            ? removeAllowed(rec.id)
                            : removeBlocked(rec.id)
                        }
                        aria-label="Remove recruiter"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 mb-3">Live status</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <FaCheck className="text-green-600" />
                  {mode === "ALL"
                    ? "All recruiters can view this job"
                    : "Only selected recruiters can view this job"}
                </li>
                <li className="flex items-center gap-2">
                  <FaBan className="text-red-500" />
                  {mode === "ALL"
                    ? `${blocked.length} recruiter${blocked.length === 1 ? " is" : "s are"} blocked`
                    : "All other recruiters are blocked"}
                </li>
                {mode === "SELECTED" ? (
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <FaChevronLeft className="rotate-180" />
                    Add at least one recruiter to keep the job visible.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          {saveError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {saveError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            <p className="text-xs text-gray-600">
              Changes apply immediately to recruiter job feeds and saved lists.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={isSaving || (mode === "SELECTED" && allowed.length === 0)}
            >
              {isSaving ? "Saving..." : "Save access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
