// Re-export the native module. On web, it will be resolved to SpaceCameraModule.web.ts
// and on native platforms to SpaceCameraModule.ts
export { default } from './src/SpaceCameraModule';
export * from './src/SpaceCamera.types';
