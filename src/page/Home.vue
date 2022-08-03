<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="message">
      Your web3 email<br/>
      Send, encrypt and receive email with wallet
    </p>

    <!--  register  -->
    <div v-if="driveKey">
      <el-input placeholder="Input Password" v-model="input" show-password></el-input>
      <el-button type="warning" round class="home-btn" @click="openEmail">
        Enter
      </el-button>
    </div>
    <el-button v-else type="warning" round class="home-btn" @click="onCreateEmail">
      Try it now
    </el-button>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { v4 as uuidv4} from 'uuid';
import {getDrive, login, encryptDrive} from '@/utils/dirve/w3drive';

export default {
  name: 'Home',
  data: () => {
    return {
      driveUuid: undefined,
      signature: undefined,
      input: "",
    }
  },
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FileBoxController} = this.$store.state.chainConfig;
        return FileBoxController;
      }
      return null;
    },
    account() {
      return this.$store.state.account;
    },
    driveKey() {
      return this.$store.state.driveKey;
    }
  },
  asyncComputed: {
    drive: {
      async get() {
        if (this.account) {
          const {FileBoxController} = this.$store.state.chainConfig;
          return await getDrive(FileBoxController);
        }
        return undefined;
      },
      default: undefined,
      watch: ['account']
    },
  },
  watch: {
    drive: async function () {
      await this.signatureLogin();
    }
  },
  methods: {
    ...mapActions(["setDriveKey"]),
    async signatureLogin() {
      if (this.drive && !this.driveKey) {
        this.driveUuid = 'none' === this.drive.uuid ? uuidv4() : this.drive.uuid;
        this.signature = await login(this.driveUuid, this.account, 3334);

        // const publicKey = await getPublicKey(this.account);
        // console.log("publickey", publicKey.toString('base64'));
        // const encryptData = encryptEmailKey(publicKey, publicKey);
        // console.log("encry", encryptData.toString('base64'));
        // const key = await decryptEmailKey(this.account, encryptData);
        // console.log('key', key.toString('base64'));
      }
    },
    async onCreateEmail() {
      this.$router.push({path: "/register"});
    },
    async openEmail() {
      const password = this.input;
      if (!password) {
        this.$message.error('Password Error');
        return;
      }

      if (!this.signature) {
        await this.signatureLogin();
        if (!this.signature) {
          this.$message.error('Failed to open drive');
        }
      }

      const driveKey = await encryptDrive(this.signature, password, this.drive.iv, this.drive.encrypt);
      if (driveKey) {
        this.setDriveKey(driveKey);
        sessionStorage.setItem(this.account, driveKey);
      } else {
        this.$message.error('Password Error');
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-logo {
  margin-top: 35px;
  width: 230px;
}

.message {
  font-size: 30px;
  color: #333333;
  margin-bottom: 35px;
  margin-top: 35px;
}

.home-btn {
  background-color: #6E529C;
  margin-top: 20px;
  font-size: 18px;
  border: 0;
}
.home-btn:focus,
.home-btn:hover {
  background-color: #6E529CBB;
}
.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}
</style>
