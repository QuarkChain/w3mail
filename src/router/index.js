import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../components/Home.vue';
import Profile from '../components/Profile.vue';
import File from '../components/File.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/address',
    name: 'Profile',
    component: Profile,
  },
  {
    path: '/file/:uuid',
    name: 'File',
    component: File,
  },
];

const router = new VueRouter({
  base: '/w3mail.w3q/',
  routes,
});

export default router;
