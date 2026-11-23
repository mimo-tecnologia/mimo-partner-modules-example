# MIMO Partner: exemplo de integração dos módulos web

App de exemplo em React + Vite, empacotado com Capacitor, que mostra como um parceiro abre os módulos web da MIMO (chef, fit, music, news e scan) dentro do próprio aplicativo, usando os links gerados pelo partner api.

Serve como referência de implementação e como ferramenta de diagnóstico: se um módulo abre aqui e não abre no seu app, a diferença está na integração.

## Como cada módulo é aberto

| Módulo | Como abrir | Motivo |
|---|---|---|
| chef, fit, music, news | `<iframe>` dentro do WebView do app | Funcionam embutidos sem requisito especial |
| scan | Navegador do sistema (Custom Tab no Android, `SFSafariViewController` no iOS) | Exige isolamento cross-origin, que o WebView do Android não oferece |

A regra está em [src/module-presentation.ts](src/module-presentation.ts).

### Por que o scan não abre em iframe

O scan mede sinais vitais pela câmera com um SDK em WebAssembly que usa `SharedArrayBuffer`. Os navegadores só liberam `SharedArrayBuffer` em páginas com isolamento cross-origin (cabeçalhos COOP e COEP).

O WebView do Android não ativa esse isolamento, mesmo recebendo os cabeçalhos corretos. Isso vale para qualquer tecnologia que use o WebView do sistema: Capacitor, Cordova, Ionic, React Native e Flutter. Dentro dele o scan para com o erro:

```
Browser incompatible: SharedArrayBuffer is not supported by this browser
or the webpage was loaded without COOP/COEP headers.
```

A Custom Tab roda no Chrome de verdade, onde o isolamento funciona. Por isso o scan abre com `Browser.open` do plugin `@capacitor/browser`, e o usuário volta para o app pelo botão de fechar da aba ou pelo voltar do Android.

No iOS o exemplo segue a mesma regra: o `Browser.open` abre o scan no `SFSafariViewController`, e o usuário volta pelo botão de concluir do Safari. O scan em iframe dentro do WKWebView não foi testado.

## Fluxo com o partner api

1. `POST /auth/token` com o header `x-api-key` e o corpo `{ partnerId, document }` devolve o token do usuário.
2. `POST /partner/modules/link` com `Authorization: Bearer <token>` e o corpo `{ moduleId, partnerId }` devolve a URL do módulo.
3. A URL é aberta em iframe ou no navegador, conforme o módulo.

Todas as respostas vêm no envelope `{ status, message, data }`; o conteúdo útil está em `data`. A URL do módulo expira em 1 hora, então gere uma nova a cada abertura.

A implementação está em [src/partner-api.ts](src/partner-api.ts).

> **Atenção:** neste exemplo a `x-api-key` é digitada na tela para facilitar o teste. Num app real ela nunca deve ir para o aplicativo: gere o link no seu backend e entregue ao app apenas a URL do módulo.

## Como aplicar no seu app

Módulos em iframe:

```tsx
<iframe
  src={moduleUrl}
  title="Módulo MIMO"
  allow="camera; microphone; autoplay; clipboard-write; fullscreen"
  style={{ width: '100%', height: '100%', border: 'none' }}
/>
```

Scan:

```ts
import { Browser } from '@capacitor/browser';

await Browser.open({ url: scanUrl });
```

### Permissões do app

Os módulos em iframe usam câmera, microfone e reconhecimento de voz (o chef, por exemplo, aceita o nome do prato por voz). Como rodam dentro do WebView, dependem das permissões declaradas pelo seu app. O scan abre no navegador e usa a permissão de câmera do próprio navegador.

| Plataforma | Onde | O que declarar |
|---|---|---|
| Android | `AndroidManifest.xml` | `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` |
| iOS | `Info.plist` | `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription` |

No iOS, sem a `NSSpeechRecognitionUsageDescription` a gravação por voz do chef começa e para na mesma hora, sem mensagem de erro.

### Área segura no iOS

No iOS o WebView ocupa a tela inteira, inclusive a região do notch e da barra de status. O exemplo usa `viewport-fit=cover` no `index.html` e `env(safe-area-inset-*)` no CSS ([src/App.css](src/App.css)) para o cabeçalho não ficar embaixo da barra de status.

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| [src/partner-api.ts](src/partner-api.ts) | Chamadas ao partner api e geração do link |
| [src/module-presentation.ts](src/module-presentation.ts) | Define se o módulo abre em iframe ou no navegador |
| [src/ModuleViewer.tsx](src/ModuleViewer.tsx) | Tela com o iframe do módulo |
| [src/App.tsx](src/App.tsx) | Formulário e abertura do módulo |
| [src/settings.ts](src/settings.ts) | Campos do formulário salvos no `localStorage` |
| [android/](android/) | Projeto Android gerado pelo Capacitor |
| [ios/](ios/) | Projeto iOS gerado pelo Capacitor |

## Rodar no navegador

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

No navegador as chamadas passam por um proxy do Vite (`/partner-proxy`), por causa de CORS. O destino padrão é o ambiente de homologação (`https://mimo-partner-api-222552461205.us-central1.run.app`); para apontar para outro ambiente:

```bash
PARTNER_API_URL=https://<url-do-partner-api> npm run dev
```

## Rodar no Android

Requisitos: JDK 17 e Android SDK (o projeto usa Capacitor 6).

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

No app nativo as chamadas usam o `CapacitorHttp` (HTTP nativo, sem CORS), e a URL do partner api é editável na tela.

Para inspecionar o WebView, conecte o aparelho por USB e abra `chrome://inspect` no Chrome do computador. A depuração está habilitada em `capacitor.config.json` (`webContentsDebuggingEnabled`); desligue isso num app de produção.

## Rodar no iOS

Requisitos: macOS com Xcode e CocoaPods, e uma conta Apple Developer para assinar o app.

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

No Xcode, selecione o target `App`, escolha o seu time em *Signing & Capabilities* e rode no aparelho. O projeto não traz time de assinatura configurado.

## Onde foi validado

| Plataforma | Aparelho | Resultado |
|---|---|---|
| Android | Galaxy M54, Chrome 157 | Chef, fit e music em iframe e scan em Custom Tab funcionando |
| iOS | iPhone 15 | Módulos em iframe (inclusive a voz do chef) e scan no `SFSafariViewController` funcionando |
| Navegador | Chrome no macOS | Chef e scan funcionando em aba |

## Limitações conhecidas

- **O navegador do sistema mostra a própria barra.** Custom Tab e `SFSafariViewController` exibem a barra de endereço; é o comportamento padrão dos componentes.
- **A primeira abertura do scan demora.** O SDK de medição tem cerca de 35 MB e é baixado na primeira vez.
