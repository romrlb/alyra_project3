# Composant AlertMessage

Ce composant a été créé pour standardiser et simplifier l'utilisation des alertes dans l'application. Il permet de réduire la duplication de code et d'assurer une cohérence visuelle dans toute l'interface.

## Avantages

- **Réduction de la duplication de code** : Remplace plusieurs lignes de code par un seul composant
- **Cohérence visuelle** : Assure que toutes les alertes ont le même style
- **Responsive par défaut** : Adapte automatiquement la taille du texte et des icônes selon la taille de l'écran
- **Facilité de maintenance** : Permet de modifier le style de toutes les alertes en un seul endroit

## Utilisation

```jsx
import AlertMessage from './AlertMessage';

// Alerte de type "success" (fond vert)
<AlertMessage 
  type="success"
  title="Information"
  message="Opération réussie !"
/>

// Alerte de type "warning" (fond ambre)
<AlertMessage 
  type="warning"
  title="Information"
  message="Attention, cette action est irréversible."
/>

// Alerte de type "error" (fond rouge)
<AlertMessage 
  type="error"
  title="Erreur"
  message="Une erreur est survenue."
/>

// Alerte de type "info" (fond bleu)
<AlertMessage 
  type="info"
  title="Information"
  message="Voici une information importante."
/>

// Pour les longs textes (comme les hash de transaction)
<AlertMessage 
  type="success"
  title="Information"
  message={`Transaction Hash: ${hash}`}
  breakAll={true}  // Permet de casser les longs textes
/>
```

## Propriétés

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| type | "success" \| "warning" \| "error" \| "info" | Oui | Type d'alerte qui détermine la couleur de fond |
| title | string | Oui | Titre de l'alerte |
| message | string | Oui | Message principal de l'alerte |
| breakAll | boolean | Non | Si `true`, permet de casser les longs textes (utile pour les hash) |

## Fichiers utilisant le composant

Les fichiers suivants utilisent le composant `AlertMessage` :

1. `frontend/components/votingSteps/Workflow.jsx`
2. `frontend/components/votingSteps/Proposals.jsx`
3. `frontend/components/votingSteps/VoterWhitelist.jsx`
4. `frontend/components/votingSteps/Votes.jsx`
5. `frontend/components/votingSteps/Results.jsx`

## Correspondance des types d'alertes

| Classe CSS originale | Type dans AlertMessage |
|---------------------|------------------------|
| bg-lime-200 | "success" |
| bg-amber-100, bg-amber-200 | "warning" |
| bg-red-400 | "error" |
| bg-blue-100, bg-green-100 | "info" | 