// Links that open the app from outside. The share menu opens Happy Orange with an address like
// "projectheal://dataUrl=projecthealShareKey…"; that is not a screen, so send it to the Mind tab, where
// ShareReceiver (src/components/ShareReceiver.tsx) puts the shared link into Learning.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('dataUrl=')) return '/';
    // Back from the NeoSapien sign-in page (decision 0050): show Connectors, now with NeoSapien connected.
    if (path.includes('neosapien')) return '/connectors';
    return path;
  } catch {
    return '/';
  }
}
