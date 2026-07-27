
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const redirectUri = `${url.origin}/callback`;
      const target = new URL('https://github.com/login/oauth/authorize');
      target.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      target.searchParams.set('redirect_uri', redirectUri);
      target.searchParams.set('scope', 'repo,user');
      return Response.redirect(target.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const token = await tokenResponse.json();
      if (!token.access_token) return new Response('OAuth failed', { status: 401 });

      const html = `<!doctype html><html><body><script>
        (function() {
          const data = ${JSON.stringify(token)};
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify({token: data.access_token, provider: 'github'}),
            window.location.origin
          );
          window.close();
        })();
      </script></body></html>`;

      return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }

    return new Response('Not found', { status: 404 });
  }
};
