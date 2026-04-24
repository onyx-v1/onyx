import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { NetworkOverlay } from './components/ui/NetworkOverlay';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRouter />
      <NetworkOverlay />
    </BrowserRouter>
  );
}
