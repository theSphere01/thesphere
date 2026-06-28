"use client";

export const PROFILE_ID_KEY = "sphere_profile_id";
export const PROFILE_NAME_KEY = "sphere_profile_name";
export const AUTH_CHANGE_EVENT = "sphere-auth-change";

export type ActiveProfileSession = {
  id: string;
  name?: string | null;
};

function safeGet(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }
}

function safeRemove(storage: Storage | undefined, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }
}

function dispatchAuthChange() {
  try {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // Ignore non-browser execution.
  }
}

export function getActiveProfileSession(): ActiveProfileSession | null {
  if (typeof window === "undefined") return null;

  const id =
    safeGet(window.localStorage, PROFILE_ID_KEY) ??
    safeGet(window.sessionStorage, PROFILE_ID_KEY);
  if (!id) return null;

  const name =
    safeGet(window.localStorage, PROFILE_NAME_KEY) ??
    safeGet(window.sessionStorage, PROFILE_NAME_KEY);

  safeSet(window.localStorage, PROFILE_ID_KEY, id);
  safeSet(window.sessionStorage, PROFILE_ID_KEY, id);
  if (name) {
    safeSet(window.localStorage, PROFILE_NAME_KEY, name);
    safeSet(window.sessionStorage, PROFILE_NAME_KEY, name);
  }

  return { id, name };
}

export function setActiveProfileSession(profile: ActiveProfileSession) {
  if (typeof window === "undefined") return;
  safeSet(window.localStorage, PROFILE_ID_KEY, profile.id);
  safeSet(window.sessionStorage, PROFILE_ID_KEY, profile.id);

  if (profile.name) {
    safeSet(window.localStorage, PROFILE_NAME_KEY, profile.name);
    safeSet(window.sessionStorage, PROFILE_NAME_KEY, profile.name);
  }

  dispatchAuthChange();
}

export function clearActiveProfileSession() {
  if (typeof window === "undefined") return;
  safeRemove(window.localStorage, PROFILE_ID_KEY);
  safeRemove(window.localStorage, PROFILE_NAME_KEY);
  safeRemove(window.sessionStorage, PROFILE_ID_KEY);
  safeRemove(window.sessionStorage, PROFILE_NAME_KEY);
  dispatchAuthChange();
}
