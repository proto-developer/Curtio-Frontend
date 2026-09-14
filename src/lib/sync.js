import { getCookie, eraseCookie } from './cookies';
import { addNewLinkId } from './newLinkTracker';
import { createUrl } from '@/api/urls';

export async function syncPendingUrl(apiToken) {
  const pendingUrl = getCookie('brevly_pending_url') || localStorage.getItem('pending_url');
  const expiresAt = localStorage.getItem('pending_url_expires_at');

  if (expiresAt && Date.now() > Number(expiresAt)) {
    eraseCookie('brevly_pending_url');
    eraseCookie('brevly_guest_generated');
    localStorage.removeItem('pending_url');
    localStorage.removeItem('pending_url_expires_at');
    return;
  }

  if (pendingUrl) {
    try {
      const data = await createUrl({ originalUrl: pendingUrl }, { token: apiToken });
      if (data.success) {
        console.log("Successfully synced pending URL to DB:", data);
        if (data.url?._id) {
          addNewLinkId(data.url._id);
        }
      } else {
        console.error("Failed to sync pending guest URL:", data.message);
      }
    } catch (err) {
      console.error("Network error while syncing pending guest URL:", err);
    } finally {
      // Clear all guest-related cookies & localStorage
      eraseCookie('brevly_pending_url');
      eraseCookie('brevly_guest_generated');
      localStorage.removeItem('pending_url');
      localStorage.removeItem('pending_url_expires_at');
    }
  }
}
