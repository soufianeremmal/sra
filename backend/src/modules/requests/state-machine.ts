import { RequestStatus } from './models/request.model';

// Every legal transition — forward and backward.
// Read as: "from this status, you can go to any of these statuses."
// Terminé is deliberately absent from the keys — once done, no transitions allowed.
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Draft: ['À faire'],
  'À faire': ['En cours'],
  'En cours': ['À faire', 'Prêt à tester'],
  'Prêt à tester': ['En cours', 'Emballé'],
  Emballé: ['Prêt à tester', 'Prêt à enlever'],
  'Prêt à enlever': ['Emballé', 'Expédié'],
  Expédié: ['Terminé'],
  Terminé: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedNextStatuses(from: RequestStatus): RequestStatus[] {
  return TRANSITIONS[from] ?? [];
}