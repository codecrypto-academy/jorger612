'use client';

import { useState } from 'react';
import Link from 'next/link';

type MainTab = 'componentes' | 'formularios' | 'tokens';
type TokenSub = 'lista' | 'detalle';

export default function DesignDemoPage() {
  const [mainTab, setMainTab] = useState<MainTab>('componentes');
  const [tokenSub, setTokenSub] = useState<TokenSub>('lista');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="ds-root ds-page">
      <div className="ds-container">
        <Link href="/" className="ds-link-back">
          ← Volver a la app
        </Link>

        <header className="ds-hero">
          <h1 className="ds-hero__title">Sistema visual Empresa</h1>
          <p className="ds-hero__subtitle">
            Tokens CSS, pestañas, tarjetas y botones — referencia para el RBAC dapp
          </p>
        </header>

        <section className="ds-glass">
          <p style={{ margin: 0, color: '#fff', lineHeight: 1.6 }}>
            Bloque tipo cristal: <code className="ds-code" style={{ background: 'rgba(0,0,0,0.2)', color: '#fff' }}>backdrop-filter</code> sobre el
            gradiente. Usa variables <span className="ds-code" style={{ background: 'rgba(0,0,0,0.2)', color: '#fff' }}>--ds-glass-*</span>.
          </p>
        </section>

        <div className="menu-container">
          <div className="menu-tabs" role="tablist" aria-label="Secciones demo">
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'componentes'}
              className={`menu-tab${mainTab === 'componentes' ? ' active' : ''}`}
              onClick={() => setMainTab('componentes')}
            >
              Componentes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'formularios'}
              className={`menu-tab${mainTab === 'formularios' ? ' active' : ''}`}
              onClick={() => setMainTab('formularios')}
            >
              Formularios
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'tokens'}
              className={`menu-tab${mainTab === 'tokens' ? ' active' : ''}`}
              onClick={() => setMainTab('tokens')}
            >
              Tokens
            </button>
          </div>

          {mainTab === 'componentes' && (
            <div className="tab-content" key="componentes">
              <div className="ds-card" style={{ marginBottom: 24 }}>
                <h2 className="ds-card__title">Botones</h2>
                <p className="ds-muted" style={{ marginTop: 0 }}>
                  Primario <span className="ds-code">.btn</span> / <span className="ds-code">.ds-btn</span>; secundario gris{' '}
                  <span className="ds-code">.btn-secondary</span> o <span className="ds-code">.ds-btn--secondary</span>; rosa{' '}
                  <span className="ds-code">.ds-btn--secondary-pink</span>.
                </p>
                <div className="ds-btn-row" style={{ marginBottom: 16 }}>
                  <button type="button" className="btn">
                    Primario (.btn)
                  </button>
                  <button type="button" className="btn btn-secondary">
                    Secundario gris
                  </button>
                  <button type="button" className="ds-btn">
                    .ds-btn
                  </button>
                  <button type="button" className="ds-btn ds-btn--secondary">
                    Neutro
                  </button>
                  <button type="button" className="ds-btn ds-btn--secondary-pink">
                    Rosa
                  </button>
                </div>
                <div className="ds-btn-row">
                  <button type="button" className="ds-btn ds-btn--success">
                    CTA éxito
                  </button>
                  <button type="button" className="ds-btn ds-btn--cart">
                    Añadir (naranja)
                  </button>
                  <button type="button" className="ds-btn ds-btn--danger">
                    Eliminar
                  </button>
                  <button type="button" className="ds-btn ds-btn--wallet">
                    Aviso wallet
                  </button>
                  <button type="button" className="ds-btn" disabled>
                    Disabled
                  </button>
                </div>
              </div>

              <div className="ds-card" style={{ marginBottom: 24 }}>
                <h2 className="ds-card__title">Badges y contador</h2>
                <p>
                  <span className="ds-badge ds-badge--success">Éxito</span>{' '}
                  <span className="ds-badge ds-badge--error">Error</span>{' '}
                  <span className="ds-badge ds-badge--info">Info</span>{' '}
                  <span className="ds-badge ds-badge--cart" aria-label="Items en carrito">
                    3
                  </span>
                </p>
                <p className="ds-muted" style={{ marginBottom: 0 }}>
                  Spinner: <span className="ds-spinner" aria-hidden />{' '}
                  <span className="ds-code">.ds-spinner</span> usa acento <span className="ds-code">#667eea</span>.
                </p>
              </div>

              <div className="ds-grid">
                <article className="ds-card">
                  <h3 className="ds-card__title">Card A</h3>
                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                    Hover: <span className="ds-code">translateY(-5px)</span> y sombra más profunda.
                  </p>
                </article>
                <article className="ds-card">
                  <h3 className="ds-card__title">Card B</h3>
                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                    Grid: <span className="ds-code">repeat(auto-fill, minmax(300px, 1fr))</span>
                  </p>
                </article>
                <article className="ds-card">
                  <h3 className="ds-card__title">Card C</h3>
                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                    Título con borde inferior <span className="ds-code">3px solid #667eea</span>
                  </p>
                </article>
              </div>

              <div style={{ marginTop: 24 }}>
                <button type="button" className="ds-btn" onClick={() => setModalOpen(true)}>
                  Abrir modal (overlay)
                </button>
              </div>
            </div>
          )}

          {mainTab === 'formularios' && (
            <div className="tab-content" key="formularios">
              <div className="ds-card">
                <h2 className="ds-card__title">Campos</h2>
                <div className="ds-field">
                  <label className="ds-label" htmlFor="demo-text">
                    Nombre
                  </label>
                  <input id="demo-text" type="text" className="ds-input" placeholder="Texto..." autoComplete="off" />
                </div>
                <div className="ds-field">
                  <label className="ds-label" htmlFor="demo-select">
                    Rol
                  </label>
                  <select id="demo-select" className="ds-select" defaultValue="">
                    <option value="" disabled>
                      Seleccionar…
                    </option>
                    <option value="1">Admin</option>
                    <option value="2">Usuario</option>
                  </select>
                </div>
                <p className="ds-muted" style={{ marginBottom: 0 }}>
                  Focus unificado: borde <span className="ds-code">#667eea</span> + <span className="ds-code">box-shadow</span> del token{' '}
                  <span className="ds-code">--ds-focus-ring</span>.
                </p>
              </div>
            </div>
          )}

          {mainTab === 'tokens' && (
            <div className="tab-content" key="tokens">
              <div className="tokens-tabs" role="tablist" aria-label="Sub-sección tokens">
                <button
                  type="button"
                  className={`tokens-tab${tokenSub === 'lista' ? ' active' : ''}`}
                  onClick={() => setTokenSub('lista')}
                >
                  Lista
                </button>
                <button
                  type="button"
                  className={`tokens-tab${tokenSub === 'detalle' ? ' active' : ''}`}
                  onClick={() => setTokenSub('detalle')}
                >
                  Detalle
                </button>
              </div>
              {tokenSub === 'lista' && (
                <div className="ds-card tab-content" key="lista">
                  <h2 className="ds-card__title">Variables CSS (--ds-*)</h2>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#555', lineHeight: 1.8 }}>
                    <li>
                      <span className="ds-code">--ds-accent-start / --ds-accent-end</span>
                    </li>
                    <li>
                      <span className="ds-code">--ds-border</span>, <span className="ds-code">--ds-bg-soft</span>
                    </li>
                    <li>
                      <span className="ds-code">--ds-text-body</span>, secundarios y grises Bootstrap-like
                    </li>
                    <li>
                      Badges éxito / error / info (tokens en <span className="ds-code">design-system.css</span>)
                    </li>
                  </ul>
                </div>
              )}
              {tokenSub === 'detalle' && (
                <div className="ds-card tab-content" key="detalle">
                  <h2 className="ds-card__title">Tipografía</h2>
                  <p style={{ margin: 0, color: '#555' }}>
                    Cuerpo: pila sistema en <span className="ds-code">.ds-root</span>. Código:{' '}
                    <span className="ds-code">0x5FbDB2315678afecb367f032d93F642f64180aa3</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="ds-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="ds-modal">
            <h2 id="modal-title" className="ds-modal__title">
              Modal de ejemplo
            </h2>
            <p style={{ color: '#555', marginBottom: 20 }}>
              Overlay <span className="ds-code">rgba(0,0,0,0.5)</span> + blur. Cerrar con el botón.
            </p>
            <div className="ds-stack">
              <button type="button" className="ds-btn" onClick={() => setModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
