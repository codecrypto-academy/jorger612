import { test as baseTest, expect, Page } from '@playwright/test';
import { MOCK_ETHEREUM_SCRIPT, OWNER_ADDRESS } from '../helpers/ethereum';

/**
 * Fixture extendido:
 *  - Inyecta window.ethereum mock antes de cada navegación
 *  - Conecta la wallet automáticamente al iniciar
 *  - Expone helpers reutilizables entre suites
 */

export interface TestFixtures {
  connectedPage: Page;
}

export const test = baseTest.extend<TestFixtures>({
  connectedPage: async ({ page }, use) => {
    // 1. Inyectar el mock de MetaMask antes de que cargue cualquier JS de la app
    await page.addInitScript(MOCK_ETHEREUM_SCRIPT);

    // 2. Navegar al dashboard
    await page.goto('/');

    // 3. Conectar wallet
    await page.click('[data-testid="btn-connect-wallet"]');

    // 4. Esperar a que aparezca la dirección truncada (señal de conexión exitosa)
    await expect(page.getByTestId('wallet-address')).toBeVisible({ timeout: 20_000 });

    // Verificar que la dirección mostrada corresponde al owner
    const addrEl = page.getByTestId('wallet-address');
    const shortAddr = `${OWNER_ADDRESS.slice(0, 6)}...${OWNER_ADDRESS.slice(-4)}`;
    await expect(addrEl).toHaveText(shortAddr);

    // 5. Verificar badge Owner
    await expect(page.getByText('Owner')).toBeVisible();

    await use(page);
  },
});

export { expect };

// ─── Helpers reutilizables ────────────────────────────────────────────────────

/** Espera a que aparezca un toast de éxito (verde) y retorna su texto */
export async function waitForSuccessToast(page: Page): Promise<string> {
  const toast = page.getByTestId('toast-item').first();
  await expect(toast).toBeVisible({ timeout: 30_000 });
  return (await toast.textContent()) ?? '';
}

/** Espera a que aparezca un toast de error (rojo) y retorna su texto */
export async function waitForErrorToast(page: Page): Promise<string> {
  const toast = page.getByTestId('toast-item').first();
  await expect(toast).toBeVisible({ timeout: 15_000 });
  return (await toast.textContent()) ?? '';
}

/** Abre el modal, rellena el campo nombre, y envía el formulario */
export async function fillAndSubmitModal(
  page:       Page,
  inputId:    string,
  nombre:     string,
  submitId:   string = 'btn-submit-rol',
) {
  const input = page.getByTestId(inputId);
  await input.clear();
  await input.fill(nombre);
  await page.getByTestId(submitId).click();
}

/** Sufijo único por ejecución para evitar colisiones entre runs */
export const RUN_ID = Date.now().toString(36).toUpperCase().slice(-4);
