<template>
  <el-col>
    <div class="email-title-item">
      <span class="email-title">Subject:</span>
      <span>{{this.subject}}</span>
    </div>
    <div class="email-title-item">
      <span v-if="this.types==='1'" class="email-title">From:</span>
      <span v-else class="email-title">To:</span>
      <span>{{this.email}}</span>
    </div>
    <div class="email-title-item">
      <span class="email-title">Date:</span>
      <span>{{this.time}}</span>
    </div>
    <div v-if="this.fileUuid" class="email-title-item">
      <el-button class="input-file" :loading="this.download" :disabled="!this.fileKey" @click="onDownload">
        {{ this.fileName }}
      </el-button>
    </div>

    <div class="email-message" v-loading="!this.emailMessage">
      <div v-if="this.emailMessage==='-deleted'" class="empty-error">
        <i class="el-icon-error empty-image"/>
        <span class="empty-description">This Email Is Delete!</span>
      </div>
      <div v-else-if="this.emailMessage==='-error'" class="empty-error">
        <i class="el-icon-warning empty-image"/>
        <span class="empty-description">Decrypt Fail!</span>
      </div>
      <div v-else v-html="markdownToHtml" />
    </div>
  </el-col>
</template>

<script>
import {downloadFile, getEmailMessageByUuid} from "@/utils/w3mail";
import {ethers} from "ethers";
import {marked} from 'marked';
import fileDownload from "js-file-download";

const hexToString = (h) => ethers.utils.toUtf8String(h);

export default {
  name: 'EmailInfo',
  data: () => {
    return {
      types: 0,
      uuid: undefined,
      subject: undefined,
      isEncryption: false,
      from: undefined,
      email: undefined,
      fileUuid: undefined,
      fileName: undefined,
      fileData: undefined,
      download: false
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
    },
    fileKey() {
      if (this.emailMessage) {
        return sessionStorage.getItem(this.uuid + "fileKey");
      }
      return undefined;
    }
  },
  asyncComputed: {
    emailMessage: {
      async get() {
        if (this.uuid && this.account) {
          const context = sessionStorage.getItem(this.uuid);
          if (context) {
            return context;
          }
          const result = await getEmailMessageByUuid(this.contract, this.account, this.isEncryption, this.types, this.from, this.uuid);
          if (result) {
            sessionStorage.setItem(this.uuid, result.content);
            sessionStorage.setItem(this.uuid + "fileKey", result.key);
            return result.content;
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
    this.isEncryption = query.isEncryption;
    this.subject = hexToString(query.title);
    this.from = query.from;
    this.to = query.to;
    this.email = query.types === '1' ? query.from : query.to;
    this.time = query.time;
    this.uuid = query.uuid;
    if (query.file) {
      this.fileUuid = query.file;
      this.fileName = hexToString(query.fname);
    }
  },
  methods: {
    async onDownload() {
      // download image
      if (this.fileData) {
        fileDownload(this.fileData, this.fileName);
        return;
      }

      if (!this.contract) {
        return;
      }
      this.download = true;
      const data = await downloadFile(this.contract, this.from, this.fileUuid, this.fileKey);
      if (data !== '-deleted') {
        this.fileData = data;
        fileDownload(this.fileData, this.fileName);
      } else {
        this.$notify({title: 'Error', message: 'This File is deleted!', type: 'error'});
      }
      this.download = false;
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
  padding: 5px 8px;
  margin: 3px 0;
  border: 1px solid #999999;
  border-radius: 25px;
  font-size: 12px;
  color: black;
  cursor: pointer;
  width: min-content;
}
.input-file:hover {
  color: black;
  background: #ffffff;
  border: 1px solid #6E529C;
}
.input-file:disabled {
  color: #cccccc;
}

.email-message {
  width: 100%;
  margin: 20px;
  text-align: left;
  min-height: 360px;
}
.empty-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 120px 0;
}
.empty-image {
  color: #f5365c;
  font-size: 40px;
}
.empty-description {
  color: #f5365c;
  font-size: 16px;
  margin-top: 10px;
}
</style>
