<template>
  <el-col>
    <el-input size="small" v-model="to">
      <div slot="prepend" class="input-title">To:</div>
    </el-input>
    <el-input size="small" v-model="subject" class="input-to">
      <div slot="prepend" class="input-title">Subject:</div>
    </el-input>
    <div class="other-class">
      <label><input type="checkbox" :disabled="!this.receivePublicKey" v-model="isEncryption"/> Encrypt</label>
      <w3q-deployer class="mail-deployer" :drag="false" :disabled="!this.isEncryption"
                    :fileContract="contract" :driveKey="this.driveKey"
                    :emailUuid="this.uuid" :onSuccess="onSuccess" :onDelete="onDelete"/>
    </div>
    <quill-editor v-model="message" ref="myQuillEditor" class="mkd-editor" :options="editorOption" />
    <el-button class="home-btn" :loading="this.sending" @click="onSend">Send</el-button>
  </el-col>
</template>

<script>
import {ethers} from "ethers";
import { quillEditor } from 'vue-quill-editor';
import {v4 as uuidv4} from "uuid";
import W3qDeployer from '@/components/w3q-deployer.vue';
import {getPublicKeyByAddress, sendEmail} from "@/utils/w3mail";

import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

export default {
  name: 'Email',
  data: () => {
    return {
      editorOption: {
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'image'],
            ['blockquote', 'code-block'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'align': []}],
            [{'header': 1}, {'header': 2}],               // custom button values
            [{'color': []}, {'background': []}],          // dropdown with defaults from theme
            [{'header': [1, 2, 3, 4, 5, 6, false]}],
            [{'font': []}],
          ]
        },
      },
      subject: '',
      to: '',
      message: '',
      fileUuid: '',
      uuid: uuidv4(),
      isEncryption: false,
      sending: false
    }
  },
  components: {
    W3qDeployer,
    quillEditor
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
    publicKey() {
      return this.$store.state.publicKey;
    },
    user() {
      return this.$store.state.user;
    }
  },
  asyncComputed: {
    receivePublicKey: {
      async get() {
        if (this.to && ethers.utils.isAddress(this.to)) {
          const publicKey = await getPublicKeyByAddress(this.contract, this.to);
          this.isEncryption = !!publicKey;
          return publicKey;
        }
        return undefined;
      },
      default: undefined,
      watch: ['to']
    },
  },
  methods: {
    async onSend() {
      if (!this.driveKey) {
        return;
      }

      if (!this.to) {
        this.$message.error('Receive address is empty');
        return;
      }
      if (!ethers.utils.isAddress(this.to)) {
        this.$message.error('Invalid receive address');
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
          this.publicKey, this.receivePublicKey, this.to,
          this.isEncryption, this.subject, this.message, this.fileUuid
      );
      this.sending = false;
      if (result) {
        this.$notify({title: 'Send Email', message: 'Send Success',type: 'success'});
        await this.$router.push({path: '/email', query: {index: "2"}});
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
  margin-top: 15px;
}
.mkd-editor >>> .ql-editor {
  height: 265px !important;
}
.home-btn {
  background-color: #486FAE;
  margin: 15px 0 0;
  font-size: 15px;
  color: #ffffff;
  border: 0;
  border-radius: 25px;
}
.home-btn:focus,
.home-btn:hover {
  color: #ffffff;
  background-color: #486FAEBB;
}
.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}

.other-class {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  margin-top: 15px;
}
.mail-deployer {
  margin-left: 30px;
}
</style>
