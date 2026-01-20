export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Try to get the asset from env.ASSETS
        try {
            const response = await env.ASSETS.fetch(request);
            if (response.status !== 404) {
                return response;
            }
        } catch (e) {
            // Asset not found, fall through to SPA fallback
        }

        // SPA fallback - serve index.html for any path
        try {
            const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
            return await env.ASSETS.fetch(indexRequest);
        } catch (e) {
            return new Response('Not Found', { status: 404 });
        }
    },
};
