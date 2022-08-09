<template>
  <el-col>
    <div class="email-title-item">
      <span class="email-title">Subject:</span>
      <span>{{this.subject}}</span>
    </div>
    <div class="email-title-item">
      <span v-if="this.types==='1'" class="email-title">From:</span>
      <span v-else class="email-title">To:</span>
      <span>{{this.email}}@w3mail.com</span>
    </div>
    <div class="email-title-item">
      <span class="email-title">Date:</span>
      <span>{{this.time}}</span>
    </div>
    <div v-if="this.fileUuid" class="email-title-item">
      <div class="input-file">
        <i class="el-icon-paperclip" style="margin-right: 2px"></i><span>{{ this.fileName }}</span>
      </div>
    </div>
    <div class="email-message" v-loading="!this.emailMessage">
      <el-empty v-if="this.emailMessage==='-deleted'" description="This Email Is Delete!" :image-size="100" />
      <el-empty v-else-if="this.emailMessage==='-error'" description="Decrypt Fail!" :image-size="100" />
      <div v-else v-html="markdownToHtml" />
    </div>
  </el-col>
</template>

<script>
import {getEmailMessageByUuid} from "@/utils/w3mail";
import {ethers} from "ethers";
import {marked} from 'marked';

const hexToString = (h) => ethers.utils.toUtf8String(h);

export default {
  name: 'EmailInfo',
  data: () => {
    return {
      types: 0,
      uuid: undefined,
      subject: undefined,
      from: undefined,
      to: undefined,
      fileUuid: undefined,
      fileName: undefined,
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
    markdownToHtml(){
      if (this.emailMessage) {
        return marked(this.emailMessage);
      }
      return "";
    }
  },
  asyncComputed: {
    emailMessage: {
      async get() {
        if (this.uuid && this.account) {
          let context = sessionStorage.getItem(this.uuid);
          if (context) {
            return context;
          }
          context = await getEmailMessageByUuid(this.contract, this.account, this.types, this.uuid);
          if (context) {
            sessionStorage.setItem(this.uuid, context);
            return context;
          }
          return '-error';
        }
        return undefined;
      },
      default: undefined,
      watch: ['account', 'uuid']
    },
  },
  created() {
    const query = this.$route.query;
    this.types = query.types;
    this.uuid = query.uuid;
    this.subject = hexToString(query.title);
    this.email = hexToString(query.email);
    this.time = query.time;
    if (query.file) {
      this.fileUuid = query.file;
      this.fileName = query.fname;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.email-title-item {
  color: black;
  font-size: 14px;
  padding: 5px;
  text-align: left;
  border-bottom: 1px solid #cccccc;
}
.email-title {
  font-weight: bold;
  margin-right: 10px;
}

.input-file {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  padding: 2px 10px;
  border: 1px solid #999999;
  border-radius: 25px;
  font-size: 12px;
  color: black;
  cursor: pointer;
  width: min-content;
}
.input-file:hover {
  border: 1px solid #6E529C;
}

.email-message {
  width: 100%;
  margin: 20px;
  text-align: left;
  min-height: 360px;
}
</style>
