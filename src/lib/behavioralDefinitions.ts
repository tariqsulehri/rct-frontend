import { BehavioralLevelCode } from '@/types/behavioral';

export interface LevelDetail {
  code: BehavioralLevelCode;
  label: string;
  weightCw: number;
  weightDec: string; // e.g. "0.20"
  minCw: number;
  maxCw: number;
  summary: string;
}

export const BEHAVIORAL_LEVEL_DETAILS: Record<BehavioralLevelCode, LevelDetail> = {
  L1: {
    code: 'L1',
    label: 'Intermediate',
    weightCw: 20,
    weightDec: '0.20',
    minCw: 0,
    maxCw: 30,
    summary: 'Applies basic behavioral competencies with supervision and direct guidance.',
  },
  L2: {
    code: 'L2',
    label: 'Proficient',
    weightCw: 40,
    weightDec: '0.40',
    minCw: 30,
    maxCw: 50,
    summary: 'Independently applies behavioral competencies in daily engineering & project workflows.',
  },
  L3: {
    code: 'L3',
    label: 'Advanced',
    weightCw: 60,
    weightDec: '0.60',
    minCw: 50,
    maxCw: 70,
    summary: 'Role model for peers; actively mentors team members and guides best practices.',
  },
  L4: {
    code: 'L4',
    label: 'Leads',
    weightCw: 80,
    weightDec: '0.80',
    minCw: 70,
    maxCw: 90,
    summary: 'Drives domain standards, cross-team technical alignment, and engineering culture.',
  },
  L5: {
    code: 'L5',
    label: 'Strategic',
    weightCw: 100,
    weightDec: '1.00',
    minCw: 90,
    maxCw: 100,
    summary: 'Sets strategic vision, shapes enterprise culture, and influences core business outcomes.',
  },
};

export const BEHAVIORAL_COMPETENCY_DEFINITIONS: Record<string, Record<BehavioralLevelCode, string>> = {
  ownership: {
    L1: 'Takes responsibility for assigned individual tasks and completes assigned tickets with direct guidance.',
    L2: 'Takes full ownership of feature deliverables, communicates delays proactively, and owns end-to-end task outcomes.',
    L3: 'Owns service reliability & module delivery, anticipates operational risks, and takes accountability for team commitments.',
    L4: 'Owns domain-level systems, drives root-cause accountability for incidents across teams, and establishes operational SLAs.',
    L5: 'Establishes organization-wide accountability frameworks, owns strategic platform availability, and shapes business outcomes.',
  },
  collaboration: {
    L1: 'Works effectively within immediate team and communicates task progress clearly during daily standups.',
    L2: 'Collaborates smoothly across disciplines (DevOps, QA, Dev) and builds constructive working relationships.',
    L3: 'Drives cross-functional alignment, resolves technical friction constructively, and influences technical decisions.',
    L4: 'Influences multi-team architectural decisions, aligns cross-departmental roadmaps, and builds organizational consensus.',
    L5: 'Shapes enterprise-wide collaborative vision, drives executive stakeholder alignment, and fosters an inclusive culture.',
  },
  customer_business: {
    L1: 'Understands basic project goals and customer-facing impact of assigned engineering tasks.',
    L2: 'Aligns technical work with product requirements and considers customer impact in feature implementation.',
    L3: 'Translates business requirements into resilient technical designs and optimizes delivery for user value.',
    L4: 'Drives technical initiatives that deliver measurable business growth, cost efficiency, and customer satisfaction.',
    L5: 'Shapes long-term tech strategy to drive core business vision, market differentiation, and customer retention.',
  },
  communication: {
    L1: 'Communicates status clearly in written PR notes, standard tickets, and daily standups.',
    L2: 'Writes clear technical specs, design docs, and bug reports; communicates blockers promptly to stakeholders.',
    L3: 'Articulates complex technical concepts to non-technical stakeholders and facilitates effective technical reviews.',
    L4: 'Delivers compelling technical presentations, writes high-impact postmortems, and leads architecture forums.',
    L5: 'Represents company at industry events, communicates executive-level strategy, and inspires organizational direction.',
  },
  adaptability: {
    L1: 'Open to feedback and willing to learn new tools, scripts, and frameworks under guidance.',
    L2: 'Rapidly learns and applies new technologies to project requirements; adapts smoothly to scope changes.',
    L3: 'Embraces ambiguity, mentors others through technology shifts, and drives continuous team learning.',
    L4: 'Anticipates industry technology shifts, leads legacy modernization, and fosters an agile learning organization.',
    L5: 'Champions organizational innovation, pivots strategy in response to market disruptions, and sets research direction.',
  },
  integrity: {
    L1: 'Follows security standards, coding ethics, and company policies consistently in daily work.',
    L2: 'Demonstrates sound technical judgment, protects sensitive customer data, and reports security risks immediately.',
    L3: 'Upholds high ethical standards in architectural tradeoffs, pushes back against compromised quality, and mentors on compliance.',
    L4: 'Champions security-first engineering culture, enforces compliance governance, and acts as an ethical compass.',
    L5: 'Establishes enterprise security & ethics policy, manages critical risk decisions, and protects organizational trust.',
  },
  develops_people: {
    L1: 'Shares basic technical knowledge and onboarding tips with immediate peers.',
    L2: 'Conducts helpful code reviews and assists junior engineers with technical onboarding and workflow setup.',
    L3: 'Actively mentors junior/mid-level engineers, creates growth opportunities, and provides actionable feedback.',
    L4: 'Builds structured mentorship programs, sponsors career progression of senior staff, and elevates team capability.',
    L5: 'Shapes organization-wide talent development strategy, cultivates engineering leadership pipeline, and mentors principals.',
  },
  strategic_thinking: {
    L1: 'Focuses on immediate task execution and understands short-term sprint goals.',
    L2: 'Thinks ahead to upcoming milestones and considers system maintainability in current technical designs.',
    L3: 'Connects quarterly engineering OKRs with broader system architecture and plans multi-sprint technical roadmaps.',
    L4: 'Defines multi-year technical strategy, evaluates vendor/platform build-vs-buy decisions, and mitigates tech debt.',
    L5: 'Shapes enterprise technology vision, aligns tech investments with 3-5 year corporate strategy, and drives innovation.',
  },
  drives_change: {
    L1: 'Participates constructively in team process improvements and retrospectives.',
    L2: 'Identifies friction points in workflow and proposes practical improvements for automation and CI/CD.',
    L3: 'Champions process modernizations (e.g. GitOps, IaC standards) and leads execution across multiple projects.',
    L4: 'Drives transformational change across engineering orgs (e.g. SRE transition, DevSecOps adoption) despite resistance.',
    L5: 'Leads enterprise-wide digital transformation, overhauls operational paradigms, and establishes industry benchmarks.',
  },
  decision_making: {
    L1: 'Makes sound task-level technical choices with input from senior engineers.',
    L2: 'Evaluates technical tradeoffs independently and makes data-driven decisions for module implementation.',
    L3: 'Decides complex architectural tradeoffs under pressure, balancing speed, quality, and maintainability.',
    L4: 'Makes high-stakes technical decisions for critical systems, managing trade-offs across multiple domain teams.',
    L5: 'Makes executive-level technology choices with enterprise-wide impact, managing high business ambiguity and risk.',
  },
  builds_teams: {
    L1: 'Contributes positively to team morale and fosters a welcoming team environment.',
    L2: 'Helps onboard new team members and promotes psychological safety in team discussions.',
    L3: 'Leads feature pods or project initiatives, fosters team cohesion, and drives collective accountability.',
    L4: 'Builds high-performing engineering teams, hires top talent, and establishes strong team culture and operational rhythm.',
    L5: 'Scales engineering organizations, structures multi-team departments, and inspires engineering excellence.',
  },
};

