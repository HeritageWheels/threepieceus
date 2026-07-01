import { defineMiddleware } from 'astro:middleware';
import { findCategoryRoute } from './lib/category-routes';

export const onRequest = defineMiddleware(async (context, next) => {
  const route = findCategoryRoute(context.url.pathname);
  if (!route) return next();

  const url = new URL(context.url);
  url.pathname = '/collections';
  url.searchParams.set('categoryId', String(route.categoryId));
  url.searchParams.set('name', route.name);
  url.searchParams.set('parentName', route.parent.name);
  url.searchParams.set('parentPath', route.parent.path);

  return context.rewrite(url);
});
