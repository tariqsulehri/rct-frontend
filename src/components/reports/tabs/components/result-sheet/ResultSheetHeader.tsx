import React from 'react';
import { Download } from 'lucide-react';

interface ResultSheetHeaderProps {
  personOptions: any[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  promoLoading: boolean;
  compLoading: boolean;
  gapLoading: boolean;
  gapResult: any;
  onDownloadPdf: () => void;
}

export const ResultSheetHeader: React.FC<ResultSheetHeaderProps> = ({
  personOptions,
  selectedId,
  setSelectedId,
  promoLoading,
  compLoading,
  gapLoading,
  gapResult,
  onDownloadPdf,
}) => {
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-[230px]">
        <label className="field-label">Select Person</label>
        <select
          className="field max-w-md"
          value={selectedId ?? ''}
          onChange={e => setSelectedId(e.target.value || null)}
          disabled={promoLoading || compLoading}
        >
          <option value="">— Select a person —</option>
          {personOptions.map(person => (
            <option key={person.emp_code} value={person.emp_code}>
              {person.full_name} ({person.emp_code})
              {person.department ? ` - ${person.department}` : ''}
              {person.current_grade && person.target_grade ? ` - ${person.current_grade} -> ${person.target_grade}` : ''}
            </option>
          ))}
        </select>
        {!promoLoading && !compLoading && personOptions.length === 0 && (
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            No people match the current report filters.
          </p>
        )}
      </div>
      <button
        onClick={onDownloadPdf}
        disabled={!gapResult || gapLoading || promoLoading || compLoading}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"
      >
        <Download size={14} />
        Print / Save Result Sheet
      </button>
    </div>
  );
};
