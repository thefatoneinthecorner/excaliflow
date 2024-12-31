import { WelcomeScreen } from '@excalidraw/excalidraw';
import Flow from '../flow.svg';
import rawMarkdown from '../../README.md';

const GitHubIcon = (
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" alt="GitHub" width="16" height="16" />
);

export function ExcaliflowWelcome() {
  return (
    <WelcomeScreen>
      <WelcomeScreen.Center>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* The original SVG */}
          <div>
            <WelcomeScreen.Center.Logo />
          </div>
          <div style={{ paddingLeft: 200 }}>
            <Flow />
          </div>
          {/* Overlay for the strike-through */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
              <line x1="180" y1="30" x2="280" y2="5" stroke="red" strokeWidth="3" />
            </svg>
          </div>
        </div>
        <p style={{ maxWidth: 400, textAlign: 'center' }}>
          {rawMarkdown.split('###')[1].split('\n')[2]}
          <a
            style={{ pointerEvents: 'all' }}
            href="https://github.com/thefatoneinthecorner/excaliflow?tab=readme-ov-file#overview"
            target="_blank"
          >
            &nbsp;more...
          </a>
        </p>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLink href="https://github.com/excalidraw/excalidraw" icon={GitHubIcon}>
            Excalidraw GitHub
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItemLink
            href="https://github.com/thefatoneinthecorner/excaliflow"
            icon={GitHubIcon}
          >
            Excaliflow GitHub
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItemHelp />
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
}
