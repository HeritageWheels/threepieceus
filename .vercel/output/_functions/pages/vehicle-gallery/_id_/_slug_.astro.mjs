import { e as createComponent, r as renderTemplate, k as renderComponent, g as addAttribute, m as maybeRenderHead, h as createAstro, l as Fragment, u as unescapeHTML, n as renderHead, o as renderSlot } from '../../../chunks/astro/server_H-z7eXbp.mjs';
import 'piccolore';
/* empty css                                        */
import 'clsx';
export { renderers } from '../../../renderers.mjs';

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(cooked.slice()) }));
var _a$2;
const $$Astro$3 = createAstro();
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Header;
  const { baseUrl = "https://threepiece.us" } = Astro2.props;
  const logoUrl = "https://cdn11.bigcommerce.com/s-8zxb6tk/images/stencil/200x90/threepiece-logo_1713917723__25054.original.png";
  const TOP_LEVEL_NAV = [
    { name: "Shop", path: "/shop" },
    { name: "Brands", path: "/brands" },
    { name: "Heritage Wheel", path: "/heritage-wheel" },
    { name: "Threepieceus Gallery", path: "/gallery" },
    { name: "Add Your Ride", path: "/add-your-ride" },
    { name: "Fitment Info", path: "/fitment-info" }
  ];
  function toHref(path) {
    if (!path) return baseUrl;
    return path.startsWith("http") ? path : `${baseUrl}${path.replace(/^\/?/, "/")}`;
  }
  function parseCategoryList(json) {
    const data = json?.data ?? json;
    if (Array.isArray(data)) return data;
    const cats = data?.categories;
    return Array.isArray(cats) ? cats : [];
  }
  function sameName(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  const apiBase = new URL("/api/categories", Astro2.url.origin).href;
  let navItems = [];
  try {
    const parentsRes = await fetch(apiBase);
    if (!parentsRes.ok) throw new Error();
    const parentsList = parseCategoryList(await parentsRes.json());
    const apiParents = parentsList.filter((n) => n.name);
    for (const item of TOP_LEVEL_NAV) {
      const parent = apiParents.find((p) => sameName(p.name, item.name));
      if (parent) {
        const id = parent.category_id;
        const children = [];
        if (id != null) {
          try {
            const childRes = await fetch(`${apiBase}?parent_id:in=${id}`);
            if (childRes.ok) {
              const childList = parseCategoryList(await childRes.json());
              for (const node of childList.filter((n) => n.name)) {
                const childId = node.category_id;
                const subChildren = [];
                if (childId != null) {
                  try {
                    const subRes = await fetch(`${apiBase}?parent_id:in=${childId}`);
                    if (subRes.ok) {
                      const subList = parseCategoryList(await subRes.json());
                      subList.filter((n) => n.name).forEach((sub) => {
                        subChildren.push({ name: sub.name, href: toHref(sub.url?.path) });
                      });
                    }
                  } catch (_) {
                  }
                }
                children.push({
                  name: node.name,
                  href: toHref(node.url?.path),
                  category_id: childId,
                  children: subChildren
                });
              }
            }
          } catch (_) {
          }
        }
        navItems.push({
          name: item.name,
          href: toHref(parent.url?.path),
          children
        });
      } else {
        navItems.push({
          name: item.name,
          href: `${baseUrl}${item.path.replace(/^\/?/, "/")}`,
          children: []
        });
      }
    }
  } catch (_) {
    navItems = TOP_LEVEL_NAV.map((item) => ({
      name: item.name,
      href: `${baseUrl}${item.path.replace(/^\/?/, "/")}`,
      children: []
    }));
  }
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", '<header class="site-header"> <!-- Desktop: two rows --> <div class="site-header__top site-header__top--desktop"> <div class="site-header__inner"> <button type="button" class="site-header__desktop-hamburger" aria-label="Show navigation" id="header-desktop-hamburger"> <span class="site-header__hamburger-line"></span> <span class="site-header__hamburger-line"></span> <span class="site-header__hamburger-line"></span> </button> <a', ' class="site-header__logo"> <img', ' alt="threepiece.us" class="site-header__logo-img" width="200" height="90"> </a> <span class="site-header__top-spacer" aria-hidden="true"></span> </div> </div> <div class="site-header__nav-wrap"> <div class="site-header__inner"> <nav class="site-header__nav site-header__nav--desktop" aria-label="Main navigation"> ', ' </nav> </div> <!-- Mobile: single bar with hamburger, logo, icons --> <div class="site-header__mobile"> <button type="button" class="site-header__hamburger" aria-label="Open menu" aria-expanded="false" id="header-hamburger"> <span class="site-header__hamburger-line"></span> <span class="site-header__hamburger-line"></span> <span class="site-header__hamburger-line"></span> </button> <a', ' class="site-header__logo site-header__logo--mobile"> <img', ' alt="threepiece.us" class="site-header__logo-img" width="200" height="90"> </a> </div> <!-- Mobile nav overlay --> <div class="site-header__overlay" id="header-overlay" aria-hidden="true"> <div class="site-header__panel" id="header-panel"> <button type="button" class="site-header__close" aria-label="Close menu" id="header-close"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"></path></svg> </button> <nav class="site-header__panel-nav" aria-label="Mobile navigation"> <div class="site-header__panel-item site-header__panel-item--auth"> <span class="site-header__panel-icon"> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> </span> <a', '>SIGN IN</a><span class="site-header__auth-sep"> or </span><a', ">REGISTER</a> </div> ", " </nav> </div> </div> </div></header>  <script>\n  (function () {\n    var header = document.querySelector('.site-header');\n    var hamburger = document.getElementById('header-hamburger');\n    var desktopHamburger = document.getElementById('header-desktop-hamburger');\n    var overlay = document.getElementById('header-overlay');\n    var closeBtn = document.getElementById('header-close');\n    var thresholdHide = 80;\n    var thresholdShow = 35;\n    var navManuallyOpened = false;\n    var lastManualOpenTime = 0;\n    var openDebounceMs = 400;\n\n    function isDesktop() {\n      return window.matchMedia('(min-width: 901px)').matches;\n    }\n\n    function updateScrolled() {\n      if (!header || !isDesktop()) return;\n      var y = window.scrollY;\n      if (y <= thresholdShow) {\n        navManuallyOpened = false;\n        header.classList.remove('is-scrolled');\n        return;\n      }\n      if (y < thresholdHide) return;\n      if (navManuallyOpened && (Date.now() - lastManualOpenTime < openDebounceMs)) return;\n      navManuallyOpened = false;\n      header.classList.add('is-scrolled');\n    }\n\n    if (header && desktopHamburger) {\n      window.addEventListener('scroll', updateScrolled, { passive: true });\n      updateScrolled();\n      desktopHamburger.addEventListener('click', function () {\n        navManuallyOpened = true;\n        lastManualOpenTime = Date.now();\n        header.classList.remove('is-scrolled');\n      });\n    }\n\n    if (!hamburger || !overlay || !closeBtn) return;\n\n    function openMenu() {\n      overlay.classList.add('is-open');\n      hamburger.setAttribute('aria-expanded', 'true');\n      document.body.style.overflow = 'hidden';\n    }\n    function closeMenu() {\n      overlay.classList.remove('is-open');\n      hamburger.setAttribute('aria-expanded', 'false');\n      document.body.style.overflow = '';\n    }\n\n    hamburger.addEventListener('click', openMenu);\n    closeBtn.addEventListener('click', closeMenu);\n    overlay.addEventListener('click', function (e) {\n      if (e.target === overlay) closeMenu();\n    });\n    document.addEventListener('keydown', function (e) {\n      if (e.key === 'Escape') closeMenu();\n    });\n\n    // Mobile panel: collapsible top-level and second-level categories\n    var panel = document.getElementById('header-panel');\n    if (panel) {\n      panel.addEventListener('click', function (e) {\n        var subBtn = e.target.closest('[data-panel-sub-toggle]');\n        if (subBtn) {\n          e.preventDefault();\n          var block = subBtn.closest('.site-header__panel-child-block');\n          var subChildren = block && block.querySelector('.site-header__panel-subchildren');\n          if (!block || !subChildren) return;\n          var expanded = block.classList.toggle('is-expanded');\n          subBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');\n          if (expanded) {\n            subChildren.removeAttribute('hidden');\n          } else {\n            subChildren.setAttribute('hidden', '');\n          }\n          return;\n        }\n        var btn = e.target.closest('[data-panel-toggle]');\n        if (!btn) return;\n        e.preventDefault();\n        var group = btn.closest('.site-header__panel-group');\n        var children = group && group.querySelector('.site-header__panel-children');\n        if (!group || !children) return;\n        var expanded = group.classList.toggle('is-expanded');\n        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');\n        if (expanded) {\n          children.removeAttribute('hidden');\n        } else {\n          children.setAttribute('hidden', '');\n        }\n      });\n    }\n  })();\n<\/script>"])), maybeRenderHead(), addAttribute(baseUrl, "href"), addAttribute(logoUrl, "src"), navItems.map((item) => renderTemplate`<div class="site-header__nav-item"> <a${addAttribute(item.href, "href")} class="site-header__nav-link">${item.name}</a> ${item.children.length > 0 && renderTemplate`<div class="site-header__mega" aria-hidden="true"> <div class="site-header__mega-inner"> <p class="site-header__mega-title">${item.name}</p> <a${addAttribute(item.href, "href")} class="site-header__mega-view-all">View all ${item.name}</a> <ul class="site-header__mega-list"${addAttribute(`Categories under ${item.name}`, "aria-label")}> ${item.children.map((child) => renderTemplate`<li${addAttribute(`site-header__mega-list-item${child.children.length > 0 ? " site-header__mega-list-item--has-sub" : ""}`, "class")}> <a${addAttribute(child.href, "href")} class="site-header__mega-link">${child.name}</a> ${child.children.length > 0 && renderTemplate`<ul class="site-header__mega-sublist"> ${child.children.map((sub) => renderTemplate`<li><a${addAttribute(sub.href, "href")} class="site-header__mega-sublink">${sub.name}</a></li>`)} </ul>`} </li>`)} </ul> </div> </div>`} </div>`), addAttribute(baseUrl, "href"), addAttribute(logoUrl, "src"), addAttribute(`${baseUrl}/login.php`, "href"), addAttribute(`${baseUrl}/login.php?action=create_account`, "href"), navItems.map((item) => {
    const hasSubmenus = item.children.some((c) => c.children.length > 0);
    const useCollapsible = item.children.length > 0 && hasSubmenus;
    return renderTemplate`<div class="site-header__panel-group"> ${item.children.length > 0 ? useCollapsible ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <button type="button" class="site-header__panel-toggle" aria-expanded="false" data-panel-toggle> <span>${item.name}</span> <span class="site-header__panel-chevron site-header__panel-chevron--toggle" aria-hidden="true">&#x203A;</span> </button> <div class="site-header__panel-children" hidden> <a${addAttribute(item.href, "href")} class="site-header__panel-item site-header__panel-item--view-all">View all ${item.name}</a> ${item.children.map((child) => renderTemplate`<div class="site-header__panel-child-block"> ${child.children.length > 0 ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <button type="button" class="site-header__panel-item site-header__panel-item--child site-header__panel-sub-toggle" aria-expanded="false" data-panel-sub-toggle> ${child.name} <span class="site-header__panel-chevron site-header__panel-chevron--sub" aria-hidden="true">&#x203A;</span> </button> <div class="site-header__panel-subchildren" hidden> <a${addAttribute(child.href, "href")} class="site-header__panel-item site-header__panel-item--view-all">View all ${child.name}</a> ${child.children.map((sub) => renderTemplate`<a${addAttribute(sub.href, "href")} class="site-header__panel-item site-header__panel-item--subchild">${sub.name}</a>`)} </div> ` })}` : renderTemplate`<a${addAttribute(child.href, "href")} class="site-header__panel-item site-header__panel-item--child">${child.name}</a>`} </div>`)} </div> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <a${addAttribute(item.href, "href")} class="site-header__panel-item site-header__panel-item--parent"> ${item.name} <span class="site-header__panel-chevron">&#x203A;</span> </a> <div class="site-header__panel-children"> ${item.children.map((child) => renderTemplate`<div class="site-header__panel-child-block"> <a${addAttribute(child.href, "href")} class="site-header__panel-item site-header__panel-item--child">${child.name}</a> </div>`)} </div> ` })}` : renderTemplate`<a${addAttribute(item.href, "href")} class="site-header__panel-item site-header__panel-item--parent"> ${item.name} </a>`} </div>`;
  }));
}, "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/components/Header.astro", void 0);

