import { authApi } from '@/services/api/authApi';
import { useProfileStore } from '@/store/profileStore';

export async function refreshSessionProfile(): Promise<void> {
  const profile = await authApi.getMe();
  useProfileStore.getState().setProfile(profile);
}
