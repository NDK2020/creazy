const routes: Route.Config = {
  path: '/home',
  name: 'Home',
  redirect: '/home/index',
  component: () => import('@/layout/index.vue'),
  meta: {
    sort: 1,
    isRoot: true,
    icon: 'logos:homebrew',
  },
  children: [
    {
      path: 'index',
      name: 'home_index',
      component: () => import('@/pages/home/index.vue'),
    },
  ],
}

export default routes
