import Editor, { loader, Monaco } from '@monaco-editor/react';
import { createRef, useEffect, useMemo, useRef } from 'react';
import * as monaco from 'monaco-editor';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  MessageTransports,
} from 'monaco-languageclient';
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';

loader.config({ monaco });

export function createUrl(
  hostname: string,
  port: number,
  path: string
): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${hostname}:${port}${path}`;
}

function createWebSocket(url: string) {
  const webSocket = new WebSocket(url);
  webSocket.onopen = () => {
    const socket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const languageClient = createLanguageClient({
      reader,
      writer,
    });
    languageClient.start();
    reader.onClose(() => languageClient.stop());
  };
  return webSocket;
}

function createLanguageClient(
  transports: MessageTransports
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: 'Sample Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['php'],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports);
      },
    },
  });
}

StandaloneServices.initialize({
  ...getMessageServiceOverride(document.body),
});
buildWorkerDefinition('dist', new URL('', window.location.href).href, false);

const hostname = 'localhost';
const path = '/php';
const port = 4000;

function App() {
  const editorRef = useRef<any>(null);
  const ran = useRef(null);
  const url = useMemo(
    () => createUrl(hostname, port, path),
    [hostname, port, path]
  );
  let lspWebSocket: WebSocket;

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    MonacoServices.install();
  };

  const handleBeforeMount = (monaco: Monaco) => {};

  useEffect(() => {
    if (!ran.current) {
      console.log('malaka');
      lspWebSocket = createWebSocket(url);
      ran.current = true;
    }
  }, []);

  return (
    <div>
      <Editor
        height='100vh'
        width='90vw'
        theme='vs-dark'
        beforeMount={handleBeforeMount}
        defaultLanguage='php'
        defaultValue='<php echo "hola"'
        onMount={handleEditorDidMount}
        keepCurrentModel={true}
      />
    </div>
  );
}

export default App;
