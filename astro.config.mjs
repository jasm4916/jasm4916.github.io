// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: a repo named <user>.github.io serves at the root, so base is '/'.
// For a project repo (e.g. github.com/jasm4916/portfolio) set base to '/portfolio'.
// With a custom domain, set site to 'https://yourdomain.com', base to '/', and add public/CNAME.
export default defineConfig({
  site: 'https://jasm4916.github.io',
  base: '/',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
