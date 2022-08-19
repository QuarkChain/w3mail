<template>
  <div id="wallet">
    <button
      class="btn-connect"
      v-if="!this.currentAccount"
      @click.stop="connectWallet"
    >
      Connect
    </button>
    <div v-else class="account">
      {{ this.accountShort }}
      &nbsp;|&nbsp;
      {{ this.networkId === 3334 ? "Galileo" : "Mainnet" }}
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { chains } from '@/store/state';
import {getPublicKeyByAddress, createRootKey} from "@/utils/w3mail";

export class UnsupportedChainIdError extends Error {
  constructor() {
    super('UnsupportedChainIdError: not support chain')
  }
}

const chain = 3334;
const chainID = `0x${chain.toString(16)}`;
const nodes = ['https://galileo.web3q.io:8545']
const explorers = [`https://explorer.galileo.web3q.io/`];

export default {
  name: "Wallet",
  props: {},

  data: () => ({
    networkId: chain,
    currentAccount: null,
  }),
  async created() {
    this.connectWallet();
    window.ethereum.on("chainChanged", this.handleChainChanged);
    window.ethereum.on("accountsChanged", this.handleAccountsChanged);
  },
  computed: {
    accountShort() {
      return (
        this.currentAccount.substring(0, 6) +
        "..." +
        this.currentAccount.substring(
          this.currentAccount.length - 4,
          this.currentAccount.length
        )
      );
    },
  },
  methods: {
    ...mapActions(["setChainConfig", "setAccount", "setDriveKey", "setPublicKey"]),
    connectWallet() {
      if (!window.ethereum) {
        this.$message.error('Can\'t setup the Web3Q network on metamask because window.ethereum is undefined');
        return;
      }
      this.login();
    },
    async handleChainChanged() {
      const newChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainID !== newChainId) {
        this.currentAccount = null;
        this.setAccount(null);
        this.setChainConfig({});
      } else {
        const c = chains.find((v) => v.chainID === chainID);
        this.setChainConfig(c);
        if (!this.currentAccount) {
          await this.login();
        }
      }
    },
    async handleAccountsChanged(accounts) {
      // account
      if (accounts.length === 0) {
        this.currentAccount = null;
        this.setAccount(null);
        console.warn(
          "MetaMask is locked or the user has not connected any accounts"
        );
        return;
      }
      if (accounts[0] !== this.currentAccount) {
        this.currentAccount = accounts[0];
        this.setAccount(accounts[0]);
        // login
        await this.loginEmail();
      }
    },
    async handleAccount(accounts) {
      // account
      if (accounts.length === 0) {
        console.warn( "MetaMask is locked or the user has not connected any accounts");
        return;
      }
      // chain
      const newChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainID !== newChainId) {
        throw new UnsupportedChainIdError();
      }

      const c = chains.find((v) => v.chainID === chainID);
      this.setChainConfig(c);
      this.setAccount(accounts[0]);
      this.currentAccount = accounts[0];

      // set user info
      await this.loginEmail();
    },
    async login() {
      window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then(this.handleAccount)
          .catch(async (error) => {
            if (error.code === 4001) {
              this.$message.error('User rejected');
            } else if (error instanceof UnsupportedChainIdError) {
              const hasSetup = await this.setupNetwork();
              if (hasSetup) {
                await this.login();
              }
            } else {
              this.$message.error('Connect Error');
            }
          });
    },
    async setupNetwork() {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainID,
              chainName: 'Web3Q Galileo',
              nativeCurrency: {
                name: 'W3Q',
                symbol: 'W3Q',
                decimals: 18,
              },
              rpcUrls: nodes,
              blockExplorerUrls: explorers,
            },
          ],
        })
        const newChainId = await window.ethereum.request({method: "eth_chainId"});
        if (chainID !== newChainId) {
          this.$message.error('User rejected');
          return false;
        }
        return true;
      } catch (error) {
        this.$message.error('Failed to setup the network in Metamask');
        return false
      }
    },
    async loginEmail() {
      let publicKey = sessionStorage.getItem(this.currentAccount + "/publicKey");
      if (!publicKey) {
        const {EmailController} = this.$store.state.chainConfig;
        publicKey = await getPublicKeyByAddress(EmailController, this.currentAccount);
        if (publicKey) {
          sessionStorage.setItem(this.currentAccount + "/publicKey", publicKey);
        }
      }
      this.setPublicKey(publicKey);

      // is register
      let driveKey = sessionStorage.getItem(this.currentAccount + "/driveKey");
      if (!driveKey) {
        driveKey = await createRootKey();
      }
      this.setDriveKey(driveKey);
    }
  },
};
</script>

<style scoped>
#wallet {
  display: flex;
  justify-content: center;
}

.account {
  height: 38px;
  font-size: 15px;
  line-height: 38px;
  background: #FFFFFF;
  border-radius: 36px;
  border: 1px solid #E8E6F2;
  padding: 0 15px;
  text-align: center;
}

.btn-connect {
  transition: all 0.1s ease 0s;
  width: 120px;
  height: 44px;
  color: #ffffff;
  font-size: 18px;
  border: 0;
  background: #486FAE;
  border-radius: 36px;
  cursor: pointer;
}
.btn-connect:hover {
  background-color: #486FAEBB;
  border: 0;
}
</style>
