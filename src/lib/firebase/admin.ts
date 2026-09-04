import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function getFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getMessaging(app);
}

export async function sendFirebasePush(tokens: string[], title: string, body: string) {
  const messaging = getFirebaseAdmin();
  if (!messaging || !tokens.length) return { invalidTokens: [] as string[] };
  const response = await messaging.sendEachForMulticast({ tokens, notification: { title, body } });
  return { invalidTokens: response.responses.flatMap((result, index) => result.success ? [] : [tokens[index]]) };
}
