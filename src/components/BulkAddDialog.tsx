import React, { useState } from 'react';
import { useSkillsHierarchy } from '@/hooks/useAssessment';
import { X, Layers, Search, CheckSquare, Square, Loader2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (technologies: { domainId: number; competencyId: number; technologyId: number }[]) => void;
  existingTechnologyIds: Set<number>;
}

export const BulkAddDialog: React.FC<Props> = ({ isOpen, onClose, onBulkAdd, existingTechnologyIds }) => {
  const { data: hierarchy = [], isLoading } = useSkillsHierarchy();

  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  
  // Track selected technologies by ID
  const [selectedTechIds, setSelectedTechIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDomainId(null);
      setSelectedCompetencyId(null);
      setSelectedTechIds(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDomain = hierarchy.find(d => d.domainId === selectedDomainId);
  const currentCompetency = currentDomain?.competencies.find(c => c.competencyId === selectedCompetencyId);
  
  const filteredTechs = currentCompetency?.technologies.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  ) || [];

  const toggleTech = (techId: number) => {
    const next = new Set(selectedTechIds);
    if (next.has(techId)) {
      next.delete(techId);
    } else {
      next.add(techId);
    }
    setSelectedTechIds(next);
  };

  const toggleAll = () => {
    const nonExistingTechs = filteredTechs.filter(t => !existingTechnologyIds.has(t.id));
    if (nonExistingTechs.length === 0) return;

    const allSelected = nonExistingTechs.every(t => selectedTechIds.has(t.id));
    const next = new Set(selectedTechIds);

    if (allSelected) {
      nonExistingTechs.forEach(t => next.delete(t.id));
    } else {
      nonExistingTechs.forEach(t => next.add(t.id));
    }
    setSelectedTechIds(next);
  };

  const handleConfirm = () => {
    if (selectedDomainId && selectedCompetencyId && selectedTechIds.size > 0) {
      const payload = Array.from(selectedTechIds).map(techId => ({
        domainId: selectedDomainId,
        competencyId: selectedCompetencyId,
        technologyId: techId
      }));
      onBulkAdd(payload);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-scale-in"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--surface-2))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[rgb(var(--text-1))]">Bulk Add Skills</h2>
              <p className="text-xs text-[rgb(var(--text-2))]">
                Browse skill taxonomy to select and add multiple skills in one go
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

        {/* Body - 3 Columns */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          
          {/* Column 1: Domains */}
          <div className="flex-1 flex flex-col min-h-0 bg-[rgb(var(--surface))]">
            <div className="px-4 py-2.5 bg-[rgb(var(--surface-2))] font-semibold text-xs text-[rgb(var(--text-2))] uppercase tracking-wider border-b border-[rgb(var(--border))] flex items-center justify-between">
              <span>1. Skill Area / Domain</span>
              <span className="font-mono text-[10px] text-[rgb(var(--text-3))]">{hierarchy.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-[rgb(var(--text-3))]">
                  <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--accent))]" />
                  <span className="text-xs">Loading domains...</span>
                </div>
              ) : (
                hierarchy.map(domain => {
                  const isSelected = selectedDomainId === domain.domainId;
                  return (
                    <button
                      key={domain.domainId}
                      type="button"
                      onClick={() => {
                        setSelectedDomainId(domain.domainId);
                        setSelectedCompetencyId(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[rgb(var(--accent))] text-white shadow-sm'
                          : 'hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text-1))]'
                      }`}
                    >
                      <span className="truncate">{domain.domainName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-2))]'}`}>
                        {domain.competencies.length}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Competencies */}
          <div className="flex-1 flex flex-col min-h-0 bg-[rgb(var(--surface))]">
            <div className="px-4 py-2.5 bg-[rgb(var(--surface-2))] font-semibold text-xs text-[rgb(var(--text-2))] uppercase tracking-wider border-b border-[rgb(var(--border))] flex items-center justify-between">
              <span>2. Competency</span>
              {currentDomain && (
                <span className="font-mono text-[10px] text-[rgb(var(--text-3))]">{currentDomain.competencies.length}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!selectedDomainId ? (
                <div className="py-12 px-4 text-center text-xs text-[rgb(var(--text-3))]">
                  Select a domain from the left column
                </div>
              ) : (
                currentDomain?.competencies.map(comp => {
                  const isSelected = selectedCompetencyId === comp.competencyId;
                  return (
                    <button
                      key={comp.competencyId}
                      type="button"
                      onClick={() => setSelectedCompetencyId(comp.competencyId)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[rgb(var(--accent))] text-white shadow-sm'
                          : 'hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text-1))]'
                      }`}
                    >
                      <span className="truncate">{comp.competencyName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-2))]'}`}>
                        {comp.technologies.length}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Tools/Technologies */}
          <div className="flex-[1.4] flex flex-col min-h-0 bg-[rgb(var(--surface))]">
            <div className="px-4 py-2.5 bg-[rgb(var(--surface-2))] font-semibold text-xs text-[rgb(var(--text-2))] uppercase tracking-wider border-b border-[rgb(var(--border))] flex justify-between items-center">
              <span>3. Specific Skills & Tools</span>
              {selectedCompetencyId && (
                <span className="text-xs font-bold px-2 py-0.5 bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-txt))] rounded-md">
                  {selectedTechIds.size} selected
                </span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              {!selectedCompetencyId ? (
                <div className="py-12 px-4 text-center text-xs text-[rgb(var(--text-3))]">
                  Select a competency to view available skills
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))] pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter skills..."
                        className="field pl-9 pr-8 py-1.5 text-sm w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-1))] p-1"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredTechs.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))] text-[rgb(var(--text-1))] transition-colors"
                      >
                        {filteredTechs.filter(t => !existingTechnologyIds.has(t.id)).length > 0 &&
                         filteredTechs.filter(t => !existingTechnologyIds.has(t.id)).every(t => selectedTechIds.has(t.id)) ? (
                          <><CheckSquare size={16} className="text-[rgb(var(--accent))]" /> Deselect All Visible</>
                        ) : (
                          <><Square size={16} className="text-[rgb(var(--text-3))]" /> Select All Available</>
                        )}
                      </button>
                    )}
                    
                    {filteredTechs.map(tech => {
                      const isExisting = existingTechnologyIds.has(tech.id);
                      const isSelected = selectedTechIds.has(tech.id);
                      
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => !isExisting && toggleTech(tech.id)}
                          disabled={isExisting}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left border ${
                            isExisting
                              ? 'opacity-40 cursor-not-allowed bg-[rgb(var(--surface-2))] border-transparent'
                              : isSelected
                              ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]'
                              : 'border-transparent hover:bg-[rgb(var(--surface-2))]'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[rgb(var(--accent))] shrink-0" />
                          ) : isExisting ? (
                            <CheckSquare size={16} className="text-[rgb(var(--text-3))] shrink-0" />
                          ) : (
                            <Square size={16} className="text-[rgb(var(--text-3))] shrink-0" />
                          )}
                          <span className={`flex-1 truncate ${isExisting ? 'text-[rgb(var(--text-3))] line-through' : 'text-[rgb(var(--text-1))] font-medium'}`}>
                            {tech.name}
                          </span>
                          {isExisting && (
                            <span className="text-[11px] font-semibold text-[rgb(var(--text-3))] bg-[rgb(var(--surface-3))] px-1.5 py-0.5 rounded">
                              Already added
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredTechs.length === 0 && (
                      <div className="py-8 text-center text-xs text-[rgb(var(--text-3))]">
                        No skills found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-2))]">
            <Sparkles size={16} className="text-[rgb(var(--accent))]" />
            <span>
              <strong className="text-[rgb(var(--text-1))]">{selectedTechIds.size}</strong> skills selected to add
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button 
              type="button"
              onClick={handleConfirm} 
              disabled={selectedTechIds.size === 0}
              className="btn-primary"
            >
              Add {selectedTechIds.size > 0 ? `${selectedTechIds.size} Skills` : 'Skills'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
