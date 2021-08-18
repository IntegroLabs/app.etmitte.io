<template>
	<div class="p-grid">
		<div class="p-col-12 p-md-6">
			<div class="card p-fluid">
				<span v-if="loggedIn">
					<h5>Send Message</h5>
					<div class="p-field">
						<label for="addresses1">Addresses</label>
						<InputText id="addresses1" type="text" v-model="recipients" placeholder="Enter addresses (comma separated)" />
					</div>
					<div class="p-field">
						<label for="subject1">Subject</label>
						<InputText id="subject1" type="text" v-model="title" placeholder="Enter Message Title" />
					</div>
					<div class="p-field">
						<label for="body1">Body</label>
						<Textarea rows="4" id="body1" type="text" v-model="body" placeholder="Enter Message Body" />
					</div>
					<div class="p-field">
						<Button label="Send" class="p-mr-2 p-mb-2" v-on:click="send"></Button>
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
			recipients: undefined,
			title: undefined,
			body: undefined
		}),
		mounted: async function () {

		},
		methods: {
			send() {
			Tezos.sendMessage(this.recipients, this.title, this.body);
			}
		}
	}
</script>
