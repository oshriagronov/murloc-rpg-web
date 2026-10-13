// Runs on Cloudflare for the intro video only (see wrangler.jsonc). Cloudflare's static file
// hosting answers a request for part of a file with the whole file, and Safari will not play a
// video from a server that does that. This cuts out the part that was asked for.
export default {
  async fetch(request, env) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') ?? '');
    const whole = new Request(request);
    whole.headers.delete('Range');
    const response = await env.ASSETS.fetch(whole);
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    if (!range || (!range[1] && !range[2]) || response.status !== 200 || request.method !== 'GET') {
      return new Response(response.body, { status: response.status, headers });
    }

    const bytes = await response.arrayBuffer();
    const size = bytes.byteLength;
    // "bytes=-500" is the last 500 bytes; "bytes=500-" is everything from 500 on.
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      headers.set('Content-Range', `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  },
};
