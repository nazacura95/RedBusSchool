// ponytail: passthrough mínimo para que la PWA sea instalable — sin cache offline por ahora,
// sumar estrategia de cache cuando haga falta soportar uso sin conexión.
self.addEventListener("fetch", () => {});
