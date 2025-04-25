import { useDeviceDetection } from './use-device-detection';

export function useIsMobile() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.isMobile || deviceInfo.type === 'mobile' || deviceInfo.type === 'tablet';
}