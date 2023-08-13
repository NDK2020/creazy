const routes: Route.Config = {
  path: '/song-json',
  name: 'Song json',
  redirect: '/song-json/index',
  component: () => import('@/layout/index.vue'),
  meta: {
    sort: 2,
    isRoot: true,
    icon: 'emojione:page-with-curl',
  },
  children: [
    {
      path: 'index',
      name: 'song-json_index',
      component: () => import('@/pages/song-json/index.vue'),
    },
  ],
}

export default routes
