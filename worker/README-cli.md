# cli.nlj.dev — the curl-able terminal endpoint

A Cloudflare Worker (`cli-worker.js`) that serves an ASCII résumé + system status
to `curl`/`wget` (via User-Agent detection) and redirects browsers to `nlj.dev`.

```
curl -sL cli.nlj.dev            # ASCII home: résumé + status + commands
curl -sL cli.nlj.dev/resume     # plaintext résumé
curl -sL cli.nlj.dev/kedge      # kedge architecture spec
curl -sL cli.nlj.dev/keys       # real SSH + GPG public keys (proxied from GitHub)
```

## Deploy

```bash
cd worker
npx wrangler login                      # one time, in your Cloudflare account
npx wrangler deploy --config wrangler-cli.toml
```

That publishes it to `https://nlj-cli.<your-subdomain>.workers.dev` — **curl-able
immediately**, no DNS needed. Test it:

```bash
curl -sL https://nlj-cli.<your-subdomain>.workers.dev
```

## Mapping it to `cli.nlj.dev`

`nlj.dev` lives on **Hostinger DNS (Namecheap nameservers)**, not Cloudflare — so a
Worker custom domain can't be attached directly. Two honest options:

1. **Subdomain delegation (keeps the main site on Hostinger).**
   In the Cloudflare dashboard, add a zone for `cli.nlj.dev`. Cloudflare gives you
   two nameservers. At Namecheap → Advanced DNS, add `NS` records for host `cli`
   pointing at those two nameservers. Then in Cloudflare → Workers → the `nlj-cli`
   worker → add the Custom Domain `cli.nlj.dev`. The apex `nlj.dev` is untouched.

2. **Just use the workers.dev URL** and link it (e.g. in the footer /
   `curl` hint) as `curl nlj-cli.<subdomain>.workers.dev`. Zero DNS work.

> I can't deploy this for you — it needs your Cloudflare login. The Worker code is
> ready; run the two commands above.
