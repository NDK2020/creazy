const routes: Route.Config = {
  path: '/midi-rules',
  name: 'Midi rules',
  redirect: '/midi-rules/index',
  component: () => import('@/layout/index.vue'),
  meta: {
    sort: 2,
    isRoot: true,
    icon: 'noto-v1:triangular-ruler',
  },
  children: [
    {
      path: 'index',
      name: 'midi-rules_index',
      component: () => import('@/pages/midi-rules/index.vue'),
    },
  ],
}

export default routes
