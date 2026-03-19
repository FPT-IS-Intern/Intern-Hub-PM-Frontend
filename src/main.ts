import { initFederation } from '@angular-architects/native-federation';
// trigger deploy
initFederation()
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
