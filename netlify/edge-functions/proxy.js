export default async (request, context) => {
  const url = new URL(request.url);
  
  // Alvo: O subdomínio que você apontou para a VPS no Passo 1
  const target = `http://netlify.erosrss.pp.ua:8383${url.pathname}${url.search}`;

  const BLOCKED_HEADERS = new Set([
    'host', 'connection', 'x-forwarded-for',
    'x-forwarded-host', 'x-forwarded-proto',
    'x-vercel-id', 'x-vercel-cache',
    'cdn-loop', 'cf-connecting-ip',
  ]);

  const newHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!BLOCKED_HEADERS.has(key.toLowerCase())) {
      newHeaders.set(key, value);
    }
  }

  // Mascara o Host para a VPS reconhecer a origem corretamente
  newHeaders.set('host', 'netlify.erosrss.pp.ua');
  newHeaders.set('connection', 'keep-alive');

  const init = {
    method: request.method,
    headers: newHeaders,
    redirect: 'manual',
  };

  // Parâmetro essencial para o tráfego xhttp (WebSocket bidirecional) não travar
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half'; 
  }

  try {
    const response = await fetch(target, init);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Accel-Buffering', 'no');
    responseHeaders.set('Cache-Control', 'no-store');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Erro no Proxy:', error.message);
    return new Response('Bad Gateway', { status: 502 });
  }
};
