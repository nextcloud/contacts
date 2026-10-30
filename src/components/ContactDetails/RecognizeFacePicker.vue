<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcDialog
		:name="t('contacts', 'Choose from recognized faces')"
		size="normal"
		@closing="$emit('close')">
		<div class="face-picker">
			<NcEmptyContent v-if="loading" :name="t('contacts', 'Loading …')">
				<template #icon>
					<IconLoading :size="20" />
				</template>
			</NcEmptyContent>

			<!-- The people Recognize found, when none is linked to the contact yet -->
			<template v-else-if="step === 'people'">
				<NcEmptyContent
					v-if="people.length === 0"
					:name="t('contacts', 'No recognized people yet')"
					:description="t('contacts', 'Recognize has not found any faces in your photos so far.')">
					<template #icon>
						<IconAccountBox :size="20" />
					</template>
				</NcEmptyContent>
				<template v-else>
					<p class="face-picker__hint">
						{{ t('contacts', 'Which of these people is {name}?', { name: contactName }) }}
					</p>
					<ul class="face-picker__grid">
						<li v-for="person in people" :key="person.id">
							<button
								type="button"
								class="face-picker__tile"
								:aria-label="person.title || t('contacts', 'Unnamed person')"
								@click="selectPerson(person)">
								<img
									class="face-picker__image"
									:src="getFacePreviewUrl(person.preview.detection.id, 160)"
									:alt="person.title || t('contacts', 'Unnamed person')"
									loading="lazy">
								<span class="face-picker__caption">{{ person.title || t('contacts', 'Unnamed person') }}</span>
							</button>
						</li>
					</ul>
				</template>
			</template>

			<!-- The faces of the chosen or linked person -->
			<template v-else>
				<p class="face-picker__hint">
					<template v-if="linked">
						{{ t('contacts', 'Pick a picture of {name} to use as the contact photo.', { name: contactName }) }}
					</template>
					<template v-else>
						{{ t('contacts', 'Picking a picture links this person to {name} in Recognize.', { name: contactName }) }}
					</template>
				</p>
				<NcEmptyContent
					v-if="detections.length === 0"
					:name="t('contacts', 'No pictures of this person')">
					<template #icon>
						<IconAccountBox :size="20" />
					</template>
				</NcEmptyContent>
				<ul v-else class="face-picker__grid">
					<li v-for="detection in detections" :key="detection.id">
						<button
							type="button"
							class="face-picker__tile"
							:disabled="picking"
							:aria-label="t('contacts', 'Use this picture')"
							@click="pickDetection(detection)">
							<img
								class="face-picker__image"
								:src="getFacePreviewUrl(detection.id, 160)"
								alt=""
								loading="lazy">
						</button>
					</li>
				</ul>
			</template>
		</div>

		<template #actions>
			<NcButton
				v-if="step === 'faces' && !loading"
				variant="tertiary"
				:disabled="picking"
				@click="showPeople">
				{{ t('contacts', 'Choose a different person') }}
			</NcButton>
			<NcButton variant="tertiary" :disabled="picking" @click="$emit('close')">
				{{ t('contacts', 'Cancel') }}
			</NcButton>
		</template>
	</NcDialog>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { NcButton, NcDialog, NcEmptyContent } from '@nextcloud/vue'
import IconAccountBox from 'vue-material-design-icons/AccountBoxMultipleOutline.vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'
import logger from '../../services/logger.js'
import {
	fetchContactFaces,
	fetchFaceDetections,
	fetchFaces,
	getFacePreviewUrl,
	linkFaceToContact,
} from '../../services/recognizeFaces.js'

/** Faces fetched per person; the largest ones come first. */
const DETECTIONS_PER_PERSON = 60

export default {
	name: 'RecognizeFacePicker',

	components: {
		IconAccountBox,
		IconLoading,
		NcButton,
		NcDialog,
		NcEmptyContent,
	},

	props: {
		contact: {
			type: Object,
			required: true,
		},
	},

	emits: ['close', 'pick'],

	data() {
		return {
			loading: true,
			picking: false,
			step: 'people',
			/** Whether the shown faces belong to a person already linked to the contact */
			linked: false,
			people: [],
			selectedPerson: null,
			detections: [],
		}
	},

	computed: {
		contactName() {
			return this.contact.displayName || this.contact.fullName || this.contact.uid
		},
	},

	async mounted() {
		await this.load()
	},

	methods: {
		getFacePreviewUrl,

		async load() {
			this.loading = true
			try {
				const { faces } = await fetchContactFaces(this.contact.addressbook.id, this.contact.uid)
				if (faces.length > 0) {
					const detections = await Promise.all(faces.map((face) => fetchFaceDetections(face.id, DETECTIONS_PER_PERSON)))
					this.detections = detections.flat()
					this.linked = true
					this.step = 'faces'
				} else {
					await this.loadPeople()
				}
			} catch (error) {
				logger.error('Could not load the recognized faces of the contact', { error })
				showError(t('contacts', 'Could not load the recognized faces'))
				this.$emit('close')
			} finally {
				this.loading = false
			}
		},

		async loadPeople() {
			const people = await fetchFaces()
			// People without a preview have no faces left to show
			this.people = people
				.filter((person) => person.preview !== null)
				.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
			this.step = 'people'
		},

		async showPeople() {
			this.loading = true
			try {
				await this.loadPeople()
			} catch (error) {
				logger.error('Could not load the recognized people', { error })
				showError(t('contacts', 'Could not load the recognized faces'))
			} finally {
				this.loading = false
			}
		},

		async selectPerson(person) {
			this.loading = true
			try {
				this.detections = await fetchFaceDetections(person.id, DETECTIONS_PER_PERSON)
				this.selectedPerson = person
				this.linked = false
				this.step = 'faces'
			} catch (error) {
				logger.error('Could not load the faces of the person', { error })
				showError(t('contacts', 'Could not load the recognized faces'))
			} finally {
				this.loading = false
			}
		},

		async pickDetection(detection) {
			this.picking = true
			try {
				if (!this.linked && this.selectedPerson !== null) {
					await linkFaceToContact(this.selectedPerson.id, this.contact.addressbook.id, this.contact.uid)
				}
				this.$emit('pick', detection)
			} catch (error) {
				logger.error('Could not link the person to the contact', { error })
				showError(t('contacts', 'Could not link the person to the contact'))
			} finally {
				this.picking = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.face-picker {
	min-height: 200px;
	padding: 0 12px 12px;

	&__hint {
		color: var(--color-text-maxcontrast);
		margin-bottom: 12px;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 12px;
		list-style: none;
	}

	&__tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 100%;
		margin: 0;
		padding: 4px;
		border: 2px solid transparent;
		border-radius: var(--border-radius-large);
		background: none;
		cursor: pointer;

		&:hover,
		&:focus-visible {
			border-color: var(--color-primary-element);
			background-color: var(--color-background-hover);
		}

		&:disabled {
			cursor: default;
			opacity: .5;
		}
	}

	&__image {
		width: 112px;
		height: 112px;
		border-radius: 50%;
		object-fit: cover;
		background-color: var(--color-background-dark);
	}

	&__caption {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
