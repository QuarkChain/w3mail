<template>
  <div class="home">
    <div class="title">
      Register Your W3Mail
    </div>
    <el-card class="card">
      <div>
        <el-steps :active="active" finish-status="success" align-center>
          <el-step title="Step 1"></el-step>
          <el-step title="Step 2"></el-step>
        </el-steps>
        <el-carousel ref="carousel" :autoplay="false" arrow="never" indicator-position="none">
          <el-carousel-item>
            <div class="card-item">
              <p class="item-title">Get Public Key</p>
              <p class="item-message">
                Your public key is needed so that others can send encrypted Emails to you. <br/>
                You need to confirm it in your Metamask and it will not cost you any gas fee.
              </p>
              <el-button type="warning" round class="home-btn" @click="questPublicKey" :disabled="!this.account">
                Request
              </el-button>
            </div>
          </el-carousel-item>
          <el-carousel-item>
            <div class="card-item">
              <p class="item-title">Register W3Mail</p>
              <p class="item-message">
                Submit the public key and related information to the Web3Q for registration.
              </p>
              <el-button type="warning" round class="home-btn" :disabled="!this.account" :loading="showLoading"
                         @click="onRegister">
                Register
              </el-button>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </el-card>
  </div>
</template>

<script>
import {mapActions} from "vuex";
import {getPublicKey, getPublicKeyByAddress, register} from "@/utils/w3mail";

export default {
  name: 'Register',
  data: () => {
    return {
      active: 0,
      publicKey: undefined,
      showLoading: false,
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
    }
  },
  methods: {
    ...mapActions(["setPublicKey", "setDriveKey"]),
    async questPublicKey() {
      const key = await getPublicKey(this.account);
      if (key) {
        this.publicKey = key;
        this.active = this.active + 1;
        this.$refs.carousel.setActiveItem(this.active);
      } else {
        this.$message({
          duration: 10000,
          showClose: true,
          message: 'Current mobile wallet does not support retrieving public keys. You can use other supported mobile wallets (such as imToken) or use a desktop browser with Metamask.',
          type: 'error'
        });
      }
    },
    async onRegister() {
      if (!this.contract && this.publicKey) {
        return;
      }

      const registered = await getPublicKeyByAddress(this.contract, this.account);
      if (registered) {
        this.$message.error('This address is registered');
        return;
      }

      this.showLoading = true;
      const state = await register(this.contract, this.publicKey);
      this.showLoading = false;
      if (state) {
        this.setPublicKey(this.publicKey);
        sessionStorage.setItem(this.account + "/publicKey", this.publicKey);
        await this.$router.push({path: "/email"});
      } else {
        this.$message.error('Register Fail!');
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

.title {
  font-size: 30px;
  color: black;
  margin-bottom: 50px;
  margin-top: 35px;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  width: 1200px;
}

.card-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.item-title {
  font-size: 20px;
  color: #000000;
  line-height: 20px;
  font-family: AlibabaPuHuiTiB;
}

.item-message {
  font-size: 15px;
  color: #333333;
  line-height: 28px;
  margin-top: 30px;
  font-weight: normal;
  font-family: AlibabaPuHuiTiR;
}

.item-input {
  margin-top: 25px;
  width: 320px;
}

.home-btn {
  background-color: #486FAE;
  margin-top: 30px;
  font-size: 18px;
  border: 0;
  min-width: 120px;
}

.home-btn:focus,
.home-btn:hover {
  background-color: #486FAEBB;
}

.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}
</style>
