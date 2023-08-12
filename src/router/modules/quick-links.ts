const routes: Route.Config = {
  path: '/quick-links',
  name: 'Quick links',
  redirect: '/quick-links/index',
  component: () => import('@/layout/index.vue'),
  meta: {
    sort: 2,
    isRoot: true,
    icon: 'emojione:page-with-curl',
  },
  children: [
    {
      path: 'index',
      name: 'quick-links_index',
      component: () => import('@/pages/quick-links/index.vue'),
    },
  ],
}

export default routes
