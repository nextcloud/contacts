<template>
	<div class="ocm_manual_form">
		<h5 class="">
			{{
				t(
					"contacts",
					"Accept an invite from someone outside your organisation to collaborate."
				)
			}}
		</h5>
		<p>
			{{
				t(
					"contacts",
					"After you have accepted the invite, both of you will appear in each others' contacts list and you can start sharing data with each other."
				)
			}}
		</p>
		<div class="ocm_manual_inputs">
			<NcTextField v-model="provider" label="Provider" type="text" />
			<NcTextField v-model="token" label="Token" type="text" />
			<div class="ocm_manual_buttons">
				<Button @click="accept">
					<template #icon>
						<IconLoading v-if="loadingUpdate" :size="20" />
						<IconCheck v-else :size="20" />
					</template>
					{{ t("contacts", "Accept") }}
				</Button>
				<Button @click="cancel">
					<template #icon>
						<IconLoading v-if="loadingUpdate" :size="20" />
						<IconCancel v-else :size="20" />
					</template>
					{{ t("contacts", "Cancel") }}
				</Button>
			</div>
		</div>
	</div>
</template>

<script>
import NcTextField from '@nextcloud/vue/components/NcTextField'
import NcButton from '@nextcloud/vue/components/NcButton'

export default {
	name: 'OcmAcceptForm',
	components: {
		NcTextField,
		NcButton,
	},
	data() {
		return {
			provider: '',
			token: '',
		}
	},
	methods: {
		accept() {
			this.$emit('accept', { provider: this.provider, token: this.token })
		},
		cancel() {
			this.$emit('cancel')
		},
	},
}
</script>

<style lang="scss" scoped>
.ocm_manual_buttons {
  display: flex;
  gap: 0.5rem;
}

.ocm_manual_form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1em;

  p {
    margin-bottom: 1em;
  }

  div.ocm_manual_inputs {
    margin-inline-start: 0.2em;
    width: 80%;
  }
}
</style>
