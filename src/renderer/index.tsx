import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';
import { initConnector } from './frontendConnectors';
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById('root')!;
initConnector();
const root = createRoot(container);
root.render(<App />);
