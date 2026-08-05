import React, { useState } from 'react';
import { useAllEmployees, useEmployeeAssessments, SkillAssessment } from '@/hooks/useAssessment';
import { X, Search, Copy, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClone: (assessments: SkillAssessment[]) => void;
  currentEmployeeCode: string;
}

export const CloneColleagueDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onClone,
  currentEmployeeCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpCode, setSelectedEmpCode] = useState<string | null>(null);

  const { data: employees = [], isLoading: isLoadingEmployees } = useAllEmployees();
  const { data: assessments = [], isFetching: isFetchingAssessments } = useEmployeeAssessments(selectedEmpCode || '');

  // Reset state whenever modal opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedEmpCode(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees
    .filter((emp) => emp.emp_code !== currentEmployeeCode)
    .filter((emp) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        emp.full_name.toLowerCase().includes(q) ||
        emp.emp_code.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        (emp.current_grade?.title || '').toLowerCase().includes(q) ||
        (emp.current_grade?.code || '').toLowerCase().includes(q)
      );
    });

  const selectedEmployee = employees.find((e) => e.emp_code === selectedEmpCode);

  const handleClone = () => {
    if (selectedEmpCode && assessments.length > 0) {
      onClone(assessments);
      toast.success(
        `Imported ${assessments.length} skills from ${selectedEmployee?.full_name ?? selectedEmpCode}. Remember to review and click Save!`,
        'Skills Cloned'
      );
      onClose();
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'EM';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--surface-2))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] flex items-center justify-center shrink-0">
              <Copy size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[rgb(var(--text-1))]">
                Clone from Colleague
              </h2>
              <p className="text-xs text-[rgb(var(--text-2))]">
                Quickly copy all skill assessments and ratings from a teammate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--surface-3))] rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, employee ID, department, or grade..."
              className="field pl-10 pr-10 py-2.5 w-full text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-1))] p-1 rounded transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Colleague Selection List */}
          <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden flex-1 min-h-[220px] max-h-[300px] flex flex-col bg-[rgb(var(--surface))]">
            <div className="px-3.5 py-2 bg-[rgb(var(--surface-2))] border-b border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-2))] uppercase tracking-wider flex justify-between items-center">
              <span>Select Colleague</span>
              <span>{filteredEmployees.length} available</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
              {isLoadingEmployees ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[rgb(var(--text-3))]">
                  <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--accent))]" />
                  <span className="text-sm">Loading colleague directory...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-10 text-center text-sm text-[rgb(var(--text-3))]">
                  No colleagues match <span className="font-semibold text-[rgb(var(--text-2))]">"{searchTerm}"</span>
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedEmpCode === emp.emp_code;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmpCode(emp.emp_code)}
                      className={`w-full p-3 rounded-xl transition-all flex items-center justify-between text-left border ${
                        isSelected
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] shadow-sm'
                          : 'border-transparent hover:bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--border))]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-[rgb(var(--accent))] text-white'
                              : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-1))]'
                          }`}
                        >
                          {getInitials(emp.full_name)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-[rgb(var(--text-1))] truncate">
                            {emp.full_name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[rgb(var(--text-2))]">
                            <span className="font-mono text-[11px] font-semibold bg-[rgb(var(--surface-3))] text-[rgb(var(--text-1))] px-1.5 py-0.5 rounded">
                              {emp.emp_code}
                            </span>
                            <span className="text-[rgb(var(--text-3))]">•</span>
                            <span className="truncate">{emp.department}</span>
                            {emp.current_grade && (
                              <>
                                <span className="text-[rgb(var(--text-3))]">•</span>
                                <span className="font-medium text-[rgb(var(--accent-txt))] bg-[rgb(var(--accent-soft))] px-1.5 py-0.5 rounded text-[11px]">
                                  {emp.current_grade.title}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selection radio/check */}
                      <div className="ml-3 shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[rgb(var(--accent))]" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-[rgb(var(--border-2))]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Colleague Summary Preview */}
          {selectedEmployee && (
            <div className="p-3.5 rounded-xl border border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-5 h-5 text-[rgb(var(--accent))] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[rgb(var(--accent-txt))] uppercase tracking-wider">
                    Ready to Clone
                  </div>
                  <div className="text-sm font-semibold text-[rgb(var(--text-1))] truncate">
                    {selectedEmployee.full_name}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isFetchingAssessments ? (
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--accent-txt))]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Counting skills...</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[rgb(var(--accent-txt))] bg-[rgb(var(--surface))] px-2.5 py-1 rounded-lg border border-[rgb(var(--accent))]">
                    {assessments.length} skills found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] flex items-center justify-between">
          <p className="text-xs text-[rgb(var(--text-3))]">
            Cloned skills will appear in your table ready for review before saving.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClone}
              disabled={!selectedEmpCode || isFetchingAssessments || assessments.length === 0}
              className="btn-primary"
            >
              {isFetchingAssessments ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                `Clone ${assessments.length > 0 ? `${assessments.length} Skills` : 'Skills'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
