import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../components/HelloWorld.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
];

const router = new VueRouter({
  base: '/w3mail.w3q/',
  routes,
});

export default router;
