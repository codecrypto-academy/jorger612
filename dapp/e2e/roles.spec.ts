/**
 * E2E — Gestión de Roles
 *
 * Flujo completo: Crear → Verificar en tabla → Modificar → Verificar cambio
 *                 → Inhabilitar → Verificar badge Inactivo
 */
import { expect } from '@playwright/test';
import { test, waitForSuccessToast, fillAndSubmitModal, RUN_ID } from './fixtures/base';

const ROL_NOMBRE_1    = `Supervisor-${RUN_ID}`;
const ROL_NOMBRE_MOD  = `SupervisorMod-${RUN_ID}`;

test.describe('Roles – flujo completo', () => {

  test('01 · Crear rol y verificar en tabla', async ({ connectedPage: page }) => {
    await page.goto('/roles');

    // Abrir modal Crear
    await page.getByTestId('btn-crear-rol').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.title()).toContain('SecurityManager');

    // Rellenar y enviar
    await fillAndSubmitModal(page, 'input-rol-nombre', ROL_NOMBRE_1, 'btn-submit-rol');

    // Esperar toast de éxito
    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(ROL_NOMBRE_1);

    // Modal cerrado
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Rol aparece en la tabla
    await expect(page.locator('td', { hasText: ROL_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });
    // Badge activo presente
    await expect(page.getByTestId('badge-active').first()).toBeVisible();
  });

  test('02 · Modificar nombre del rol', async ({ connectedPage: page }) => {
    await page.goto('/roles');
    // Esperar a que la tabla cargue el rol creado
    await expect(page.locator('td', { hasText: ROL_NOMBRE_1 })).toBeVisible({ timeout: 20_000 });

    // Encontrar el botón Modificar de la fila con el nombre del rol
    const fila = page.locator('tr', { hasText: ROL_NOMBRE_1 });
    await fila.getByRole('button', { name: /Modificar/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // El campo debe tener el nombre actual
    await expect(page.getByTestId('input-rol-nombre')).toHaveValue(ROL_NOMBRE_1);

    // Cambiar el nombre
    await fillAndSubmitModal(page, 'input-rol-nombre', ROL_NOMBRE_MOD, 'btn-submit-rol');

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain(ROL_NOMBRE_MOD);

    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Nombre modificado visible en tabla
    await expect(page.locator('td', { hasText: ROL_NOMBRE_MOD })).toBeVisible({ timeout: 20_000 });
    // Nombre anterior ya no está
    await expect(page.locator('td', { hasText: ROL_NOMBRE_1 })).not.toBeVisible();
  });

  test('03 · Inhabilitar rol y verificar badge Inactivo', async ({ connectedPage: page }) => {
    await page.goto('/roles');
    await expect(page.locator('td', { hasText: ROL_NOMBRE_MOD })).toBeVisible({ timeout: 20_000 });

    const fila = page.locator('tr', { hasText: ROL_NOMBRE_MOD });
    await fila.getByRole('button', { name: /Inhabilitar/i }).click();

    // Confirmar en el banner inline
    await expect(page.getByTestId('btn-confirm-inhabilitar')).toBeVisible();
    await page.getByTestId('btn-confirm-inhabilitar').click();

    const toastText = await waitForSuccessToast(page);
    expect(toastText).toMatch(/inhabilitado/i);

    // Badge Inactivo en la fila
    const filaInhab = page.locator('tr', { hasText: ROL_NOMBRE_MOD });
    await expect(filaInhab.getByTestId('badge-inactive')).toBeVisible({ timeout: 20_000 });

    // Botones de acción deshabilitados
    await expect(filaInhab.getByRole('button', { name: /Modificar/i })).toBeDisabled();
    await expect(filaInhab.getByRole('button', { name: /Inhabilitar/i })).toBeDisabled();
  });

  test('04 · Validación: nombre vacío no envía transacción', async ({ connectedPage: page }) => {
    await page.goto('/roles');
    await page.getByTestId('btn-crear-rol').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Enviar sin escribir nombre
    await page.getByTestId('btn-submit-rol').click();

    // Error de validación visible, modal sigue abierto
    await expect(page.getByTestId('rol-form-error')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('05 · Validación: nombre con caracteres especiales rechazado', async ({ connectedPage: page }) => {
    await page.goto('/roles');
    await page.getByTestId('btn-crear-rol').click();

    await page.getByTestId('input-rol-nombre').fill('<script>xss</script>');
    await page.getByTestId('btn-submit-rol').click();

    await expect(page.getByTestId('rol-form-error')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('06 · Cancelar modal no crea rol', async ({ connectedPage: page }) => {
    await page.goto('/roles');
    const countAntes = await page.locator('tbody tr').count();

    await page.getByTestId('btn-crear-rol').click();
    await page.getByTestId('input-rol-nombre').fill(`CanceladoRol-${RUN_ID}`);
    await page.getByText('Cancelar').click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    const countDespues = await page.locator('tbody tr').count();
    expect(countDespues).toBe(countAntes); // sin cambios
  });
});
