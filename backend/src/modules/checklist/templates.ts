// The Go/No-Go checklist template — taken from the real Sampling checklist
// shared by Paul. When a Request enters "En cours" for the first time,
// a copy of this template is created as ChecklistItem documents attached to that request.

export interface ChecklistTemplateItem {
  category: string;
  label: string;
}

export const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  // Vérifications mécaniques générales
  { category: 'Mécaniques générales', label: 'Vélo propre et en bon état' },
  { category: 'Mécaniques générales', label: 'Pose des stickers' },
  { category: 'Mécaniques générales', label: 'Verrouillage batterie' },
  { category: 'Mécaniques générales', label: 'Cache prise batterie' },
  { category: 'Mécaniques générales', label: 'Selle stable' },
  { category: 'Mécaniques générales', label: 'Présence des vis antivol' },
  { category: 'Mécaniques générales', label: 'Freins bien réglés' },
  { category: 'Mécaniques générales', label: 'Pression pneus' },
  { category: 'Mécaniques générales', label: 'Feux av/ar fonctionnels' },
  { category: 'Mécaniques générales', label: 'Présence des catadioptres' },

  // Vérifications spécifiques Fusion 2
  { category: 'Spécifiques Fusion 2', label: 'Boîtier verrou fonctionnel' },
  { category: 'Spécifiques Fusion 2', label: 'Potence RFID fonctionnelle' },
  { category: 'Spécifiques Fusion 2', label: 'Main NPI 2 minimum' },
  { category: 'Spécifiques Fusion 2', label: 'Type de panier (métal ou plastique)' },

  // Vérifications logicielles
  { category: 'Logicielles', label: 'Environnement : Partners' },
  { category: 'Logicielles', label: 'Hardware Parts paramétrées' },
  { category: 'Logicielles', label: 'Deploy Group : Sampling' },
  { category: 'Logicielles', label: 'Area : SAMPLING (Global)' },
  { category: 'Logicielles', label: 'Firmware vélo à jour' },
  { category: 'Logicielles', label: 'Product config vélo à jour' },

  // Vérifications fonctionnelles
  { category: 'Fonctionnelles', label: 'Assistance électrique' },
  { category: 'Fonctionnelles', label: 'Démarrage d\'un trajet avec l\'App' },
  { category: 'Fonctionnelles', label: 'Déverrouillage avec carte RFID' },
  { category: 'Fonctionnelles', label: 'Connexion réseau du vélo' },
  { category: 'Fonctionnelles', label: 'Déverrouillage de la batterie' },
  { category: 'Fonctionnelles', label: 'Connexion Bluetooth' },

  // Accessoires (si besoin)
  { category: 'Accessoires', label: 'Porte-bagage' },
  { category: 'Accessoires', label: 'Téléphone' },
  { category: 'Accessoires', label: 'Carte RFID' },
  { category: 'Accessoires', label: 'Batterie supplémentaire + chargeur' },
];