// import devtools from "@vue/devtools";
import { createApp } from "vue";
import App from "./App.vue";

import { setup_router } from './router'
// import { setupStore } from './stores'

import 'uno.css';
import "ant-design-vue/dist/antd.css";

async function setup_app() {
  const app = createApp(App)
  await setup_router(app)
  // setupStore(app)
  app.mount('#app')
  // app.use(Antd);
}

setup_app();

// createApp(App).mount("#app");

// if (process.env.NODE_ENV === 'development') {
//   devtools.connect('http://localhost', 8098)
// }
