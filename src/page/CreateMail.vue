<template>
  <el-col>
    <el-input size="small" v-model="subject">
      <div slot="prepend" class="input-title">Subject:</div>
    </el-input>
    <el-input size="small" v-model="to" class="input-to">
      <div slot="prepend" class="input-title">To:</div>
    </el-input>
    <w3q-deployer :show-list="false" :drag="false" :fileContract="contract" :driveKey="this.driveKey">
      <div class="input-file">
        <i class="el-icon-paperclip"></i><span>Upload</span>
      </div>
    </w3q-deployer>
    <mavon-editor language="en" defaultOpen="edit" :subfield="false"
                  :boxShadow="false" :toolbars="toolbar"
                  class="mkd-editor" @change="onChange"/>
    <el-button class="home-btn" @click="onSend">Send</el-button>
  </el-col>
</template>

<script>
import { mavonEditor } from 'mavon-editor';
import W3qDeployer from '@/components/w3q-deployer.vue';
import validator from "email-validator";
import 'mavon-editor/dist/css/index.css';
import {sendEmail} from "@/utils/w3mail";

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
      to: "",
      message: ""
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
    email() {
      return this.$store.state.email;
    },
  },
  methods: {
    onChange(msg) {
      this.message = msg;
    },
    async onSend() {
      if (!this.driveKey || !this.email || !this.message) {
        return;
      }

      if (!this.subject) {
        this.$message.error('Subject is empty');
        return;
      }
      if (!this.to) {
        this.$message.error('Receive email is empty');
        return;
      }
      if (!validator.validate(this.to) || !this.to.endsWith("w3mail.com")) {
        this.$message.error('Invalid email address');
        return;
      }
      await sendEmail(this.contract, this.driveKey, this.email.publicKey, this.to, this.subject, this.message);
    },
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
.input-file {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  width: 66px;
  margin-top: 15px;
  padding: 2px 5px;
  border: 1px solid #999999;
  border-radius: 25px;
  font-size: 12px;
  color: black;
  cursor: pointer;
}
.input-file:hover {
  border: 1px solid #6E529C;
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
</style>
