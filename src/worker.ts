export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const CANONICAL_HOST = "fruit-zombie-survival-game.wiki";

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hasFileExtension = /\.[a-z0-9]{2,8}$/i.test(url.pathname);
    const needsTrailingSlash = url.pathname !== "/" && !url.pathname.endsWith("/") && !hasFileExtension;
    if (url.protocol !== "https:" || url.hostname !== CANONICAL_HOST || needsTrailingSlash) {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      if (needsTrailingSlash) url.pathname = `${url.pathname}/`;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
