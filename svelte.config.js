import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Generate 404.html for GitHub Pages SPA routing
      fallback: "404.html",
    }),
    paths: {
      base: process.env.NODE_ENV === "production" ? "/manuscript" : "",
    },
  },
};

export default config;
