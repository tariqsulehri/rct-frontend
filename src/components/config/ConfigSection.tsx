import React, { useState } from 'react';
import { Award, Building2, Cpu, Layers, Network, Settings, ShieldCheck, Tag, User, Users, Zap } from 'lucide-react';
import SkillTaxonomyView from './SkillTaxonomyView';
import { AccessManagementSection } from './access/AccessManagementSection';
import { DepartmentsSection } from './organization/DepartmentsSection';
import { EmployeesSection } from './organization/EmployeesSection';
import { GradesSection } from './organization/GradesSection';
import { UsersSection } from './organization/UsersSection';
import { ScoringConfigSection } from './scoring/ScoringConfigSection';
import { CategoriesSection } from './taxonomy/CategoriesSection';
import { CompetenciesSection } from './taxonomy/CompetenciesSection';
import { SkillDomainsSection } from './taxonomy/SkillDomainsSection';
import { TechnologiesSection } from './taxonomy/TechnologiesSection';

type ConfigTab = 'scoring' | 'access' | 'departments' | 'employees' | 'users' | 'grades' | 'skill-domains' | 'competencies' | 'technologies' | 'categories' | 'skill-map';

const CONFIG_TABS: Array<{ id: ConfigTab; label: string; help: string; icon: React.ElementType }> = [
  { id: 'scoring',      label: 'Scoring',          help: 'Rules used to count skill scores.', icon: Settings },
  { id: 'access',       label: 'Access',           help: 'Who can open each part of the app.', icon: ShieldCheck },
  { id: 'departments',   label: 'Departments',       help: 'Company groups for employees.', icon: Building2 },
  { id: 'employees',     label: 'Employees',         help: 'People whose skills and readiness are tracked.', icon: Users },
  { id: 'users',         label: 'Users',             help: 'Login accounts and app roles.', icon: User },
  { id: 'grades',        label: 'Grades',            help: 'Career levels such as G13, G14, and G15.', icon: Award },
  { id: 'categories',    label: 'Categories',        help: 'Simple labels used to group skills.', icon: Tag },
  { id: 'skill-domains', label: 'Skill Areas',       help: 'Large skill groups such as Cloud or SRE.', icon: Layers },
  { id: 'competencies',  label: 'Skills',            help: 'Skills that employees are checked on.', icon: Cpu },
  { id: 'technologies',  label: 'Tools',             help: 'Tools linked to a skill.', icon: Zap },
  { id: 'skill-map',     label: 'Skill Map',         help: 'See how skill groups, skills, and tools connect.', icon: Network },
];

export const ConfigSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('scoring');

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="section-title">Setup</h2>
        <p className="section-desc">
          Set up people, grades, skill groups, skills, and tools used in the app.
        </p>
      </div>

      {/* Tab nav */}
      <div className="card p-1.5 flex gap-1 flex-wrap">
        {CONFIG_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.help}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgb(var(--accent))' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgb(var(--text-2))',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'scoring'       && <ScoringConfigSection />}
        {activeTab === 'access'        && <AccessManagementSection />}
        {activeTab === 'departments'   && <DepartmentsSection />}
        {activeTab === 'employees'     && <EmployeesSection />}
        {activeTab === 'users'         && <UsersSection />}
        {activeTab === 'grades'        && <GradesSection />}
        {activeTab === 'skill-domains'        && <SkillDomainsSection />}
        {activeTab === 'categories'           && <CategoriesSection />}
        {activeTab === 'competencies'  && <CompetenciesSection />}
        {activeTab === 'technologies'  && <TechnologiesSection />}
        {activeTab === 'skill-map'     && <SkillTaxonomyView />}
      </div>
    </div>
  );
};
