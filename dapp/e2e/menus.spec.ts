/**
 * E2E — Gestión de Menús (CRUD + Vinculación de Roles)
 *
 * Flujo: Crear menú → Vincular rol → Verificar acceso → Desvincular →
 *        Modificar nombre → Inhabilitar
 */
import { expect } from '@playwright/test';
import { test, waitForSuccessToast, RUN_ID } from './fixtures/base';

const MENU_NOMBRE_1   = `Panel-${RUN_ID}`;
const MENU_NOMBRE_MOD = `PanelMod-${RUN_ID}`;

test.describe('Menus – flujo completo', () => {

  test('01 · Crear menú y verificar en tabla', async ({ connectedPage: page }) => {
    await page.goto('/menus');

    await page.getByTestId('btn-crear-menu').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByTestId('input-menu-nombre').fill(MENU_NOMBRE_1);
    await page.getByTestId('btn-submit-menu').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(MENU_NOMBRE_1);

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('td', { hasText: MENU_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });

    // Badge Activo
    const fila = page.locator('tr', { hasText: MENU_NOMBRE_1 });
    await expect(fila.getByTestId('badge-active')).toBeVisible();
  });

  test('02 · Menú acepta nombres con barra "/" (rutas)', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await page.getByTestId('btn-crear-menu').click();

    const nombreRuta = `Reportes-${RUN_ID}`;
    await page.getByTestId('input-menu-nombre').fill(nombreRuta);
    await page.getByTestId('btn-submit-menu').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(nombreRuta);
    await expect(page.locator('td', { hasText: nombreRuta })).toBeVisible({ timeout: 20_000 });
  });

  test('03 · Vincular rol activo al menú', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await expect(page.locator('td', { hasText: MENU_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });

    // Abrir modal de roles para el menú
    const fila = page.locator('tr', { hasText: MENU_NOMBRE_1 });
    await fila.getByRole('button', { name: /Roles/i }).click();

    // Esperar a que el modal de vinculación cargue
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('menu-rol-list')).toBeVisible({ timeout: 15_000 });

    // Verificar que el nombre del menú aparece en el modal
    await expect(page.getByText(MENU_NOMBRE_1)).toBeVisible();

    // Obtener el primer botón "Vincular"
    const btnVincular = page.getByRole('button', { name: /Vincular/i }).first();
    await expect(btnVincular).toBeVisible();
    await btnVincular.click();

    // Esperar a que cambie el estado del botón a "Desvincular"
    await expect(
      page.getByRole('button', { name: /Desvincular/i }).first()
    ).toBeVisible({ timeout: 20_000 });

    // El badge debe cambiar a "Vinculado"
    await expect(page.getByText('Vinculado').first()).toBeVisible();
  });

  test('04 · Desvincular rol del menú', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await expect(page.locator('td', { hasText: MENU_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: MENU_NOMBRE_1 });
    await fila.getByRole('button', { name: /Roles/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('menu-rol-list')).toBeVisible({ timeout: 15_000 });

    // Debe haber un botón "Desvincular" (del step anterior)
    const btnDesvincular = page.getByRole('button', { name: /Desvincular/i }).first();
    await expect(btnDesvincular).toBeVisible();
    await btnDesvincular.click();

    // El botón vuelve a ser "Vincular"
    await expect(
      page.getByRole('button', { name: /Vincular/i }).first()
    ).toBeVisible({ timeout: 20_000 });

    // Badge vuelve a "No vinculado"
    await expect(page.getByText('No vinculado').first()).toBeVisible();
  });

  test('05 · Modificar nombre del menú', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await expect(page.locator('td', { hasText: MENU_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: MENU_NOMBRE_1 });
    await fila.getByRole('button', { name: /Modificar/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('input-menu-nombre')).toHaveValue(MENU_NOMBRE_1);

    await page.getByTestId('input-menu-nombre').clear();
    await page.getByTestId('input-menu-nombre').fill(MENU_NOMBRE_MOD);
    await page.getByTestId('btn-submit-menu').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(MENU_NOMBRE_MOD);

    await expect(page.locator('td', { hasText: MENU_NOMBRE_MOD })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('td', { hasText: MENU_NOMBRE_1 })).not.toBeVisible();
  });

  test('06 · Inhabilitar menú y verificar badge Inactivo', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await expect(page.locator('td', { hasText: MENU_NOMBRE_MOD })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: MENU_NOMBRE_MOD });
    await fila.getByRole('button', { name: /Inhabilitar/i }).click();

    await expect(page.getByTestId('btn-confirm-inhabilitar-menu')).toBeVisible();
    await page.getByTestId('btn-confirm-inhabilitar-menu').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toMatch(/inhabilitado/i);

    const filaInhab = page.locator('tr', { hasText: MENU_NOMBRE_MOD });
    await expect(filaInhab.getByTestId('badge-inactive')).toBeVisible({ timeout: 20_000 });
    await expect(filaInhab.getByRole('button', { name: /Modificar/i })).toBeDisabled();
  });

  test('07 · Validación XSS rechazado en nombre de menú', async ({ connectedPage: page }) => {
    await page.goto('/menus');
    await page.getByTestId('btn-crear-menu').click();

    await page.getByTestId('input-menu-nombre').fill('<img src=x onerror=alert(1)>');
    await page.getByTestId('btn-submit-menu').click();

    await expect(page.getByTestId('menu-form-error')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