const $$Astro$2 = createAstro();
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Footer;
  const { baseUrl = "https://threepiece.us" } = Astro2.props;
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const TOP_LEVEL_NAV = [
    { name: "Shop", path: "/shop" },
    { name: "Brands", path: "/brands" },
    { name: "Heritage Wheel", path: "/heritage-wheel" },
    { name: "Threepieceus Gallery", path: "/vehicle-gallery" },
    { name: "Add Your Ride", path: "/add-vehicle" },
    { name: "Fitment Info", path: "/blog" }
  ];
  const categories = TOP_LEVEL_NAV.map((item) => ({
    name: item.name,
    href: `${baseUrl}${item.path.replace(/^\/?/, "/")}`
  }));
  const information = [
    { name: "Threepieceus Gallery", path: "/vehiclegallery" },
    { name: "Add Your Ride", path: "/add-vehicle" },
    { name: "Fitment Info", path: "/blog" },
    { name: "Contact Us", path: "/contact-us" },
    { name: "Privacy Policy", path: "/privacy-policy" },
    { name: "Shipping & Return", path: "/shipping-return" },
    { name: "Terms & Conditions", path: "/terms-and-conditions/" },
    { name: "Sitemap", path: "/sitemap" }
  ];
  const brands = [
    { name: "Work Wheels", path: "/new-wheels/work-wheels" },
    { name: "CCW Wheels", path: "/ccw-wheels" },
    { name: "SSR Wheels", path: "/new-wheels/ssr-wheels/" },
    { name: "Fuel Forged", path: "/fuel-forged" },
    { name: "Fuel 1PC", path: "/fuel-1pc" },
    { name: "Black Rhino", path: "/black-rhino" },
    { name: "ESR Wheels", path: "/esr-wheels" },
    { name: "EBC", path: "/brands/EBC.html" },
    { name: "TSW", path: "/tsw" },
    { name: "XD", path: "/xd" },
    { name: "View All", path: "/brands" }
  ];
  const socialLinks = [
    { name: "YouTube", href: "https://www.youtube.com/@threepieceus", icon: "youtube" },
    { name: "Instagram", href: "https://www.instagram.com/threepiece.us/", icon: "instagram" },
    { name: "Facebook", href: "https://www.facebook.com/threepieceus", icon: "facebook" }
  ];
  return renderTemplate`${maybeRenderHead()}<footer class="site-footer"> <div class="site-footer__inner"> <div class="site-footer__top"> <div class="site-footer__col site-footer__col--brand"> <h2 class="site-footer__brand-name">Threepieceus</h2> <span class="site-footer__brand-line" aria-hidden="true"></span> <a${addAttribute(`mailto:sales@threepiece.us`, "href")} class="site-footer__email"> <svg class="site-footer__email-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"> <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path> <polyline points="22,6 12,13 2,6"></polyline> </svg>
sales@threepiece.us
</a> </div> <div class="site-footer__col"> <h3 class="site-footer__heading">CATEGORIES</h3> <ul class="site-footer__links"> ${categories.map((item) => renderTemplate`<li><a${addAttribute(item.href, "href")}>${item.name}</a></li>`)} </ul> </div> <div class="site-footer__col"> <h3 class="site-footer__heading">INFORMATION</h3> <ul class="site-footer__links"> ${information.map((item) => renderTemplate`<li><a${addAttribute(`${baseUrl}${item.path}`, "href")}>${item.name}</a></li>`)} </ul> </div> <div class="site-footer__col"> <h3 class="site-footer__heading">BRANDS</h3> <ul class="site-footer__links"> ${brands.map((item) => renderTemplate`<li><a${addAttribute(`${baseUrl}${item.path}`, "href")}>${item.name}</a></li>`)} </ul> </div> <div class="site-footer__col site-footer__col--social"> <h3 class="site-footer__heading">FOLLOW US</h3> <div class="site-footer__social"> ${socialLinks.map((item) => renderTemplate`<a${addAttribute(item.href, "href")} class="site-footer__social-link" target="_blank" rel="noopener noreferrer"${addAttribute(item.name, "aria-label")}> ${item.icon === "youtube" && renderTemplate`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>`} ${item.icon === "instagram" && renderTemplate`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`} ${item.icon === "facebook" && renderTemplate`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>`} </a>`)} </div> </div> </div> <div class="site-footer__divider" aria-hidden="true"></div> <div class="site-footer__bottom"> <div class="site-footer__payments" aria-label="Accepted payment methods"> <span class="site-footer__payment">AMERICAN EXPRESS</span> <span class="site-footer__payment">DISCOVER</span> <span class="site-footer__payment">PayPal</span> <span class="site-footer__payment">VISA</span> <span class="site-footer__payment">Klarna</span> <span class="site-footer__payment">Mastercard</span> </div> <p class="site-footer__copy">© ${currentYear} Threepieceus</p> </div> </div> </footer> `;
}, "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/components/Footer.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$Astro$1 = createAstro();
const $$VehicleGalleryLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$VehicleGalleryLayout;
  const { pageTitle: titleProp, metaDescription, schemaJsonLd } = Astro2.props;
  const footerResponse = await fetch("https://www.threepiece.us/footer-only", { redirect: "follow" });
  footerResponse.ok ? await footerResponse.text() : "";
  const pageTitle = titleProp ?? "Vehicle Gallery | Three Piece";
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${pageTitle}</title>${metaDescription && renderTemplate`<meta name="description"${addAttribute(metaDescription.replace(/"/g, "&quot;"), "content")}>`}${schemaJsonLd && renderTemplate(_a$1 || (_a$1 = __template$1(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(schemaJsonLd))}${renderHead()}</head> <body> ${renderComponent($$result, "Header", $$Header, {})} ${renderSlot($$result, $$slots["default"])} ${renderComponent($$result, "Footer", $$Footer, {})} </body></html>`;
}, "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/layouts/VehicleGalleryLayout.astro", void 0);

function getVehicleSlug(data) {
  if (!data) return "";
  const toSlug = (s) => String(s ?? "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";
  const year = toSlug(data.year);
  const make = toSlug(data.make);
  const model = toSlug(data.model);
  const wheelModel = toSlug(data["wheel-model"]);
  const wheelFinish = toSlug(
    data["wheel-finish"] ?? data["wheel-finish-name"] ?? ""
  );
  const suspension = toSlug(
    data["suspension-brand"] ?? data["suspension-type"] ?? ""
  );
  const parts = [year, make, model, wheelModel].filter(Boolean);
  const after = [wheelFinish, suspension].filter(Boolean);
  const main = parts.join("-");
  const suffix = after.length ? "---" + after.join("-") : "";
  return (main + suffix).replace(/-+/g, "-").replace(/^-|-$/g, "") || "vehicle";
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const apiBaseUrl = "https://threepieceus-api-h83mp.ondigitalocean.app";
  const fetchVehicleData = async (vehicleId) => {
    const id2 = Number(vehicleId);
    if (!id2 || !Number.isInteger(id2)) return null;
    try {
      const response = await fetch(
        `${apiBaseUrl}/fitment-gallery/approved/vehicle/${id2}`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };
  const id = Astro2.params.id;
  const slug = Astro2.params.slug ?? "";
  const vehicleData = await fetchVehicleData(id);
  if (!vehicleData) {
    return Astro2.redirect("/vehicle-gallery/");
  }
  const canonicalSlug = getVehicleSlug(vehicleData);
  if (slug !== canonicalSlug) {
    return Astro2.redirect(`/vehicle-gallery/${id}/${canonicalSlug}`);
  }
  const wheelFinish = vehicleData["wheel-finish"] ?? vehicleData["wheel-finish-name"] ?? "";
  const vehicle = [vehicleData?.year, vehicleData?.make, vehicleData?.model].filter(Boolean).join(" ");
  const wheels = [vehicleData?.["wheel-brand"], vehicleData?.["wheel-model"]].filter(Boolean).join(" ");
  const tires = [vehicleData?.["tire-brand"], vehicleData?.["tire-model"]].filter(Boolean).join(" ");
  const pageTitle = ([vehicle, wheels].filter(Boolean).join(" with ") + (wheelFinish ? ` - ${wheelFinish}` : "") + (tires ? ` and ${tires}` : "")).trim() || void 0;
  const metaDescription = [
    vehicle,
    wheels && `with ${wheels} wheels`,
    wheelFinish && wheelFinish,
    tires && `and ${tires} tires`
  ].filter(Boolean).join(" ").trim() + ". View fitment specs, wheel size, offset, and suspension details at Three Piece.";
  const baseUrl = "https://threepiece.us";
  const pageUrl = `${baseUrl}/vehicle-gallery/${id}/${canonicalSlug}`;
  const imageUrls = [1, 2, 3, 4, 5].map((n) => vehicleData?.[`image-${n}`]).filter(Boolean);
  const firstImageUrl = imageUrls[0];
  const imageNumbers = [1, 2, 3, 4, 5].filter((n) => vehicleData?.[`image-${n}`]);
  const nextArrowSvg = `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cpath d='M1.45679 1.00746147l21 20.02482143L1.50885 41.0074615' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none' fill-rule='evenodd' /%3E%3C/svg%3E`;
  const prevArrowSvg = `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg transform='translate(24,0) scale(-1,1)'%3E%3Cpath d='M1.45679 1.00746147l21 20.02482143L1.50885 41.0074615' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none' fill-rule='evenodd' /%3E%3C/g%3E%3C/svg%3E`;
  const schemaJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: pageTitle ?? vehicle,
        description: metaDescription,
        url: pageUrl,
        ...firstImageUrl && {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: firstImageUrl
          }
        },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Vehicle Gallery", item: `${baseUrl}/vehicle-gallery` },
          { "@type": "ListItem", position: 3, name: vehicle }
        ]
      },
      {
        "@type": "Vehicle",
        name: vehicle,
        ...vehicleData?.year && { vehicleModelDate: Number(vehicleData.year) },
        ...vehicleData?.make && { brand: { "@type": "Brand", name: String(vehicleData.make) } },
        ...vehicleData?.model && { model: String(vehicleData.model) },
        ...imageUrls.length > 0 && {
          image: imageUrls.map((url) => ({ "@type": "ImageObject", url }))
        }
      }
    ]
  });
  return renderTemplate(_a || (_a = __template(["", " <script>	\n	(function () {\n		const slider = document.getElementById('vehicle-slider');\n		if (!slider) return;\n		const trackNode = slider.querySelector('.vehicle-slider__track');\n		const slides = slider.querySelectorAll('.vehicle-slider__slide');\n		const prev = slider.querySelector('.vehicle-slider__prev');\n		const next = slider.querySelector('.vehicle-slider__next');\n		const dots = slider.querySelectorAll('.vehicle-slider__dot');\n		const total = slides.length;\n		if (total <= 1 || !trackNode) return;\n\n		const track = trackNode instanceof HTMLElement ? trackNode : null;\n		if (!track) return;\n\n		var index = 0;\n		var touchStartX = 0;\n		var touchStartY = 0;\n		var touchStartIndex = 0;\n		var touchIsHorizontal = null;\n\n		function goTo(i) {\n			index = Math.max(0, Math.min(i, total - 1));\n			track.style.transition = '';\n			track.style.transform = 'translate3d(-' + (index * 100) + '%, 0, 0)';\n			dots.forEach(function (dot, j) {\n				dot.setAttribute('aria-selected', j === index ? 'true' : 'false');\n				dot.classList.toggle('is-active', j === index);\n			});\n		}\n\n		if (prev) prev.addEventListener('click', function () { goTo(index - 1); });\n		if (next) next.addEventListener('click', function () { goTo(index + 1); });\n		dots.forEach(function (dot, i) { dot.addEventListener('click', function () { goTo(i); }); });\n\n		track.addEventListener('touchstart', function (e) {\n			if (e.touches.length !== 1) return;\n			touchStartX = e.touches[0].clientX;\n			touchStartY = e.touches[0].clientY;\n			touchStartIndex = index;\n			touchIsHorizontal = null;\n			track.style.transition = 'none';\n		}, { passive: true });\n\n		track.addEventListener('touchmove', function (e) {\n			if (e.touches.length !== 1) return;\n			var x = e.touches[0].clientX;\n			var y = e.touches[0].clientY;\n			var deltaX = x - touchStartX;\n			var deltaY = y - touchStartY;\n			if (touchIsHorizontal === null) {\n				touchIsHorizontal = Math.abs(deltaX) > Math.abs(deltaY);\n			}\n			if (touchIsHorizontal && Math.abs(deltaX) > 5) {\n				e.preventDefault();\n			}\n			var trackWidth = track.offsetWidth;\n			var minOffset = -(total - 1) * trackWidth;\n			var maxOffset = 0;\n			var offsetPx = -touchStartIndex * trackWidth + deltaX;\n			offsetPx = Math.max(minOffset, Math.min(maxOffset, offsetPx));\n			track.style.transform = 'translate3d(' + offsetPx + 'px, 0, 0)';\n		}, { passive: false });\n\n		track.addEventListener('touchend', function (e) {\n			track.style.transition = '';\n			if (e.changedTouches.length !== 1) return;\n			var endX = e.changedTouches[0].clientX;\n			var deltaX = endX - touchStartX;\n			var trackWidth = track.offsetWidth;\n			var threshold = trackWidth * 0.2;\n			if (deltaX > threshold) {\n				goTo(touchStartIndex - 1);\n			} else if (deltaX < -threshold) {\n				goTo(touchStartIndex + 1);\n			} else {\n				goTo(touchStartIndex);\n			}\n		}, { passive: true });\n\n		goTo(0);\n	})();\n<\/script>"])), renderComponent($$result, "VehicleGalleryLayout", $$VehicleGalleryLayout, { "pageTitle": pageTitle, "metaDescription": metaDescription, "schemaJsonLd": schemaJsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="vehicle-gallery-page"> <div class="container"> <div> <nav class="breadcrumbs" aria-label="Breadcrumb"> <a href="https://threepiece.us/">Home</a> <span class="breadcrumbs-sep" aria-hidden="true">/</span> <a href="https://threepiece.us/vehicle-gallery">Vehicle Gallery</a> <span class="breadcrumbs-sep" aria-hidden="true">/</span> <span class="breadcrumbs-current">${vehicle}</span> </nav> <h1 class="vehicle-title"> ${vehicleData?.year} ${vehicleData?.make} ${vehicleData?.model} </h1> <h5 class="vehicle-wheel-info"> ${vehicleData?.["wheel-brand"]} ${vehicleData?.["wheel-model"]} -${" "} ${vehicleData?.["tire-brand"]} ${vehicleData?.["tire-model"]} </h5> </div> <div class="vehicle-gallery_container"> <div class="vehicle-content"> <div class="vehicle-slider" id="vehicle-slider"${addAttribute(imageNumbers.length, "data-slide-count")}> <div class="vehicle-slider__track"> ${imageNumbers.map((number) => renderTemplate`<div class="vehicle-slider__slide"> <img${addAttribute(vehicleData?.[`image-${number}`], "src")}${addAttribute(`${vehicle} - Image ${number}`, "alt")}${addAttribute(`${vehicle} - Image ${number}`, "title")}${addAttribute(number === 1 ? "eager" : "lazy", "loading")}${addAttribute(number === 1 ? "high" : void 0, "fetchpriority")}> </div>`)} </div> ${imageNumbers.length > 1 && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <button type="button" class="vehicle-slider__prev" aria-label="Previous image"> <img class="vehicle-slider__arrow"${addAttribute(prevArrowSvg, "src")} alt="" width="10"> </button> <button type="button" class="vehicle-slider__next" aria-label="Next image"> <img class="vehicle-slider__arrow"${addAttribute(nextArrowSvg, "src")} alt="" width="10"> </button> <ul class="vehicle-slider__dots" role="tablist" aria-label="Image navigation"> ${imageNumbers.map((_, i) => renderTemplate`<li role="presentation"> <button type="button" class="vehicle-slider__dot"${addAttribute(i, "data-index")}${addAttribute(`Image ${i + 1}`, "aria-label")}${addAttribute(i === 0, "aria-selected")} role="tab"></button> </li>`)} </ul> ` })}`} </div> <div class="vehicle-information"> <div class="vehicle-tab"> <div class="tab"> <h3>Vehicle</h3> </div> <div class="content"> <h4>
Year: <span class="year">${vehicleData?.year}</span> </h4> <h4>
Make: <span class="make">${vehicleData?.make}</span> </h4> <h4>
Model: <span class="model">${vehicleData?.model}</span> </h4> <h4>
Owner:${" "} <a class="ownerInstagram" target="_blank" rel="nofollow"${addAttribute(`https://www.instagram.com/${vehicleData?.instagramHandle?.replace?.(
    "@",
    ""
  ) ?? ""}`, "href")}> ${vehicleData?.instagramHandle} </a> </h4> </div> </div> <div class="wheel-tab"> <div class="tab"> <h3>Wheels</h3> </div> <div class="content"> <div> <h3>
Front:${" "} <span class="frontWheelSize"> ${vehicleData?.["front-diameter"]}x
${vehicleData?.["front-width"]} </span> </h3> <h4>
Brand:${" "} <span class="wheelBrand"> ${vehicleData?.["wheel-brand"]} </span> </h4> <h4>
Model:${" "} <span class="wheelModel"> ${vehicleData?.["wheel-model"]} </span> </h4> <h4>
Diameter:${" "} <span class="frontDiameter"> ${vehicleData?.["front-diameter"]} </span> </h4> <h4>
Width:${" "} <span class="frontWidth"> ${vehicleData?.["front-width"]} </span> </h4> <h4>
Offset:${" "} <span class="frontOffset"> ${vehicleData?.["front-offset"]} </span> </h4> </div> <div> <h3>
Rear:${" "} <span class="rearWheelSize"> ${vehicleData?.["rear-diameter"]}x
${vehicleData?.["rear-width"]} </span> </h3> <h4>
Diameter:${" "} <span class="rearDiameter"> ${vehicleData?.["rear-diameter"]} </span> </h4> <h4>
Width:${" "} <span class="rearWidth"> ${vehicleData?.["rear-width"]} </span> </h4> <h4>
Offset:${" "} <span class="rearOffset"> ${vehicleData?.["rear-offset"]} </span> </h4> </div> </div> </div> <div class="tire-tab"> <div class="tab"> <h3>Tires</h3> </div> <div class="content"> <div> <h3>
Front:${" "} <span class="frontTireSize"> ${vehicleData?.["front-tire-size"]}/
${vehicleData?.["front-aspect-ratio"]} </span> </h3> <h4>
Brand:${" "} <span class="tireBrand"> ${vehicleData?.["tire-brand"]} </span> </h4> <h4>
Model:${" "} <span class="tireModel"> ${vehicleData?.["tire-model"]} </span> </h4> </div> <div> <h3>
Rear:${" "} <span class="rearTireSize"> ${vehicleData?.["rear-tire-size"]}/
${vehicleData?.["rear-aspect-ratio"]} </span> </h3> <h4>
Brand:${" "} <span class="tireBrand"> ${vehicleData?.["tire-brand"]} </span> </h4> <h4>
Model:${" "} <span class="tireModel"> ${vehicleData?.["tire-model"]} </span> </h4> </div> </div> </div> <div class="modification-tab"> <div class="tab"> <h3>Modifications</h3> </div> <div class="content"> <div> <h4>
Suspension:${" "} <span class="suspension"> ${vehicleData?.["suspension-type"]} </span> </h4> <h4>
Stance:${" "} <span class="stanceType"> ${vehicleData?.["stance"]} </span> </h4> <h4>
Rubbing:${" "} <span class="frontRubbing"> ${vehicleData?.["front-rubbing"]} </span> </h4> <h4>
Spacers:${" "} <span class="frontSpacers"> ${vehicleData?.["front-spacer"]} </span> </h4> </div> <div> <h4>
Rubbing:${" "} <span class="rearRubbing"> ${vehicleData?.["rear-rubbing"]} </span> </h4> <h4>
Spacers:${" "} <span class="rearSpacers"> ${vehicleData?.["rear-spacer"]} </span> </h4> </div> </div> </div> </div> </div> <div class="additional-details"> <div class="additional-details-tab"> <div class="tab"> <h3>Additional Information</h3> </div> <div class="content"> <p>
You're here because you want to know what wheels fit onto a${" "} <span class="yearMakeModel"> ${vehicleData?.["year"]} ${vehicleData?.["make"]}${" "} ${vehicleData?.["model"]} </span>${" "}
right? This${" "} <span class="yearMakeModel"> ${vehicleData?.["year"]} ${vehicleData?.["make"]}${" "} ${vehicleData?.["model"]} </span>${" "}
is running a set of${" "} <span class="frontDiameter"> ${vehicleData?.["front-diameter"]} </span>
x
<span class="frontWidth"> ${vehicleData?.["front-width"]} </span>${" "} <span class="frontOffset"> ${vehicleData?.["front-offset"]} </span>${" "} <span class="wheelBrand"> ${vehicleData?.["wheel-brand"]} </span>${" "} <span class="wheelModel"> ${vehicleData?.["wheel-model"]} </span>${" "}
and${" "} <span class="rearDiameter"> ${vehicleData?.["rear-diameter"]} </span>
x
<span class="rearWidth">${vehicleData?.["rear-width"]}</span>${" "} <span class="rearOffset"> ${vehicleData?.["rear-offset"]} </span>${" "}
with${" "} <span class="frontTireSize"> ${vehicleData?.["front-tire-size"]}/
${vehicleData?.["front-aspect-ratio"]}R
</span> <span class="frontDiameter"> ${vehicleData?.["front-diameter"]} </span> <span class="tireBrand"> ${" "} ${vehicleData?.["tire-brand"]} </span>${" "}
in the front and${" "} <span class="rearTireSize"> ${vehicleData?.["rear-tire-size"]}/
${vehicleData?.["rear-aspect-ratio"]}R
</span> <span class="rearDiameter"> ${vehicleData?.["rear-diameter"]} </span>${" "}
in the rear.
</p> <p>
This vehicle is on${" "} <span class="suspension"> ${vehicleData?.["suspension-type"]} </span>${" "} <span class="suspension"> ${vehicleData?.["suspension-brand"]} </span>${" "}
and as for spacers, this${" "} <span class="yearMakeModel"> ${vehicleData?.["year"]} ${vehicleData?.["make"]}${" "} ${vehicleData?.["model"]} </span>${" "}
is running${" "} <span class="frontSpacers"> ${vehicleData?.["front-spacer"]} </span>${" "}
spacers in the front and${" "} <span class="rearSpacers"> ${vehicleData?.["rear-spacer"]} </span>${" "}
spacers in the rear.
</p> <p>
With this setup there is${" "} <span class="frontRubbing"> ${vehicleData?.["front-rubbing"]} </span>${" "}
in the front and${" "} <span class="rearRubbing"> ${vehicleData?.["rear-rubbing"]} </span>${" "}
in the rear. Now, as for fitment - this${" "} <span class="yearMakeModel"> ${vehicleData?.["year"]} ${vehicleData?.["make"]}${" "} ${vehicleData?.["model"]} </span>${" "}
has${" "} <span class="stanceType">${vehicleData?.["stance"]}</span>${" "}
fitment which we think looks great! Want the same setup for your
				  ride? Check out the exact wheels, tires, and suspension this
				  build is running below and if you like their car, be sure to
				  follow them on their IG and upvote this build to help others
				  find the perfect fitment for${" "} <span class="yearMakeModel"> ${vehicleData?.["year"]} ${vehicleData?.["make"]}${" "} ${vehicleData?.["model"]} </span>${" "}
with${" "} <span class="wheelBrand"> ${vehicleData?.["wheel-brand"]} </span> <span class="wheelModel"> ${vehicleData?.["wheel-model"]} </span>${" "}
As a reminder - our gallery is curated by our community so
				  please be sure to check a couple of builds to make sure the
				  fitment you want is doable - but if multiple people are doing
				  it, we'd bet you can too!
</p> </div> </div> </div> </div> </div> </div> ` }));
}, "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/pages/vehicle-gallery/[id]/[slug].astro", void 0);

const $$file = "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/pages/vehicle-gallery/[id]/[slug].astro";
const $$url = "/vehicle-gallery/[id]/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
