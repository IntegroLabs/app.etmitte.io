<template>
	<div class="p-grid">
		<div class="p-col-12 p-md-6">
			<div class="card p-fluid">
				<span v-if="loggedIn">
					<h5>Staking for DAO Fees</h5>
					<div class="p-field"> 
						Amount Staked: {{ this.staked }}
					</div>
					<div class="p-field">
						<label for="amount1">Amount</label>
						<InputText id="amount1" type="text" v-model="amount" placeholder="Enter amount to stake/unstake" />
					</div>
					<div class="p-field">
						<Button label="Stake" class="p-mr-2 p-mb-2" v-on:click="stake"></Button>
						<Button label="Unstake" class="p-mr-2 p-mb-2" v-on:click="unstake"></Button>
						<Button label="Claim" class="p-mr-2 p-mb-2" v-on:click="claim"></Button>
					</div>	
				</span>		
				<span v-else>
					<p>Please connect Tezos wallet.</p>
				</span>					
			</div>
		</div>
	</div>
</template>
<script>
	import { isLoggedIn } from 'axios-jwt';
	import * as Tezos from '../tezos/tezos';

	export default {
		name: 'Messenger',
		data: () => ({
			loggedIn: isLoggedIn(),
			amount: undefined,
			staked: undefined
		}),
		mounted: async function () {
			this.getStake();
		},
		methods: {
			stake() {
				Tezos.stake(parseFloat(this.amount), () => this.getStake());
				this.amount = undefined;
			},
			unstake() {
				Tezos.unstake(parseFloat(this.amount), () => this.getStake());
				this.amount = undefined;
			},
			claim() {
				Tezos.claim();
			},
			async getStake() {
				this.staked = await Tezos.getStake();
			}
		}
	}
</script>
