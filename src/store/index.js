import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
export default new Vuex.Store({
  state: {
    chainConfig: {},
    account: '',
    driveKey: '',
    user: {}
  },
  mutations: {
    chainMutation: (state, payload) => state.chainConfig = payload,
    accountMutation:  (state, payload) => state.account = payload,
    driveKeyMutation:  (state, payload) => state.driveKey = payload,
    userMutation:  (state, payload) => state.user = payload,
  },
  actions: {
    setChainConfig: ({ commit }, payload) => commit('chainMutation', payload),
    setAccount: ({ commit }, payload) => commit('accountMutation', payload),
    setDriveKey: ({ commit }, payload) => commit('driveKeyMutation', payload),
    setUser: ({ commit }, payload) => commit('userMutation', payload),
  },
  modules: {
  },
});
