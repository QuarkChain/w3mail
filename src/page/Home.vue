<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="message">
      Your web3 email<br/>
      Send, encrypt and receive email with wallet
    </p>

    <!--  register  -->
    <div v-if="this.user && this.user.email">
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
import {getUserInfo, signInfo, encryptDrive} from '@/utils/w3mail';

export default {
  name: 'Home',
  data: () => {
    return {
      signature: undefined,
      input: "",
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
  },
  asyncComputed: {
    user: {
      async get() {
        if (this.account) {
          const user = await getUserInfo(this.contract, this.account);
          if(user.email) {
            this.setUser(user);
            sessionStorage.setItem(this.account + "/user", JSON.stringify(user));
          }
          return user;
        }
        return undefined;
      },
      default: undefined,
      watch: ['account']
    },
  },
  methods: {
    ...mapActions(["setDriveKey", "setUser"]),
    onCreateEmail() {
      this.$router.push({path: "/register"});
    },
    async openEmail() {
      const password = this.input;
      if (!password) {
        this.$message.error('Password Error');
        return;
      }

      if (!this.signature) {
        this.signature = await signInfo(this.account, this.user.publicKey, 3334);
        if (!this.signature) {
          this.$message.error('Failed to enter email');
          return;
        }
      }

      const driveKey = await encryptDrive(this.signature, password, this.user.encrypt, this.user.iv);
      if (driveKey) {
        this.setDriveKey(driveKey);
        sessionStorage.setItem(this.account, driveKey);
        this.$router.push({path: "/email"});
      } else {
        this.$message.error('Password Error');
      }
    },
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
