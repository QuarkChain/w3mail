<template>
  <div v-loading="loading">
    <div v-if="this.list && this.list.length > 0">
      <el-row :gutter="20" class="email-item" v-for="(item) in this.list" :key="item.uuid" @click="openEmail(item)">
        <el-col :span="1"><input type="checkbox"/></el-col>
        <el-col :span="4"><div class="email-name">{{ item.emailAddress }}@w3mail.com</div></el-col>
        <el-col :span="5"><div class="email-title">{{ item.title }}</div></el-col>
        <el-col :span="10"><div class="email-message">******************</div></el-col>
        <el-col :span="4"><div class="email-time">{{ renderTimestamp(item.time) }}</div></el-col>
      </el-row>
      <div class="divider"/>
    </div>
    <el-empty v-else description="No Data"></el-empty>
  </div>
</template>

<script>

import {getEmails} from "@/utils/w3mail";

export default {
  name: 'EmailList',
  data: () => {
    return {
      loadInterval: null,
    }
  },
  props: {
    types: {
      type: Number,
      default: 1
    }
  },
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {EmailController} = this.$store.state.chainConfig;
        return EmailController;
      }
      return null;
    },
    account() {
      return this.$store.state.account;
    },
    loading() {
      return this.list === undefined;
    }
  },
  asyncComputed: {
    list: {
      async get() {
        if (this.account && this.contract) {
          return await getEmails(this.contract, this.types);
        }
        return undefined;
      },
      default: undefined,
      watch: ['account']
    },
  },
  methods: {
    renderTimestamp(ts) {
      if (!ts) {
        return "";
      }
      return ts.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    loadData() {
      this.$asyncComputed.list.update();
    },
    initData() {
      if (this.loadInterval) {
        clearInterval(this.loadInterval);
      }
      this.loadData();
      this.loadInterval = setInterval(this.loadData, 200000);
    },
  },
  created() {
    this.initData();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.email-item {
  width: 100%;
  border-top: 1px solid #DCDFE6;
  padding: 5px 0;
  margin: 0 !important;
}
.divider {
  height: 1px;
  width: 100%;
  background: #DCDFE6;
}

</style>
