import React, { useState, useMemo } from 'react';
import { ChevronRight, Layers, Tag, Cpu, Zap, Search, X, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import {
  useConfigSkillDomains,
  useConfigCompetencyCategories,
  useConfigCompetencies,
  useConfigTechnologies,
} from '@/hooks/useConfig';

// ── Type colours for technology badges ───────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────
const hex = (color: string | null | undefined, alpha: string) =>
  color ? `${color}${alpha}` : `rgb(var(--accent) / 0.15)`;

// ── Main component ────────────────────────────────────────────────────────────
const SkillTaxonomyView: React.FC = () => {
  const { data: domains,       isLoading: loadingDomains  } = useConfigSkillDomains();
  const { data: categories,    isLoading: loadingCats     } = useConfigCompetencyCategories();
  const { data: competencies,  isLoading: loadingComps    } = useConfigCompetencies();
  const { data: technologies,  isLoading: loadingTechs    } = useConfigTechnologies();

  // ── Expand / collapse state ────────────────────────────────────────────────
  const [openDomains,      setOpenDomains]      = useState<Set<number>>(new Set());
  const [openCategories,   setOpenCategories]   = useState<Set<string>>(new Set());   // key: `${domainId}-${catId}`
  const [openCompetencies, setOpenCompetencies] = useState<Set<number>>(new Set());

  // ── Global search ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const toggle = <T,>(set: Set<T>, key: T): Set<T> => {
    const n = new Set(set);
    if (n.has(key)) {
      n.delete(key);
    } else {
      n.add(key);
    }
    return n;
  };

  // ── Technology lookup by competency id ────────────────────────────────────
  const techByComp = useMemo(() => {
    const map = new Map<number, NonNullable<typeof technologies>>();
    (technologies ?? []).forEach(t => {
      const arr = map.get(t.competency_id) ?? [];
      arr.push(t);
      map.set(t.competency_id, arr);
    });
    return map;
  }, [technologies]);

  // ── Build skill area tree: Skill Area → { Category → Skill[] } ───────────
  const domainTree = useMemo(() => {
    const catLookup = new Map((categories ?? []).map(c => [c.id, c]));

    return (domains ?? []).map(domain => {
      const domainComps = (competencies ?? []).filter(c =>
        (c.competency_domains ?? []).some(d => d.domain.id === domain.id),
      );

      // Group competencies by category
      const catMap = new Map<number, { cat: NonNullable<typeof categories>[0]; comps: typeof domainComps }>();
      domainComps.forEach(c => {
        if (!c.competency_category) return;
        const catId = c.competency_category.id;
        if (!catMap.has(catId)) {
          const fullCat = catLookup.get(catId) ?? c.competency_category as NonNullable<typeof categories>[0];
          catMap.set(catId, { cat: fullCat, comps: [] });
        }
        catMap.get(catId)!.comps.push(c);
      });

      return { domain, groups: Array.from(catMap.values()), totalComps: domainComps.length };
    });
  }, [domains, categories, competencies]);

  // ── Filtered domain tree (search) ─────────────────────────────────────────
  const filteredTree = useMemo(() => {
    if (!q) return domainTree;
    return domainTree
      .map(node => {
        const groups = node.groups
          .map(g => ({
            ...g,
            comps: g.comps.filter(c =>
              c.name.toLowerCase().includes(q) ||
              (c.description ?? '').toLowerCase().includes(q) ||
              (techByComp.get(c.id) ?? []).some(t => t.name.toLowerCase().includes(q)),
            ),
          }))
          .filter(g => g.comps.length > 0 || g.cat.name.toLowerCase().includes(q));
        const match = node.domain.name.toLowerCase().includes(q);
        if (!match && groups.length === 0) return null;
        return { ...node, groups, totalComps: groups.reduce((s, g) => s + g.comps.length, 0) };
      })
      .filter(Boolean) as typeof domainTree;
  }, [domainTree, q, techByComp]);

  // ── Expand / collapse all helpers ─────────────────────────────────────────
  const expandAll = () => {
    setOpenDomains(new Set(filteredTree.map(n => n.domain.id)));
    const catKeys = new Set<string>();
    filteredTree.forEach(n => n.groups.forEach(g => catKeys.add(`${n.domain.id}-${g.cat.id}`)));
    setOpenCategories(catKeys);
    setOpenCompetencies(new Set((competencies ?? []).map(c => c.id)));
  };
  const collapseAll = () => {
    setOpenDomains(new Set());
    setOpenCategories(new Set());
    setOpenCompetencies(new Set());
  };

  const isLoading = loadingDomains || loadingCats || loadingComps || loadingTechs;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Skill Areas',  value: (domains ?? []).length,      color: '#6366f1' },
    { label: 'Categories',   value: (categories ?? []).length,   color: '#ec4899' },
    { label: 'Skills',       value: (competencies ?? []).length, color: '#06b6d4' },
    { label: 'Technologies', value: (technologies ?? []).length, color: '#f97316' },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="card h-14 rounded-xl" style={{ backgroundColor: 'rgb(var(--surface-2))' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-3))' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ backgroundColor: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}>
          <Search size={14} style={{ color: 'rgb(var(--text-3))' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search skill areas, categories, skills, technologies..."
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: 'rgb(var(--text-1))' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'rgb(var(--text-3))' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Expand / Collapse All */}
        <button onClick={expandAll}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
          <ChevronsUpDown size={14} />
          Expand All
        </button>
        <button onClick={collapseAll}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors btn-ghost">
          <ChevronsDownUp size={14} />
          Collapse All
        </button>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {filteredTree.length === 0 && (
        <div className="card py-16 text-center">
          <Layers size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'rgb(var(--text-3))' }} />
          <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-3))' }}>
            {q ? 'No results match your search' : 'No skill areas configured yet'}
          </p>
        </div>
      )}

      {/* ── Skill area tree ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredTree.map(({ domain, groups, totalComps }) => {
          const domainOpen = openDomains.has(domain.id);
          const dc = domain.color ?? '#6366f1';

          return (
            <div key={domain.id} className="card p-0 overflow-hidden"
              style={{ borderLeft: `4px solid ${dc}` }}>

              {/* ── Skill area row ─────────────────────────────────────── */}
              <button
                onClick={() => setOpenDomains(s => toggle(s, domain.id))}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors group"
                style={{ backgroundColor: domainOpen ? hex(dc, '12') : 'transparent' }}
                onMouseEnter={e => !domainOpen && (e.currentTarget.style.backgroundColor = hex(dc, '08'))}
                onMouseLeave={e => !domainOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${dc}33 0%, ${dc}18 100%)` }}>
                  <Layers size={17} style={{ color: dc }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base" style={{ color: 'rgb(var(--text-1))' }}>
                      {domain.name}
                    </span>
                    {domain.grade_weights && domain.grade_weights.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: hex(dc, '22'), color: dc }}>
                        {domain.grade_weights.length} grade skill weights
                      </span>
                    )}
                  </div>
                  {domain.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-3))' }}>
                      {domain.description}
                    </p>
                  )}
                </div>

                {/* Counts */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold" style={{ color: dc }}>{groups.length}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>categories</p>
                  </div>
                  <div className="w-px h-8 shrink-0" style={{ backgroundColor: hex(dc, '30') }} />
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold" style={{ color: dc }}>{totalComps}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>skills</p>
                  </div>
                  <ChevronRight size={18} style={{
                    color: dc,
                    transform: domainOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }} />
                </div>
              </button>

              {/* ── Category + Skill rows ──────────────────────────────── */}
              {domainOpen && (
                <div className="border-t" style={{ borderColor: hex(dc, '20') }}>
                  {groups.length === 0 ? (
                    <div className="px-8 py-5 text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                      No skills assigned to this skill area yet.
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                      {groups.map(({ cat, comps }) => {
                        const catKey = `${domain.id}-${cat.id}`;
                        const catOpen = openCategories.has(catKey);
                        const cc = cat.color ?? '#8b5cf6';

                        return (
                          <div key={catKey}>

                            {/* ── Category row ──────────────────────────── */}
                            <button
                              onClick={() => setOpenCategories(s => toggle(s, catKey))}
                              className="w-full flex items-center gap-3 text-left transition-colors"
                              style={{
                                paddingLeft: '32px',
                                paddingRight: '20px',
                                paddingTop: '10px',
                                paddingBottom: '10px',
                                backgroundColor: catOpen ? hex(cc, '10') : 'transparent',
                                borderLeft: `3px solid ${cc}`,
                              }}
                              onMouseEnter={e => !catOpen && (e.currentTarget.style.backgroundColor = hex(cc, '08'))}
                              onMouseLeave={e => !catOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              {/* Tree connector dot */}
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: hex(cc, '25') }}>
                                <Tag size={11} style={{ color: cc }} />
                              </div>

                              <span className="font-semibold text-sm flex-1" style={{ color: 'rgb(var(--text-1))' }}>
                                {cat.name}
                              </span>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: hex(cc, '20'), color: cc }}>
                                  {comps.length} skill{comps.length !== 1 ? 's' : ''}
                                </span>
                                <ChevronRight size={14} style={{
                                  color: cc,
                                  transform: catOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }} />
                              </div>
                            </button>

                            {/* ── Skill rows ────────────────────────────── */}
                            {catOpen && (
                              <div className="divide-y" style={{ borderColor: 'rgb(var(--border) / 0.5)' }}>
                                {comps.map(comp => {
                                  const compOpen = openCompetencies.has(comp.id);
                                  const techs = techByComp.get(comp.id) ?? [];

                                  return (
                                    <div key={comp.id}>

                                      {/* ── Skill row ───────────────────── */}
                                      <button
                                        onClick={() => setOpenCompetencies(s => toggle(s, comp.id))}
                                        className="w-full flex items-center gap-3 text-left transition-colors"
                                        style={{
                                          paddingLeft: '56px',
                                          paddingRight: '20px',
                                          paddingTop: '9px',
                                          paddingBottom: '9px',
                                          backgroundColor: compOpen ? 'rgb(var(--surface-2) / 0.6)' : 'transparent',
                                          borderLeft: `2px solid ${dc}30`,
                                        }}
                                        onMouseEnter={e => !compOpen && (e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2) / 0.4)')}
                                        onMouseLeave={e => !compOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
                                      >
                                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                          style={{ backgroundColor: 'rgb(var(--accent-soft))' }}>
                                          <Cpu size={10} style={{ color: 'rgb(var(--accent-txt))' }} />
                                        </div>

                                        <span className="text-sm flex-1 text-left font-medium"
                                          style={{ color: 'rgb(var(--text-1))' }}>
                                          {comp.name}
                                        </span>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {comp.is_critical && (
                                            <span className="badge badge-danger" style={{ fontSize: '10px' }}>Important</span>
                                          )}
                                          {techs.length > 0 && (
                                            <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                                              {techs.length} tech
                                            </span>
                                          )}
                                          <ChevronRight size={13} style={{
                                            color: 'rgb(var(--text-3))',
                                            transform: compOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease',
                                          }} />
                                        </div>
                                      </button>

                                      {/* ── Technology pills ────────────── */}
                                      {compOpen && (
                                        <div
                                          className="flex flex-wrap gap-2"
                                          style={{
                                            paddingLeft: '76px',
                                            paddingRight: '20px',
                                            paddingTop: '10px',
                                            paddingBottom: '12px',
                                            backgroundColor: 'rgb(var(--surface-2) / 0.3)',
                                            borderLeft: `2px solid ${dc}20`,
                                          }}
                                        >
                                          {techs.length === 0 ? (
                                            <span className="text-xs italic" style={{ color: 'rgb(var(--text-3))' }}>
                                              No technologies mapped yet
                                            </span>
                                          ) : (
                                            techs.map(t => (
                                              <div key={t.id}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                                style={{
                                                  backgroundColor: `${dc}15`,
                                                  color: dc,
                                                  border: `1px solid ${dc}30`,
                                                }}>
                                                <Zap size={9} />
                                                <span className="text-xs font-medium">{t.name}</span>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTaxonomyView;
