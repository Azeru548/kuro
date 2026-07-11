/**
 * Firebase Admin SDK (server-only).
 * Wire this up when FIREBASE_ADMIN_* env vars are set.
 * Used for privileged writes, custom claims, and Paystack webhook verification paths.
 */

import type { App } from "firebase-admin/app";

let adminApp: App | null = null;

export function isAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

export async function getAdminApp() {
  if (!isAdminConfigured()) return null;
  if (adminApp) return adminApp;

  const { cert, getApps, initializeApp } = await import("firebase-admin/app");

  if (getApps().length) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

export async function getAdminDb() {
  const app = await getAdminApp();
  if (!app) return null;
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(app);
}
