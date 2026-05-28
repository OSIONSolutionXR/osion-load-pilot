/**
 * OSION Load Pilot - TypeScript Types
 * Project Twin System für überladene Unternehmer
 */

// Core Entity: Project
export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: 'detected' | 'analyzing' | 'active' | 'stalled' | 'completed';
  confidence: number; // 0-1
  loadScore: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

// Core Entity: Actor
export interface Actor {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'system' | 'ghost';
  role: string;
  contact?: string;
  responsiveness: number; // 1-10
  availability: 'available' | 'limited' | 'blocked';
  mood?: 'urgent' | 'neutral' | 'relaxed' | 'frustrated';
  avatar?: string; // Emoji oder Icon-Name
}

// Core Entity: Dependency
export interface Dependency {
  id: string;
  from: string; // Actor ID
  to: string; // Actor ID oder "Project"
  type: 'document' | 'approval' | 'information' | 'decision' | 'resource' | 'wait';
  description: string;
  blocking: boolean;
  deadline?: Date;
  flexible: boolean;
}

// Core Entity: Risk
export interface Risk {
  id: string;
  projectId: string;
  description: string;
  probability: number; // 0-1
  impact: number; // 1-10
  timeline: string;
  mitigation: string[];
}

// Core Entity: Action (Next Move)
export interface Action {
  id: string;
  projectId: string;
  description: string;
  targetActor: string; // Actor ID
  type: 'contact' | 'prepare' | 'decide' | 'delegate' | 'wait' | 'inform';
  priority: number; // 1-10, berechnet
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  deadline?: Date;
  dependencies: string[]; // Action IDs
  template?: string; // Email-Vorlage etc.
}

// Analysis Result
export interface AnalysisResult {
  project: Project;
  actors: Actor[];
  dependencies: Dependency[];
  risks: Risk[];
  actions: Action[];
}

// View State für Navigation (neu mit Sidebar)
export type ViewState = 
  | 'start'        // Startscreen - Einstieg
  | 'command'      // Command-Zentrale
  | 'chat'         // OSION KI-Chat
  | 'projects'     // Projekte-Übersicht
  | 'input'        // Freitext-Eingabe
  | 'measures'     // Maßnahmen-Übersicht
  | 'deadlines'    // Fristen-Übersicht
  | 'simulation'   // Project Simulator
  | 'agents'       // Agenten-Übersicht
  | 'memory'       // Memory/System
  | 'settings'     // Einstellungen
  | 'twin';        // Project Twin - nur intern, nicht in Sidebar

// Simulation Result
export interface SimulationResult {
  scenario: string;
  probability: number;
  impact: string;
  timeline: string;
}
