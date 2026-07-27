import React, { useState } from 'react';
import { useSkillsHierarchy } from '@/hooks/useAssessment';
import { X, Layers, Search, CheckSquare, Square } from 'lucide-react';

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
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (filteredTechs.every(t => existingTechnologyIds.has(t.id) || selectedTechIds.has(t.id))) {
      // deselect all currently visible (that aren't existing)
      const next = new Set(selectedTechIds);
      filteredTechs.forEach(t => next.delete(t.id));
      setSelectedTechIds(next);
    } else {
      // select all visible
      const next = new Set(selectedTechIds);
      filteredTechs.forEach(t => {
        if (!existingTechnologyIds.has(t.id)) {
          next.add(t.id);
        }
      });
      setSelectedTechIds(next);
    }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[rgb(var(--bg-1))] border border-[rgb(var(--border))] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--bg-2))]">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-[rgb(var(--text-1))]" />
            <h2 className="text-lg font-semibold text-[rgb(var(--text-1))]">Bulk Add Skills</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--bg-3))] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body - 3 Columns */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[rgb(var(--border))]">
          
          {/* Column 1: Domains */}
          <div className="flex-1 flex flex-col min-h-0 bg-[rgb(var(--bg-1))]">
            <div className="p-3 bg-[rgb(var(--bg-2))] font-medium text-sm text-[rgb(var(--text-2))] border-b border-[rgb(var(--border))]">
              1. Select Domain
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-[rgb(var(--text-3))]">Loading...</div>
              ) : (
                hierarchy.map(domain => (
                  <button
                    key={domain.domainId}
                    onClick={() => {
                      setSelectedDomainId(domain.domainId);
                      setSelectedCompetencyId(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedDomainId === domain.domainId
                        ? 'bg-blue-500 text-white font-medium shadow-sm'
                        : 'hover:bg-[rgb(var(--bg-2))] text-[rgb(var(--text-1))]'
                    }`}
                  >
                    {domain.domainName}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Competencies */}
          <div className="flex-1 flex flex-col min-h-0 bg-[rgb(var(--bg-1))]">
            <div className="p-3 bg-[rgb(var(--bg-2))] font-medium text-sm text-[rgb(var(--text-2))] border-b border-[rgb(var(--border))]">
              2. Select Competency
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!selectedDomainId ? (
                <div className="p-4 text-center text-sm text-[rgb(var(--text-3))]">Select a domain first</div>
              ) : (
                currentDomain?.competencies.map(comp => (
                  <button
                    key={comp.competencyId}
                    onClick={() => setSelectedCompetencyId(comp.competencyId)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedCompetencyId === comp.competencyId
                        ? 'bg-blue-500 text-white font-medium shadow-sm'
                        : 'hover:bg-[rgb(var(--bg-2))] text-[rgb(var(--text-1))]'
                    }`}
                  >
                    {comp.competencyName}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Tools/Technologies */}
          <div className="flex-[1.5] flex flex-col min-h-0 bg-[rgb(var(--bg-1))]">
            <div className="p-3 bg-[rgb(var(--bg-2))] font-medium text-sm text-[rgb(var(--text-2))] border-b border-[rgb(var(--border))] flex justify-between items-center">
              <span>3. Select Tools</span>
              {selectedCompetencyId && (
                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                  {selectedTechIds.size} selected
                </span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              {!selectedCompetencyId ? (
                <div className="p-4 text-center text-sm text-[rgb(var(--text-3))]">Select a competency first</div>
              ) : (
                <>
                  <div className="p-3 border-b border-[rgb(var(--border))]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-3))]" />
                      <input
                        type="text"
                        placeholder="Filter tools..."
                        className="input pl-8 py-1.5 text-sm w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredTechs.length > 0 && (
                      <button
                        onClick={toggleAll}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[rgb(var(--bg-2))] text-[rgb(var(--text-1))]"
                      >
                        {filteredTechs.every(t => existingTechnologyIds.has(t.id) || selectedTechIds.has(t.id)) ? (
                          <><CheckSquare size={16} className="text-blue-500" /> Deselect All</>
                        ) : (
                          <><Square size={16} className="text-[rgb(var(--text-3))]" /> Select All</>
                        )}
                      </button>
                    )}
                    
                    {filteredTechs.map(tech => {
                      const isExisting = existingTechnologyIds.has(tech.id);
                      const isSelected = selectedTechIds.has(tech.id);
                      
                      return (
                        <button
                          key={tech.id}
                          onClick={() => !isExisting && toggleTech(tech.id)}
                          disabled={isExisting}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                            ${isExisting ? 'opacity-50 cursor-not-allowed bg-[rgb(var(--bg-2))]' : 'hover:bg-[rgb(var(--bg-2))]'}
                          `}
                        >
                          {isSelected || isExisting ? (
                            <CheckSquare size={16} className={isExisting ? 'text-[rgb(var(--text-3))]' : 'text-blue-500'} />
                          ) : (
                            <Square size={16} className="text-[rgb(var(--text-3))]" />
                          )}
                          <span className={`flex-1 ${isExisting ? 'text-[rgb(var(--text-3))]' : 'text-[rgb(var(--text-1))]'}`}>
                            {tech.name}
                          </span>
                          {isExisting && <span className="text-xs text-[rgb(var(--text-3))]">Already added</span>}
                        </button>
                      );
                    })}
                    {filteredTechs.length === 0 && (
                      <div className="p-4 text-center text-sm text-[rgb(var(--text-3))]">No tools found matching "{searchTerm}"</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-2))] flex justify-between items-center">
          <div className="text-sm text-[rgb(var(--text-3))]">
            {selectedTechIds.size} tools selected
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={selectedTechIds.size === 0}
              className="btn-primary"
            >
              Add {selectedTechIds.size} Skills
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
