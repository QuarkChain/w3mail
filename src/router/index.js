import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../page/Home.vue';
import Register from '../page/Register.vue';
import Email from '../page/Email.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/email',
    name: 'Email',
    component: Email,
  },
];

const router = new VueRouter({
  base: '/w3mail.w3q/',
  routes,
});

export default router;
