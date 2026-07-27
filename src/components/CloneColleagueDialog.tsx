import React, { useState } from 'react';
import { useAllEmployees, useEmployeeAssessments, SkillAssessment } from '@/hooks/useAssessment';
import { X, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClone: (assessments: SkillAssessment[]) => void;
  currentEmployeeCode: string;
}

export const CloneColleagueDialog: React.FC<Props> = ({ isOpen, onClose, onClone, currentEmployeeCode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpCode, setSelectedEmpCode] = useState<string | null>(null);

  const { data: employees = [], isLoading: isLoadingEmployees } = useAllEmployees();
  
  // Always call the hook, but we only "use" it when an employee is selected. 
  // It will fetch in the background.
  const { data: assessments = [], isFetching: isFetchingAssessments } = useEmployeeAssessments(selectedEmpCode || '');

  if (!isOpen) return null;

  const filteredEmployees = employees
    .filter(emp => emp.emp_code !== currentEmployeeCode)
    .filter(emp => 
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.current_grade?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.current_grade?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleClone = () => {
    if (selectedEmpCode && assessments.length > 0) {
      onClone(assessments);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[rgb(var(--bg-1))] border border-[rgb(var(--border))] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--bg-2))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-1))]">Clone from Colleague</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--bg-3))] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          <p className="text-sm text-[rgb(var(--text-2))]">
            Select a colleague to instantly copy all of their skills and tools. 
            Levels and project counts will be cloned, but you can edit them before saving.
          </p>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))]" />
            <input
              type="text"
              placeholder="Search by name, ID, department, or grade..."
              className="input pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border border-[rgb(var(--border))] rounded-lg overflow-y-auto flex-1 max-h-[300px]">
            {isLoadingEmployees ? (
              <div className="p-4 text-center text-sm text-[rgb(var(--text-3))]">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-sm text-[rgb(var(--text-3))]">No colleagues found.</div>
            ) : (
              <ul className="divide-y divide-[rgb(var(--border))]">
                {filteredEmployees.map(emp => (
                  <li 
                    key={emp.id} 
                    className={`p-3 cursor-pointer transition-colors flex justify-between items-center ${
                      selectedEmpCode === emp.emp_code 
                        ? 'bg-blue-500/10 hover:bg-blue-500/20' 
                        : 'hover:bg-[rgb(var(--bg-2))]'
                    }`}
                    onClick={() => setSelectedEmpCode(emp.emp_code)}
                  >
                    <div>
                      <div className="font-medium text-[rgb(var(--text-1))]">{emp.full_name}</div>
                      <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">
                        <span className="font-mono text-[10px] bg-[rgb(var(--bg-3))] px-1.5 py-0.5 rounded mr-1.5">{emp.emp_code}</span>
                        {emp.department}
                        {emp.current_grade && <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">{emp.current_grade.title}</span>}
                      </div>
                    </div>
                    {selectedEmpCode === emp.emp_code && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-2))] flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button 
            onClick={handleClone} 
            disabled={!selectedEmpCode || isFetchingAssessments}
            className="btn-primary"
          >
            {isFetchingAssessments ? 'Fetching...' : `Clone ${assessments.length > 0 ? `(${assessments.length} skills)` : 'Skills'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
