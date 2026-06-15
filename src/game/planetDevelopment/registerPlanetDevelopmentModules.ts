import { registerPlanetDevelopmentModule } from './planetDevelopmentRegistry';

let registered = false;

/** UI DetailView는 overlay 측에서 registerPlanetDevelopmentModule 호출 */
export function ensurePlanetDevelopmentCatalogLoaded(): void {
  if (registered) return;
  registered = true;
}

export function markPlanetDevelopmentModuleRegistered(): void {
  registered = true;
}

export function isPlanetDevelopmentModulesRegistered(): boolean {
  return registered;
}

export { registerPlanetDevelopmentModule };
