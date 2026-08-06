import React, { useState } from 'react';
import { useSkillsHierarchy } from '@/hooks/useAssessment';
import { X, Layers, Search, CheckSquare, Square, Loader2, Sparkles } from 'lucide-react';

export interface BulkAddTechnologyPayload {
  domainId: number;
  competencyId: number;
  technologyId: number;
  type: 'Primary' | 'Secondary' | 'Tertiary';
  projects: number;
}

interface SkillConfig {
  domainId: number;
  competencyId: number;
  technologyId: number;
  type: 'Primary' | 'Secondary' | 'Tertiary';
  projects: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (technologies: BulkAddTechnologyPayload[]) => void;
  existingTechnologyIds: Set<number>;
  existingRows?: Array<{ competencyId?: number | null; type?: 'Primary' | 'Secondary' | 'Tertiary' }>;
}

const ALL_IMPORTANCE_SLOTS: Array<'Primary' | 'Secondary' | 'Tertiary'> = ['Primary', 'Secondary', 'Tertiary'];
const DEFAULT_INITIAL_PROJECTS = 1;

export const BulkAddDialog: React.FC<Props> = ({ isOpen, onClose, onBulkAdd, existingTechnologyIds, existingRows }) => {
  const { data: hierarchy = [], isLoading } = useSkillsHierarchy();

  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  
  // Track selected skills with their individual type and projects
  const [selectedSkills, setSelectedSkills] = useState<Map<number, SkillConfig>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDomainId(null);
      setSelectedCompetencyId(null);
      setSelectedSkills(new Map());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDomain = hierarchy.find(d => d.domainId === selectedDomainId);
  const currentCompetency = currentDomain?.competencies.find(c => c.competencyId === selectedCompetencyId);
  
  const filteredTechs = currentCompetency?.technologies.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  ) || [];

  // Helper to get taken slots for a competency (from existing rows + current modal selections)
  const getTakenSlotsForCompetency = (compId: number, excludeTechId?: number) => {
    const taken = new Set<'Primary' | 'Secondary' | 'Tertiary'>();
    
    if (existingRows) {
      existingRows.forEach(r => {
        if (r.competencyId === compId && r.type) {
          taken.add(r.type);
        }
      });
    }

    selectedSkills.forEach((config, tId) => {
      if (config.competencyId === compId && tId !== excludeTechId) {
        taken.add(config.type);
      }
    });

    return taken;
  };

  const getAvailableSlotsForCompetency = (compId: number, excludeTechId?: number) => {
    const taken = getTakenSlotsForCompetency(compId, excludeTechId);
    return ALL_IMPORTANCE_SLOTS.filter(s => !taken.has(s));
  };

  const toggleTech = (techId: number) => {
    if (!selectedDomainId || !selectedCompetencyId) return;

    setSelectedSkills(prev => {
      const next = new Map(prev);
      if (next.has(techId)) {
        next.delete(techId);
      } else {
        const availableSlots = getAvailableSlotsForCompetency(selectedCompetencyId);
        if (availableSlots.length === 0) {
          return next;
        }
        next.set(techId, {
          domainId: selectedDomainId,
          competencyId: selectedCompetencyId,
          technologyId: techId,
          type: availableSlots[0],
          projects: DEFAULT_INITIAL_PROJECTS,
        });
      }
      return next;
    });
  };

  const updateSkillRowConfig = (
    techId: number,
    field: 'type' | 'projects',
    value: 'Primary' | 'Secondary' | 'Tertiary' | number
  ) => {
    setSelectedSkills(prev => {
      const next = new Map(prev);
      const existing = next.get(techId);
      if (existing) {
        next.set(techId, {
          ...existing,
          [field]: value,
        });
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!selectedDomainId || !selectedCompetencyId) return;

    const nonExistingTechs = filteredTechs.filter(t => !existingTechnologyIds.has(t.id));
    if (nonExistingTechs.length === 0) return;

    const allSelected = nonExistingTechs.every(t => selectedSkills.has(t.id));

    setSelectedSkills(prev => {
      const next = new Map(prev);
      if (allSelected) {
        nonExistingTechs.forEach(t => next.delete(t.id));
      } else {
        nonExistingTechs.forEach(t => {
          if (!next.has(t.id)) {
            const taken = new Set<'Primary' | 'Secondary' | 'Tertiary'>();
            if (existingRows) {
              existingRows.forEach(r => {
                if (r.competencyId === selectedCompetencyId && r.type) taken.add(r.type);
              });
            }
            next.forEach(config => {
              if (config.competencyId === selectedCompetencyId) taken.add(config.type);
            });
            const freeSlots = ALL_IMPORTANCE_SLOTS.filter(s => !taken.has(s));
            if (freeSlots.length > 0) {
              next.set(t.id, {
                domainId: selectedDomainId,
                competencyId: selectedCompetencyId,
                technologyId: t.id,
                type: freeSlots[0],
                projects: DEFAULT_INITIAL_PROJECTS,
              });
            }
          }
        });
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedSkills.size > 0) {
      const payload: BulkAddTechnologyPayload[] = Array.from(selectedSkills.values());
      onBulkAdd(payload);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl xl:max-w-6xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[850px] animate-scale-in"
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
                Browse skill taxonomy, check skills, and customize Importance & Projects per row (Max 1 Primary, 1 Secondary, 1 Tertiary per skill)
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

        {/* 3-Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-[rgb(var(--border))] overflow-hidden">
          
          {/* Column 1: Domains */}
          <div className="w-full md:w-[32%] lg:w-[30%] flex flex-col min-h-0 min-w-0 bg-[rgb(var(--surface))] shrink-0">
            <div className="px-4 py-2.5 bg-[rgb(var(--surface-2))] font-semibold text-xs text-[rgb(var(--text-2))] uppercase tracking-wider border-b border-[rgb(var(--border))] flex items-center justify-between">
              <span>1. Skill Area</span>
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
                      <span className="truncate pr-2">{domain.domainName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-2))]'}`}>
                        {domain.competencies.length}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Competencies */}
          <div className="w-full md:w-[34%] lg:w-[32%] flex flex-col min-h-0 min-w-0 bg-[rgb(var(--surface))] shrink-0">
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
                  const takenSlots = getTakenSlotsForCompetency(comp.competencyId);
                  const isFull = takenSlots.size >= 3;
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
                      <span className="truncate pr-2">{comp.competencyName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isFull && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-500'}`}>
                            3/3 Full
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-2))]'}`}>
                          {comp.technologies.length}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Tools/Technologies */}
          <div className="w-full md:flex-1 flex flex-col min-h-0 min-w-0 bg-[rgb(var(--surface))] overflow-hidden">
            <div className="px-4 py-2.5 bg-[rgb(var(--surface-2))] font-semibold text-xs text-[rgb(var(--text-2))] uppercase tracking-wider border-b border-[rgb(var(--border))] flex justify-between items-center gap-2">
              <span className="truncate">3. Specific Skills & Tools</span>
              {selectedSkills.size > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-txt))] rounded-md shrink-0 whitespace-nowrap">
                  {selectedSkills.size} selected
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
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {filteredTechs.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))] text-[rgb(var(--text-1))] transition-colors"
                      >
                        {filteredTechs.filter(t => !existingTechnologyIds.has(t.id)).length > 0 &&
                         filteredTechs.filter(t => !existingTechnologyIds.has(t.id)).every(t => selectedSkills.has(t.id)) ? (
                          <><CheckSquare size={16} className="text-[rgb(var(--accent))]" /> Deselect All Visible</>
                        ) : (
                          <><Square size={16} className="text-[rgb(var(--text-3))]" /> Select Available Slots</>
                        )}
                      </button>
                    )}
                    
                    {filteredTechs.map(tech => {
                      const isExisting = existingTechnologyIds.has(tech.id);
                      const isSelected = selectedSkills.has(tech.id);
                      const config = selectedSkills.get(tech.id);
                      const availableSlots = getAvailableSlotsForCompetency(selectedCompetencyId);
                      const isSlotBlocked = !isSelected && !isExisting && availableSlots.length === 0;
                      
                      return (
                        <div
                          key={tech.id}
                          className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl transition-all border ${
                            isExisting || isSlotBlocked
                              ? 'opacity-45 cursor-not-allowed bg-[rgb(var(--surface-2))] border-transparent'
                              : isSelected
                              ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] shadow-xs'
                              : 'border-transparent hover:bg-[rgb(var(--surface-2))]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => !isExisting && !isSlotBlocked && toggleTech(tech.id)}
                            disabled={isExisting || isSlotBlocked}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left select-none"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-[rgb(var(--accent))] shrink-0" />
                            ) : isExisting || isSlotBlocked ? (
                              <Square size={16} className="text-[rgb(var(--text-3))] shrink-0 opacity-50" />
                            ) : (
                              <Square size={16} className="text-[rgb(var(--text-3))] shrink-0" />
                            )}
                            <span className={`truncate text-xs ${isExisting ? 'text-[rgb(var(--text-3))] line-through' : 'text-[rgb(var(--text-1))] font-medium'}`}>
                              {tech.name}
                            </span>
                            {isExisting && (
                              <span className="text-[10px] font-semibold text-[rgb(var(--text-3))] bg-[rgb(var(--surface-3))] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ml-2">
                                Already added
                              </span>
                            )}
                            {isSlotBlocked && (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ml-2">
                                3/3 slots full
                              </span>
                            )}
                          </button>

                          {isSelected && config && !isExisting && (
                            <div className="flex items-center gap-2 shrink-0 animate-fade-in pl-6 sm:pl-0">
                              <div className="flex items-center gap-1">
                                <label className="text-[10px] uppercase font-semibold text-[rgb(var(--text-2))]">Imp:</label>
                                <select
                                  value={config.type}
                                  onChange={(e) => updateSkillRowConfig(tech.id, 'type', e.target.value as 'Primary' | 'Secondary' | 'Tertiary')}
                                  onClick={(e) => e.stopPropagation()}
                                  className="field h-7 px-1.5 py-0 text-[11px] font-semibold rounded-md min-w-[80px] bg-[rgb(var(--surface))]"
                                >
                                  {ALL_IMPORTANCE_SLOTS.map((slot) => {
                                    const isTakenByOther = getTakenSlotsForCompetency(selectedCompetencyId, tech.id).has(slot);
                                    return (
                                      <option key={slot} value={slot} disabled={isTakenByOther}>
                                        {slot} {isTakenByOther ? '(In use)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="flex items-center gap-1">
                                <label className="text-[10px] uppercase font-semibold text-[rgb(var(--text-2))]">Proj:</label>
                                <select
                                  value={config.projects}
                                  onChange={(e) => updateSkillRowConfig(tech.id, 'projects', Number(e.target.value))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="field h-7 px-1.5 py-0 text-[11px] font-semibold rounded-md min-w-[58px] bg-[rgb(var(--surface))]"
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3+</option>
                                  <option value={0}>0</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
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
        <div className="px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-2))]">
            <Sparkles size={16} className="text-[rgb(var(--accent))]" />
            <span>
              <strong className="text-[rgb(var(--text-1))]">{selectedSkills.size}</strong> skills selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 h-9">
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleConfirm} 
              disabled={selectedSkills.size === 0}
              className="btn-primary text-xs px-4 h-9 flex items-center gap-1.5 font-semibold"
            >
              Add {selectedSkills.size > 0 ? `${selectedSkills.size} Skills` : 'Skills'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
