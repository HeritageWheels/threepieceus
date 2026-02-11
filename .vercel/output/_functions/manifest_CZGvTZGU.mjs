import 'piccolore';
import { p as decodeKey } from './chunks/astro/server_BJzW4Wti.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BP67sVp4.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/","cacheDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/node_modules/.astro/","outDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/dist/","srcDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/","publicDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/public/","buildClientDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/dist/client/","buildServerDir":"file:///Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.BityrNmu.css"}],"routeData":{"route":"/vehicle-gallery/[id]/[slug]","isIndex":false,"type":"page","pattern":"^\\/vehicle-gallery\\/([^/]+?)\\/([^/]+?)\\/?$","segments":[[{"content":"vehicle-gallery","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"slug","dynamic":true,"spread":false}]],"params":["id","slug"],"component":"src/pages/vehicle-gallery/[id]/[slug].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/vehicle-gallery/[id]/[slug]@_@astro":"pages/vehicle-gallery/_id_/_slug_.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_CZGvTZGU.mjs","/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_D_H16N-3.mjs","/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/pages/vehicle-gallery/[id]/[slug].astro?astro&type=script&index=0&lang.ts":"_astro/_slug_.astro_astro_type_script_index_0_lang.zJS8KhNy.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/pages/vehicle-gallery/[id]/[slug].astro?astro&type=script&index=0&lang.ts","(function(){const i=document.getElementById(\"vehicle-slider\");if(!i)return;const h=i.querySelector(\".vehicle-slider__track\"),x=i.querySelectorAll(\".vehicle-slider__slide\"),E=i.querySelector(\".vehicle-slider__prev\"),_=i.querySelector(\".vehicle-slider__next\"),m=i.querySelectorAll(\".vehicle-slider__dot\"),u=x.length;if(u<=1||!h)return;const e=h instanceof HTMLElement?h:null;if(!e)return;let n=0,f=0,y=0,r=0,o=null;function s(t){n=Math.max(0,Math.min(t,u-1)),e.style.transition=\"\",e.style.transform=`translate3d(-${n*100}%, 0, 0)`,m.forEach((c,l)=>{c.setAttribute(\"aria-selected\",l===n?\"true\":\"false\"),c.classList.toggle(\"is-active\",l===n)})}E?.addEventListener(\"click\",()=>s(n-1)),_?.addEventListener(\"click\",()=>s(n+1)),m.forEach((t,c)=>t.addEventListener(\"click\",()=>s(c))),e.addEventListener(\"touchstart\",t=>{t.touches.length===1&&(f=t.touches[0].clientX,y=t.touches[0].clientY,r=n,o=null,e.style.transition=\"none\")},{passive:!0}),e.addEventListener(\"touchmove\",t=>{if(t.touches.length!==1)return;const c=t.touches[0].clientX,l=t.touches[0].clientY,a=c-f,d=l-y;o===null&&(o=Math.abs(a)>Math.abs(d)),o&&Math.abs(a)>5&&t.preventDefault();const g=e.offsetWidth,k=-(u-1)*g,L=0;let v=-r*g+a;v=Math.max(k,Math.min(L,v)),e.style.transform=`translate3d(${v}px, 0, 0)`},{passive:!1}),e.addEventListener(\"touchend\",t=>{if(e.style.transition=\"\",t.changedTouches.length!==1)return;const l=t.changedTouches[0].clientX-f,d=e.offsetWidth*.2;l>d?s(r-1):l<-d?s(r+1):s(r)},{passive:!0}),s(0)})();"]],"assets":["/_astro/_slug_.BityrNmu.css","/favicon.ico","/favicon.svg"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"E45RCgXr0zKvsTsSVulhdAGEhnGCnEU8AZ4SyYAyjvo="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
