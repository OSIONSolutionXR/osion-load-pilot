export default {
  async fetch(request) {
    return Response.json({
      ok: true,
      route: "/api/ping",
      time: new Date().toISOString(),
      method: request.method,
      url: request.url
    });
  }
};
