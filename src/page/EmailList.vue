<template>
  <div v-loading="loading">
    <div v-if="this.list && this.list.length > 0">
      <div class="email-item" v-for="(item) in this.list" :key="item.uuid" @click="openEmail(item)">
        <el-row :gutter="20">
          <el-col :span="1"><input type="checkbox"/></el-col>
          <el-col :span="6">
            <div class="email-name">{{ emailAddress(item) }}@w3mail.com</div>
          </el-col>
          <el-col :span="6">
            <div class="email-title">{{ renderHex(item.title) }}</div>
          </el-col>
          <el-col :span="6">
            <div class="email-message">******************</div>
          </el-col>
          <el-col :span="5">
            <div class="email-time">{{ renderTimestamp(item.time) }}</div>
          </el-col>
        </el-row>
      </div>
      <div class="divider"/>
    </div>
    <el-empty v-else description="No Data"></el-empty>
  </div>
</template>

<script>
import {ethers} from "ethers";
import {getEmails} from "@/utils/w3mail";

const hexToString = (h) => ethers.utils.toUtf8String(h);

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
        minute: "numeric",
        hour: "numeric",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    renderHex(text) {
      return hexToString(text);
    },
    emailAddress(item) {
      return this.renderHex(this.types === 1 ? item.fromMail : item.toMail);
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
    openEmail(item) {
      const query = {
        index: "100",
        uuid: item.uuid,
        from: item.fromMail,
        to: item.toMail,
        title: item.title,
        time: this.renderTimestamp(item.time),
      };
      query.types = this.types;
      if (item.fileUuid && item.fileUuid !== '0x') {
        query.file = item.fileUuid;
        query.fname = item.fileName;
      }
      this.$router.push({
        path: '/email',
        query: query
      });
    }
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
  padding: 10px 0;
  margin: 0 !important;
  cursor: pointer;
}
.email-item:hover {
  background: #cccccc50;
}

.divider {
  height: 1px;
  width: 100%;
  background: #DCDFE6;
}
.email-name,
.email-title {
  font-size: 16px;
}
.email-message,
.email-time {
  font-size: 13px;
}
</style>
