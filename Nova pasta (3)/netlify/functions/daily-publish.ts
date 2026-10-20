/**
 * Desativado para evitar um segundo publicador concorrente. O único executor
 * de produção é o workflow GitHub Actions, com Firebase Admin SDK e lock por slot.
 */
export const handler = async () => ({
  statusCode: 410,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ error: 'Publicação via Netlify desativada. Use o workflow CampoBR Daily Publisher no GitHub Actions.' }),
});
