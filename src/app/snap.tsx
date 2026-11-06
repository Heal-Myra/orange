// projectheal://snap — "snap my meal" from Siri, the Action Button or Back Tap (founder, 6 Nov 2026): opens Body › Food
// and starts the camera straight away.
import { Redirect } from 'expo-router';
export default function Snap() {
  return <Redirect href={{ pathname: '/body', params: { snap: String(Date.now()) } }} />;
}
