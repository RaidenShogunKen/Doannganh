import { useEffect, useState } from 'react';
import { uploadApi } from './api';


export const AVATAR_UPDATED_EVENT = 'qldt_avatar_updated';

export function getAvatarForUser(email?: string | null, role?: string): string | null {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  const customSpecific = localStorage.getItem(`qldt_avatar_${cleanEmail}`);
  if (customSpecific) return customSpecific;

  return null;
}

export function saveAvatarForUser(email: string, avatarDataUrl: string): void {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();

  localStorage.setItem(`qldt_avatar_${cleanEmail}`, avatarDataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AVATAR_UPDATED_EVENT, {
        detail: { email: cleanEmail, avatar: avatarDataUrl },
      }),
    );
  }
}

export function useUploadedAvatar(url?: string) {
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    setPreview(undefined);
    if (!url) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    uploadApi.read(url, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted && /^image\/(png|jpeg)$/.test(data.type)) {
        objectUrl = URL.createObjectURL(data);
        setPreview(objectUrl);
      }
    }).catch(() => {});
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return preview;
}
