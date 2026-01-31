import { useState, useCallback } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { ConnectWallet } from './components/ConnectWallet';
import { Inbox } from './components/Inbox';
import { ChatView } from './components/ChatView';
import { SendMessage } from './components/SendMessage';
import { NotificationToast } from './components/NotificationToast';
import { GlobalFeed } from './components/GlobalFeed';
import { useDialogueEvents } from './hooks/useDialogueEvents';
import { useConversations } from './hooks/useConversations';

function AppContent() {
  const { isConnected } = useWeb3();
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [notification, setNotification] = useState(null);
  const { refetch: refetchConversations } = useConversations();

  const onNewMessageForMe = useCallback((event) => {
    setNotification(event);
    refetchConversations();
  }, [refetchConversations]);

  useDialogueEvents(onNewMessageForMe);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-elite-black px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="font-display font-semibold text-4xl text-premium-pearl mb-2 tracking-tight">
            Diálogos
          </h1>
          <p className="text-elite-silver text-sm mb-8">
            Mensajería on-chain · Conecta tu wallet para continuar
          </p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-elite-black">
      <header className="border-b border-elite-accent/20 bg-elite-charcoal/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display font-semibold text-xl text-premium-pearl tracking-tight">
            Diálogos
          </h1>
          <ConnectWallet />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl border border-elite-accent/20 bg-elite-charcoal/50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-elite-accent/20">
            <h2 className="font-display font-medium text-premium-pearl text-lg">
              Bandeja de entrada
            </h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Inbox selectedPeer={selectedPeer} onSelectPeer={setSelectedPeer} />
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex-1 min-h-[320px] flex flex-col">
            <ChatView selectedPeer={selectedPeer} />
          </div>
          <SendMessage
            selectedPeer={selectedPeer}
            onSent={() => refetchConversations()}
          />
        </section>

        <aside className="w-full lg:w-96 flex-shrink-0">
          <GlobalFeed />
        </aside>
      </main>

      {notification && (
        <NotificationToast
          notification={notification}
          onDismiss={dismissNotification}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
