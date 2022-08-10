<template>
  <el-col>
    <el-input size="small" v-model="to">
      <div slot="prepend" class="input-title">To:</div>
    </el-input>
    <el-input size="small" v-model="subject" class="input-to">
      <div slot="prepend" class="input-title">Subject:</div>
    </el-input>
    <w3q-deployer class="mail-deployer" :drag="false"
                  :fileContract="contract" :driveKey="this.driveKey"
                  :emailUuid="this.uuid" :onSuccess="onSuccess" :onDelete="onDelete"/>
    <mavon-editor language="en" defaultOpen="edit" :subfield="false"
                  :boxShadow="false" :toolbars="toolbar"
                  class="mkd-editor" @change="onChange"/>
    <el-button class="home-btn" :loading="this.sending" @click="onSend">Send</el-button>
  </el-col>
</template>

<script>
import { mavonEditor } from 'mavon-editor';
import W3qDeployer from '@/components/w3q-deployer.vue';
import validator from "email-validator";
import 'mavon-editor/dist/css/index.css';
import {getPublicKeyByEmail, sendEmail} from "@/utils/w3mail";
import {v4 as uuidv4} from "uuid";

export default {
  name: 'Email',
  data: () => {
    return {
      toolbar: {
        bold: true, // 粗体
        italic: true, // 斜体
        header: true, // 标题
        underline: true, // 下划线
        strikethrough: true, // 中划线
        superscript: true, // 上角标
        subscript: true, // 下角标
        quote: true, // 引用
        ol: true, // 有序列表
        ul: true, // 无序列表
        link: true, // 链接
        code: true, // code
      },
      subject: '',
      to: '',
      message: '',
      fileUuid: '',
      uuid: uuidv4(),
      sending: false
    }
  },
  components: {
    mavonEditor,
    W3qDeployer
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
    driveKey() {
      return this.$store.state.driveKey;
    },
    user() {
      return this.$store.state.user;
    }
  },
  methods: {
    onChange(msg) {
      this.message = msg;
    },
    async onSend() {
      if (!this.driveKey) {
        return;
      }

      if (!this.to) {
        this.$message.error('Receive email is empty');
        return;
      }
      if (!validator.validate(this.to) || !this.to.endsWith("w3mail.com")) {
        this.$message.error('Invalid receive email');
        return;
      }
      const values = this.to.split("@");
      const toEmail = values[0];
      const publicKey = await getPublicKeyByEmail(this.contract, toEmail);
      if(!publicKey){
        this.$message.error('Invalid receive email');
        return;
      }
      if (!this.subject) {
        this.$message.error('Subject is empty');
        return;
      }
      if (!this.message) {
        this.$message.error('Message is empty');
        return;
      }

      this.sending = true;
      const result = await sendEmail(
          this.contract, this.uuid, this.driveKey,
          this.user.publicKey, publicKey,
          toEmail, this.subject, this.message, this.fileUuid
      );
      this.sending = false;
      if (result) {
        this.$notify({title: 'Send Email', message: 'Send Success',type: 'success'});
        await this.$router.push({path: '/email', query: {index: "1"}});
      } else {
        this.$notify.error({title: 'Send Email', message: 'Send fail!'});
      }
    },
    onSuccess(response) {
      this.fileUuid = response.uuid;
    },
    onDelete() {
      this.fileUuid = '';
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.input-title {
  color: black;
  font-size: 14px;
  font-weight: bold;
  width: 60px;
  text-align: right;
}
.input-to {
  margin-top: 15px;
}
.mkd-editor {
  height: 312px !important;
  margin-top: 15px;
}
.home-btn {
  background-color: #6E529C;
  margin: 15px 0 0;
  font-size: 15px;
  color: #ffffff;
  border: 0;
  border-radius: 25px;
}
.home-btn:focus,
.home-btn:hover {
  color: #ffffff;
  background-color: #6E529CBB;
}
.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}

.mail-deployer {
  margin-top: 15px;
}
</style>
