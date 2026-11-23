import { useEffect, useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { ModuleViewer } from './ModuleViewer';
import { resolveModulePresentation } from './module-presentation';
import { generateModuleLink, PARTNER_MODULES, type PartnerModule } from './partner-api';
import { loadSettings, saveSettings, type Settings } from './settings';
import './App.css';

export default function App() {
  const isNative = Capacitor.isNativePlatform();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <Key extends keyof Settings>(key: Key, value: Settings[Key]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const openModule = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const url = await generateModuleLink(settings);
      if (resolveModulePresentation(settings.moduleId) === 'browserTab') {
        await Browser.open({ url });
      } else {
        setIframeUrl(url);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (iframeUrl) {
    return <ModuleViewer url={iframeUrl} title={settings.moduleId} onClose={() => setIframeUrl(null)} />;
  }

  return (
    <main className="setup">
      <h1>MIMO Partner</h1>
      <p className="hint">Exemplo de integração dos módulos web num app React + Capacitor.</p>

      <section>
        <label>
          URL do partner api
          <input
            value={settings.baseUrl}
            onChange={(event) => updateSetting('baseUrl', event.target.value)}
            disabled={!isNative}
          />
        </label>
        {!isNative && (
          <p className="hint">
            No navegador as chamadas passam pelo proxy do Vite (variável PARTNER_API_URL ao subir o dev
            server).
          </p>
        )}
        <label>
          x-api-key
          <input
            type="password"
            value={settings.apiKey}
            onChange={(event) => updateSetting('apiKey', event.target.value)}
          />
        </label>
        <label>
          Código do parceiro (partnerId)
          <input
            value={settings.partnerId}
            onChange={(event) => updateSetting('partnerId', event.target.value)}
          />
        </label>
        <label>
          CPF do usuário
          <input
            inputMode="numeric"
            value={settings.document}
            onChange={(event) => updateSetting('document', event.target.value)}
          />
        </label>
        <label>
          Módulo
          <select
            value={settings.moduleId}
            onChange={(event) => updateSetting('moduleId', event.target.value as PartnerModule)}
          >
            {PARTNER_MODULES.map((moduleId) => (
              <option key={moduleId} value={moduleId}>
                {moduleId}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          {resolveModulePresentation(settings.moduleId) === 'browserTab'
            ? 'Este módulo abre no navegador do sistema (Custom Tab no Android).'
            : 'Este módulo abre num iframe dentro do app.'}
        </p>
        <button className="primary" onClick={openModule} disabled={isLoading}>
          {isLoading ? 'Gerando link...' : 'Abrir módulo'}
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>
    </main>
  );
}
