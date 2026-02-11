import { e as createComponent, k as renderComponent, l as renderSlot, r as renderTemplate, h as createAstro, u as unescapeHTML, n as Fragment, o as renderScript, m as maybeRenderHead, g as addAttribute } from '../../../chunks/astro/server_BJzW4Wti.mjs';
import 'piccolore';
/* empty css                                        */
export { renderers } from '../../../renderers.mjs';

function splitHeaderHtmlForSlot(html) {
  const idPattern = /id\s*=\s*["']header-only-page["']/i;
  const idx = html.search(idPattern);
  if (idx === -1) {
    return { before: html, after: "" };
  }
  const openStart = html.lastIndexOf("<div", idx);
  if (openStart === -1) return { before: html, after: "" };
  const openEnd = html.indexOf(">", openStart) + 1;
  if (openEnd === 0) return { before: html, after: "" };
  let depth = 1;
  let i = openEnd;
  const len = html.length;
  while (i < len && depth > 0) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = html.indexOf(">", nextOpen) + 1;
    } else {
      depth--;
      if (depth === 0) {
        return {
          before: html.slice(0, nextClose),
          after: html.slice(nextClose)
        };
      }
      i = nextClose + 6;
    }
  }
  return { before: html, after: "" };
}

const $$Astro$1 = createAstro();
const $$VehicleGalleryLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$VehicleGalleryLayout;
  const { pageTitle: titleProp, metaDescription, schemaJsonLd } = Astro2.props;
  const [headerResponse, footerResponse] = await Promise.all([
    fetch("https://www.threepiece.us/header-only", { redirect: "follow" }),
    fetch("https://www.threepiece.us/footer-only", { redirect: "follow" })
  ]);
  let headerHtml = headerResponse.ok ? await headerResponse.text() : "";
  const footerHtml = footerResponse.ok ? await footerResponse.text() : "";
  const pageTitle = titleProp ?? "Vehicle Gallery | Three Piece";
  if (headerHtml.includes("<title>")) {
    headerHtml = headerHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${pageTitle}</title>`);
  } else {
    headerHtml = headerHtml.replace("</head>", `<title>${pageTitle}</title>
	</head>`);
  }
  if (metaDescription) {
    const metaDescTag = `<meta name="description" content="${metaDescription.replace(/"/g, "&quot;")}" />`;
    headerHtml = headerHtml.replace("</head>", metaDescTag + "\n	</head>");
  }
  if (schemaJsonLd) {
    const scriptTag = `<script type="application/ld+json">${schemaJsonLd}<\/script>`;
    headerHtml = headerHtml.replace("</head>", scriptTag + "\n	</head>");
  }
  const { before: headerBefore, after: headerAfter } = splitHeaderHtmlForSlot(headerHtml);
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate`${unescapeHTML(headerBefore)}` })}${renderSlot($$result, $$slots["default"])}${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate`${unescapeHTML(headerAfter)}` })}${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate`${unescapeHTML(footerHtml)}` })}`;
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
  return renderTemplate`${renderComponent($$result, "VehicleGalleryLayout", $$VehicleGalleryLayout, { "pageTitle": pageTitle, "metaDescription": metaDescription, "schemaJsonLd": schemaJsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="vehicle-gallery-page"> <div class="container"> <div> <nav class="breadcrumbs" aria-label="Breadcrumb"> <a href="https://threepiece.us/">Home</a> <span class="breadcrumbs-sep" aria-hidden="true">/</span> <a href="https://threepiece.us/vehicle-gallery">Vehicle Gallery</a> <span class="breadcrumbs-sep" aria-hidden="true">/</span> <span class="breadcrumbs-current">${vehicle}</span> </nav> <h1 class="vehicle-title"> ${vehicleData?.year} ${vehicleData?.make} ${vehicleData?.model} </h1> <h5 class="vehicle-wheel-info"> ${vehicleData?.["wheel-brand"]} ${vehicleData?.["wheel-model"]} -${" "} ${vehicleData?.["tire-brand"]} ${vehicleData?.["tire-model"]} </h5> </div> <div class="vehicle-gallery_container"> <div class="vehicle-content"> <div class="vehicle-slider" id="vehicle-slider"${addAttribute(imageNumbers.length, "data-slide-count")}> <div class="vehicle-slider__track"> ${imageNumbers.map((number) => renderTemplate`<div class="vehicle-slider__slide"> <img${addAttribute(vehicleData?.[`image-${number}`], "src")}${addAttribute(`${vehicle} - Image ${number}`, "alt")}${addAttribute(`${vehicle} - Image ${number}`, "title")}${addAttribute(number === 1 ? "eager" : "lazy", "loading")}${addAttribute(number === 1 ? "high" : void 0, "fetchpriority")}> </div>`)} </div> ${imageNumbers.length > 1 && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <button type="button" class="vehicle-slider__prev" aria-label="Previous image"> <img class="vehicle-slider__arrow"${addAttribute(prevArrowSvg, "src")} alt="" width="10"> </button> <button type="button" class="vehicle-slider__next" aria-label="Next image"> <img class="vehicle-slider__arrow"${addAttribute(nextArrowSvg, "src")} alt="" width="10"> </button> <ul class="vehicle-slider__dots" role="tablist" aria-label="Image navigation"> ${imageNumbers.map((_, i) => renderTemplate`<li role="presentation"> <button type="button" class="vehicle-slider__dot"${addAttribute(i, "data-index")}${addAttribute(`Image ${i + 1}`, "aria-label")}${addAttribute(i === 0, "aria-selected")} role="tab"></button> </li>`)} </ul> ` })}`} </div> <div class="vehicle-information"> <div class="vehicle-tab"> <div class="tab"> <h3>Vehicle</h3> </div> <div class="content"> <h4>
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
</p> </div> </div> </div> </div> </div> </div> ` })} ${renderScript($$result, "/Users/josephvega/Documents/ThreePieceUs/threepiece-vehicle-gallery/src/pages/vehicle-gallery/[id]/[slug].astro?astro&type=script&index=0&lang.ts")}`;
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
