import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { SpaceBlurred, SpaceFrame } from './SpaceCamera.types';

declare class SpaceCameraModule extends NativeModule<{}> {
  /** A few still pictures spread across a video, as JPEG files on the phone. */
  framesAsync(uri: string, count: number, maxSize: number): Promise<SpaceFrame[]>;
  /** The photo with faces blurred (the same file when there are none). */
  blurFacesAsync(uri: string): Promise<SpaceBlurred>;
}

/** null on builds before 14 and on the web: callers carry on without it. */
export default requireOptionalNativeModule<SpaceCameraModule>('SpaceCamera');
