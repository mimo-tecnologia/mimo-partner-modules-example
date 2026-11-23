import type { PartnerModule } from './partner-api';

export type ModulePresentation = 'iframe' | 'browserTab';

// O scan usa SharedArrayBuffer, que exige isolamento cross-origin (COOP/COEP).
// O WebView do Android não ativa esse isolamento, então o scan abre no navegador
// do sistema (Custom Tab no Android), nunca em iframe.
const MODULE_PRESENTATION: Record<PartnerModule, ModulePresentation> = {
  chef: 'iframe',
  fit: 'iframe',
  music: 'iframe',
  news: 'iframe',
  scan: 'browserTab',
};

export function resolveModulePresentation(moduleId: PartnerModule): ModulePresentation {
  return MODULE_PRESENTATION[moduleId];
}