export const BEHAVIORAL_COMPETENCY_SUBTITLES: Record<string, string> = {
  ownership: 'Task completion, proactive blocker communication, and end-to-end service delivery.',
  collaboration: 'Cross-functional teamwork, constructive alignment, and technical friction resolution.',
  customer_business: 'Aligning technical designs with product goals and optimizing user value.',
  communication: 'Clear technical specs, design docs, PR descriptions, and stakeholder articulation.',
  adaptability: 'Embracing technology shifts, learning speed, and navigating ambiguity.',
  integrity: 'Security standards, compliance, data privacy, and ethical tradeoffs.',
  develops_people: 'Mentoring peers, conducting constructive code reviews, and junior onboarding.',
  strategic_thinking: 'Connecting sprint OKRs with system architecture and long-term technical roadmaps.',
  drives_change: 'Championing automation, process modernization, and engineering best practices.',
  decision_making: 'Evaluating technical tradeoffs and making data-driven architectural choices.',
  builds_teams: 'Fostering team cohesion, pod leadership, hiring, and psychological safety.',
};

export const BEHAVIORAL_EVIDENCE_TAGS: Record<string, string[]> = {
  ownership: ['+ Ticket Delivery', '+ Incident Postmortem', '+ SLA Ownership', '+ Proactive Update'],
  collaboration: ['+ Cross-Team Sync', '+ PR Review Feedback', '+ DevOps & QA Alignment', '+ Conflict Resolution'],
  customer_business: ['+ Feature Spec Alignment', '+ User Value Optimization', '+ Customer Issue Fix', '+ Product Feedback'],
  communication: ['+ Tech Design Doc', '+ Architecture ADR', '+ Sprint Demo Presentation', '+ Clear PR Notes'],
  adaptability: ['+ Tech Stack Shift', '+ Scope Pivot', '+ Mentoring Shift', '+ Process Modernization'],
  integrity: ['+ Security Governance', '+ Compliance Audit', '+ Data Privacy Protection', '+ Quality Pushback'],
  develops_people: ['+ Mentorship Session', '+ Code Review Guidance', '+ Junior Onboarding', '+ Skill Workshop'],
  strategic_thinking: ['+ Architecture Roadmap', '+ Tech Debt Reduction', '+ OKR Alignment', '+ Build-vs-Buy Evaluation'],
  drives_change: ['+ GitOps Migration', '+ CI/CD Automation', '+ Process Refactoring', '+ Tool Standardization'],
  decision_making: ['+ Tradeoff Analysis', '+ Root-Cause Analysis', '+ High-Stakes Tech Choice', '+ Data-Driven Pivot'],
  builds_teams: ['+ Team Onboarding', '+ Pod Leadership', '+ Psychological Safety', '+ Hiring Interview'],
};

