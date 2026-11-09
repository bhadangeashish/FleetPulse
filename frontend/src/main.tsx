import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorkerHelper';

// Initialize PWA Service Worker with background sync coordination
registerServiceWorker().catch(console.warn);

createRoot(document.getElementById('root')!).render(<App />);
