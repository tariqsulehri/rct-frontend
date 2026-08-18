import React from 'react';
import {
  Award,
  Building2,
  Calendar,
  Cpu,
  Layers,
  MessageSquareText,
  Network,
  Settings,
  ShieldCheck,
  Tag,
  User,
  Users,
  Zap,
} from 'lucide-react';

export type ConfigTab =
  | 'grades'
  | 'departments'
  | 'employees'
  | 'users'
  | 'access'
  | 'scoring'
  | 'cefr-benchmarks'
  | 'periods'
  | 'skill-domains'
  | 'competencies'
  | 'technologies'
  | 'categories'
  | 'skill-map';

export interface ConfigTabItem {
  id: ConfigTab;
  label: string;
  shortDesc: string;
  help: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export interface ConfigCategory {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  items: ConfigTabItem[];
}

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'organization',
    title: 'Organization & People',
    tagline: 'Manage career grades, company departments, employee rosters, and permissions',
    icon: Building2,
    accentColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    items: [
      {
        id: 'grades',
        label: 'Career Grades',
        shortDesc: 'Ladder levels & titles',
        help: 'Configure organizational career grades such as G13, G14, G15 up to EXEC.',
        icon: Award,
      },
      {
        id: 'departments',
        label: 'Departments',
        shortDesc: 'Units & engineering teams',
        help: 'Company departments and organizational structures.',
        icon: Building2,
      },
      {
        id: 'employees',
        label: 'Employees',
        shortDesc: 'Roster & targets',
        help: 'People whose skills, baselines, and promotion readiness are tracked.',
        icon: Users,
      },
      {
        id: 'users',
        label: 'User Accounts',
        shortDesc: 'Logins & system credentials',
        help: 'Application logins, authentication credentials, and user profiles.',
        icon: User,
      },
      {
        id: 'access',
        label: 'Access & RBAC',
        shortDesc: 'Roles & permission matrix',
        help: 'Role-based access permissions and security control scopes.',
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 'scoring_rules',
    title: 'Scoring & Evaluation Rules',
    tagline: 'Define mathematical weights, CEFR language benchmarks, and review cycles',
    icon: Settings,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    items: [
      {
        id: 'scoring',
        label: 'Technical Scoring',
        shortDesc: 'Formula weights & thresholds',
        help: 'Core scoring algorithms, domain multipliers, and star rating bands.',
        icon: Settings,
      },
      {
        id: 'cefr-benchmarks',
        label: 'CEFR Benchmarks',
        shortDesc: 'Grade communication matrix',
        help: 'Configure grade-wise CEFR benchmarks, competency rubrics, and promotion gating rules.',
        icon: MessageSquareText,
        badge: 'CEFR',
        badgeColor: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
      },
      {
        id: 'periods',
        label: 'Evaluation Periods',
        shortDesc: 'Appraisal cycles & years',
        help: 'Set up performance review cycles and fiscal evaluation years (e.g. 2024, 2025, 2026).',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'taxonomy',
    title: 'Skill Taxonomy & Tools',
    tagline: 'Structure domains, competencies, technologies, and relational skill mappings',
    icon: Layers,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    items: [
      {
        id: 'skill-domains',
        label: 'Skill Domains',
        shortDesc: 'Major discipline areas',
        help: 'High-level discipline areas such as Cloud Architecture, SRE, and CI/CD.',
        icon: Layers,
      },
      {
        id: 'competencies',
        label: 'Skills & Competencies',
        shortDesc: 'Assessed capabilities',
        help: 'Granular technical competencies that engineers are evaluated against.',
        icon: Cpu,
      },
      {
        id: 'technologies',
        label: 'Tools & Tech',
        shortDesc: 'Frameworks & stacks',
        help: 'Specific tools, platforms, and technologies linked to competencies.',
        icon: Zap,
      },
      {
        id: 'categories',
        label: 'Categories & Tags',
        shortDesc: 'Classification labels',
        help: 'Tagging and metadata categories used to organize skills.',
        icon: Tag,
      },
      {
        id: 'skill-map',
        label: 'Interactive Skill Map',
        shortDesc: 'Visual taxonomy graph',
        help: 'Interactive relational graph connecting domains, skills, and tools.',
        icon: Network,
        badge: 'Interactive',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      },
    ],
  },
];
