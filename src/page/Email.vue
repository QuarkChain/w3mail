<template>
  <el-container class="home">
    <el-aside width="200px" class="email-menu">
      <el-button v-if="!this.publicKey" class="home-btn" @click="onRegister">Register</el-button>
      <el-button v-else-if="!this.driveKey" class="home-btn" @click="onLogin">Login</el-button>
      <el-button v-else class="home-btn" @click="openNewMail">New Email</el-button>
      <el-menu :default-active="this.currentIndex" @select="handleSelect">
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
        <div v-if="this.currentIndex==='100'" class="header-back" @click="onBack">
          <i class="el-icon-back" style="margin-right: 10px;"></i>Back
        </div>
        <div v-else class="header-layout">
          <div>
            <label><input type="checkbox" :disabled="this.currentIndex==='0'" v-model="checkAll" @click="onSelect"/></label>
            <span class="delete-button" @click="onDelete" >
              <i class="el-icon-delete" :class="{'icon-disabled': this.currentIndex==='0'}"/>
            </span>
          </div>
<!--          <el-pagination layout="prev, pager, next" :page-size="20" :total="1"></el-pagination>-->
        </div>
      </el-header>

      <el-main class="main-menu">
        <CreateMail v-if="currentIndex==='0'"/>
        <EmailList ref="inboxList" v-else-if="currentIndex==='1'" :types="1" v-on:changeCheckBox="changeCheckAll" />
        <EmailList ref="sentList" v-else-if="currentIndex==='2'" :types="2" v-on:changeCheckBox="changeCheckAll" />
        <EmailInfo v-else-if="currentIndex==='100'" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import CreateMail from "@/page/CreateMail.vue";
import EmailList from "@/page/EmailList.vue";
import EmailInfo from "@/page/EmailInfo.vue";
import {loginBySignature} from "@/utils/w3mail";
import {mapActions} from "vuex";

export default {
  name: 'Email',
  data: () => {
    return {
      signature: undefined,
      input: "",
      currentIndex: "1",
      checkAll: false,
    }
  },
  components: {
    CreateMail,
    EmailList,
    EmailInfo
  },
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {EmailController} = this.$store.state.chainConfig;
        return EmailController;
      }
      return null;
    },
    driveKey() {
      return this.$store.state.driveKey;
    },
    publicKey() {
      return this.$store.state.publicKey;
    },
    account() {
      return this.$store.state.account;
    }
  },
  watch: {
    account() {
      if (this.currentIndex === '0' || this.currentIndex === '100') {
        this.currentIndex = "1";
        this.$router.push({path: '/email', query: {index: this.currentIndex}});
      }
    }
  },
  methods: {
    ...mapActions(["setDriveKey"]),
    async onLogin() {
      let driveKey = await loginBySignature();
      if (driveKey) {
        sessionStorage.setItem(this.account + "/driveKey", driveKey);
        this.setDriveKey(driveKey);
      } else {
        this.$message.error('Login failed!!');
      }
    },
    onRegister() {
      this.$router.push({path: '/register'});
    },
    openNewMail() {
      this.currentIndex = "0";
      this.$router.push({path: '/email', query: {index: this.currentIndex}});
    },
    handleSelect(index) {
      this.currentIndex = index;
      this.$router.push({path: '/email', query: {index: this.currentIndex}});
    },
    canNumber(value) {
      try {
        Number(value);
      } catch (e){
        return false;
      }
      return true;
    },
    onBack() {
      this.$router.back(-1);
    },
    onDelete() {
      if (this.currentIndex === '1') {
        // inbox
        this.$refs.inboxList.onDelete();
      } else if (this.currentIndex === '2'){
        // sent
        this.$refs.sentList.onDelete();
      }
    },
    onSelect() {
      if (this.currentIndex === '1') {
        // inbox
        this.$refs.inboxList.onSelectAll(!this.checkAll);
      } else if (this.currentIndex === '2'){
        // sent
        this.$refs.sentList.onSelectAll(!this.checkAll);
      }
    },
    changeCheckAll(value) {
      this.checkAll = value;
    }
  },
  created() {
    const index = this.$route.query.index;
    if (index && this.canNumber(index)) {
      this.currentIndex = index;
    }
  }
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
  background-color: #486FAE;
  margin: 20px 0;
  min-width: 130px;
  font-size: 18px;
  color: #ffffff;
  border: 0;
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

.menu-item {
  display: flex;
  justify-content: left;
  align-items: center;
}
.menu-item-icon {
  margin-left: 40px;
}

.header-menu {
  background: #ffffff;
  border-radius: 5px;
  margin: 0 20px;
}

.header-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
.header-back {
  display: flex;
  justify-content: left;
  align-items: center;
  height: 100%;
  color: black;
  cursor: pointer;
}

.main-menu {
  background: #ffffff;
  border-radius: 5px;
  margin: 20px 20px 0;
}

.delete-button {
  margin-left: 20px;
  cursor: pointer;
}
.icon-disabled{
  color: #cccccc;
  pointer-events: none;
}
</style>
