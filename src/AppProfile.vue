<template>
	<div class="layout-profile">
		<div>
			<span v-if="loggedIn">
				<img :src="'https://services.tzkt.io/v1/avatars/' + wallet.address" alt="" />
			</span>
			<span v-else>
				<button class="p-link layout-profile-link" v-on:click="login">
					<img src="assets/layout/images/tezos.png" alt="" />
				</button>
			</span>
		</div>
		<span v-if="loggedIn">
			<button class="p-link layout-profile-link" @click="onClick">
				<span class="username">{{ walletaddress }}</span>
				<i class="pi pi-fw pi-cog"></i>
			</button>
		</span>
		<span v-else>
			<button class="p-link layout-profile-link" v-on:click="login">
				<span class="username">Connect Wallet</span>
			</button>
		</span>
		<span v-if="loggedIn">
			<transition name="layout-submenu-wrapper">
				<ul v-show="expanded">
					<li><button class="p-link" v-on:click="logout"><i class="pi pi-fw pi-power-off"></i><span>Logout</span></button></li>
				</ul>
			</transition>
		</span>		
	</div>
</template>

<script>
import { isLoggedIn } from 'axios-jwt';

import * as Auth from './tezos/auth';
import * as Tezos from './tezos/tezos';

export default {
  name: 'Header',
  data: () => ({
    loggedIn: isLoggedIn(),
    wallet: { address: '' },
    walletAssets: [],
	expanded: false,
	walletaddress: ''
  }),
  mounted: async function () {
    this.wallet = await Tezos.getActiveAccount();
	this.getAddress();
  },
  methods: {
    login: async function() {
      this.loggedIn = await Auth.login();
      this.wallet = await Tezos.getActiveAccount();

      location.reload();
    },
    logout: function() {
      Auth.logout();
      location.reload();
    },
    getAddress: async function() {
		this.walletaddress = this.truncateAddress(this.wallet.address);

      Tezos.getTezDomain(this.wallet.address).then((domain) => {
        if (!domain) {
          return;
        }

        this.walletaddress = domain;
      });
    },
    truncateAddress: function(address) {
      if (address === undefined) { return ''; }
      return address.substr(0, 5) + '...' + address.substr(address.length - 5, 5);
    },
	onClick: function(event){
		this.expanded = !this.expanded;
		event.preventDefault();
	}	
  }
}
</script>

<style scoped>

</style>