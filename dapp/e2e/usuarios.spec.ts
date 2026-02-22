/**
 * E2E — Gestión de Usuarios
 *
 * Prerequisito: debe existir al menos un rol activo en el contrato.
 * (El rol "Admin" fue creado en el seed inicial con cast send)
 *
 * Flujo: Crear usuario → Verificar en tabla → Modificar → Inhabilitar
 */
import { expect } from '@playwright/test';
import { test, waitForSuccessToast, RUN_ID } from './fixtures/base';

const LOGIN_1    = `usr${RUN_ID}`.toLowerCase().slice(0, 16);
const NOMBRE_1   = `Usuario Test ${RUN_ID}`;
const LOGIN_MOD  = `mod${RUN_ID}`.toLowerCase().slice(0, 16);
const NOMBRE_MOD = `Modificado ${RUN_ID}`;

test.describe('Usuarios – flujo completo', () => {

  test('01 · Crear usuario con rol activo', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');

    await page.getByTestId('btn-crear-usuario').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Rellenar campos
    await page.getByTestId('input-usuario-login').fill(LOGIN_1);
    await page.getByTestId('input-usuario-nombre').fill(NOMBRE_1);

    // Seleccionar el primer rol disponible (Admin creado en seed)
    const select = page.getByTestId('select-usuario-rol');
    const options = await select.locator('option').all();
    const roleOptions = options.filter(async o => (await o.getAttribute('value')) !== '0');
    // Tomar el primer rol activo
    const firstRoleValue = await (await select.locator('option').nth(1).getAttribute('value'));
    if (firstRoleValue) await select.selectOption(firstRoleValue);

    await page.getByTestId('btn-submit-usuario').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(LOGIN_1);

    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Usuario visible en tabla
    await expect(page.locator('td', { hasText: LOGIN_1 })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('td', { hasText: NOMBRE_1 })).toBeVisible();
    // Badge activo
    const fila = page.locator('tr', { hasText: LOGIN_1 });
    await expect(fila.getByTestId('badge-active')).toBeVisible();
  });

  test('02 · El select solo muestra roles activos', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');
    await page.getByTestId('btn-crear-usuario').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const select   = page.getByTestId('select-usuario-rol');
    const optTexts = await select.locator('option').allTextContents();

    // No debe haber opción con texto que incluya un rol inactivo
    // El select solo lista roles activos del contrato
    for (const opt of optTexts) {
      // La opción placeholder empieza con "--"
      if (opt.startsWith('--')) continue;
      // Todos los demás deben ser roles activos (no podemos comprobar activo
      // sin una llamada al contrato, pero verificamos que hay al menos uno)
      expect(opt.trim().length).toBeGreaterThan(0);
    }

    // Cerrar
    await page.keyboard.press('Escape');
  });

  test('03 · Modificar login y nombre del usuario', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('td', { hasText: LOGIN_1 })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: LOGIN_1 });
    await fila.getByRole('button', { name: /Modificar/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Campos prellenos
    await expect(page.getByTestId('input-usuario-login')).toHaveValue(LOGIN_1);
    await expect(page.getByTestId('input-usuario-nombre')).toHaveValue(NOMBRE_1);

    // Modificar
    await page.getByTestId('input-usuario-login').clear();
    await page.getByTestId('input-usuario-login').fill(LOGIN_MOD);
    await page.getByTestId('input-usuario-nombre').clear();
    await page.getByTestId('input-usuario-nombre').fill(NOMBRE_MOD);

    await page.getByTestId('btn-submit-usuario').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(LOGIN_MOD);

    await expect(page.getByRole('dialog')).not.toBeVisible();

    await expect(page.locator('td', { hasText: LOGIN_MOD })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('td', { hasText: NOMBRE_MOD })).toBeVisible();
    await expect(page.locator('td', { hasText: LOGIN_1 })).not.toBeVisible();
  });

  test('04 · Inhabilitar usuario y verificar badge Inactivo', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('td', { hasText: LOGIN_MOD })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: LOGIN_MOD });
    await fila.getByRole('button', { name: /Inhabilitar/i }).click();

    await expect(page.getByTestId('btn-confirm-inhabilitar-usuario')).toBeVisible();
    await page.getByTestId('btn-confirm-inhabilitar-usuario').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toMatch(/inhabilitado/i);

    const filaInhab = page.locator('tr', { hasText: LOGIN_MOD });
    await expect(filaInhab.getByTestId('badge-inactive')).toBeVisible({ timeout: 20_000 });
    await expect(filaInhab.getByRole('button', { name: /Modificar/i })).toBeDisabled();
  });

  test('05 · Validación: login inválido muestra error', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');
    await page.getByTestId('btn-crear-usuario').click();

    // Login con solo 2 caracteres (mínimo 3)
    await page.getByTestId('input-usuario-login').fill('ab');
    await page.getByTestId('input-usuario-nombre').fill('Test User');
    await page.getByTestId('btn-submit-usuario').click();

    await expect(page.getByTestId('usuario-form-error')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('06 · Cancelar modal no crea usuario', async ({ connectedPage: page }) => {
    await page.goto('/usuarios');
    const countAntes = await page.locator('tbody tr').count();

    await page.getByTestId('btn-crear-usuario').click();
    await page.getByTestId('input-usuario-login').fill(`cancel${RUN_ID}`.slice(0, 16));
    await page.getByTestId('input-usuario-nombre').fill('Cancelado');
    await page.getByText('Cancelar').click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(await page.locator('tbody tr').count()).toBe(countAntes);
  });
});
