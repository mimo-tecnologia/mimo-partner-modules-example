import { Capacitor } from '@capacitor/core';

export const PARTNER_MODULES = ['chef', 'fit', 'music', 'news', 'scan'] as const;
export type PartnerModule = (typeof PARTNER_MODULES)[number];

const BROWSER_PROXY_PATH = '/partner-proxy';

interface GenerateModuleLinkParams {
  baseUrl: string;
  apiKey: string;
  partnerId: string;
  document: string;
  moduleId: PartnerModule;
}

function resolveBaseUrl(baseUrl: string): string {
  return Capacitor.isNativePlatform() ? baseUrl.replace(/\/+$/, '') : BROWSER_PROXY_PATH;
}

async function postJson<ResponseData>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<ResponseData> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} em ${url}: ${responseText}`);
  }
  const envelope = JSON.parse(responseText) as { data?: ResponseData | null };
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error(`Resposta sem "data" em ${url}: ${responseText}`);
  }
  return envelope.data;
}

export async function generateModuleLink(params: GenerateModuleLinkParams): Promise<string> {
  const baseUrl = resolveBaseUrl(params.baseUrl);

  const { token } = await postJson<{ token: string }>(
    `${baseUrl}/auth/token`,
    { 'x-api-key': params.apiKey },
    { partnerId: params.partnerId, document: params.document },
  );

  const { url } = await postJson<{ url: string }>(
    `${baseUrl}/partner/modules/link`,
    { Authorization: `Bearer ${token}` },
    { moduleId: params.moduleId, partnerId: params.partnerId },
  );

  return url;
}
