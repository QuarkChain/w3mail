<template>
  <el-container class="home">
    <el-aside width="200px" class="email-menu">
      <el-button class="home-btn">New Email</el-button>
      <el-menu default-active="1">
        <el-menu-item index="1" class="menu-item">
          <i class="el-icon-receiving menu-item-icon"></i>
          <span slot="title">Inbox</span>
        </el-menu-item>
        <el-menu-item index="2" class="menu-item">
          <i class="el-icon-position menu-item-icon"></i>
          <span slot="title">Sent</span>
        </el-menu-item>
        <el-menu-item index="3" disabled class="menu-item">
          <i class="el-icon-delete menu-item-icon"></i>
          <span slot="title">Trash</span>
        </el-menu-item>
        <el-menu-item index="4" disabled class="menu-item">
          <i class="el-icon-edit-outline menu-item-icon"></i>
          <span slot="title">Draft</span>
        </el-menu-item>
        <el-menu-item index="5" disabled class="menu-item">
          <i class="el-icon-star-off menu-item-icon"></i>
          <span slot="title">Starred</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header-menu">
        <div>
          <input type="checkbox" />
          <i class="el-icon-delete" style="margin-left: 15px"></i>
        </div>
        <el-pagination layout="prev, pager, next" :page-size="20" :total="1"></el-pagination>
      </el-header>
      <el-main class="main-menu">
        <CreateMail />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapActions } from "vuex";
import {getEmailInfo, signInfo, encryptDrive} from '@/utils/w3mail';
import CreateMail from "./CreateMail.vue";

export default {
  name: 'Email',
  data: () => {
    return {
      signature: undefined,
      input: "",
    }
  },
  components: {
    CreateMail
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
    email: {
      async get() {
        if (this.account) {
          const email = await getEmailInfo(this.contract, this.account);
          this.setEmail(email);
          return email;
        }
        return undefined;
      },
      default: undefined,
      watch: ['account']
    },
  },
  methods: {
    ...mapActions(["setDriveKey", "setEmail"]),
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
        this.signature = await signInfo(this.account, this.email.publicKey, 3334);
        if (!this.signature) {
          this.$message.error('Failed to enter email');
          return;
        }
      }

      const driveKey = await encryptDrive(this.signature, password, this.email.encrypt, this.email.iv);
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
  height: 75vh;
}

.email-menu {
  background: #ffffff;
  border-radius: 5px;
  height: 75vh;
}

.home-btn {
  background-color: #6E529C;
  margin: 20px 0;
  font-size: 18px;
  color: #ffffff;
  border: 0;
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

.menu-item {
  display: flex;
  justify-content: left;
  align-items: center;
}
.menu-item-icon {
  margin-left: 40px;
}

.header-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 5px;
  height: 8vh;
  margin: 0 20px;
}

.main-menu {
  background: #ffffff;
  border-radius: 5px;
  margin: 20px 20px 0;
}
</style>
