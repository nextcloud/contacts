/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface PropertyTypeOption {
	id: string
	name: string
}

export interface CustomPropertyConfig {
	name: string
	label: string
	force?: 'text' | 'select'
	options?: PropertyTypeOption[]
	multiple?: boolean
	primary?: boolean
	icon?: string
}

interface CustomPropertyModel {
	readableName: string
	icon: string
	force: 'text' | 'select'
	multiple: boolean
	primary: boolean
	options?: PropertyTypeOption[]
	defaultValue?: { value: string, type: string[] }
}

/**
 * Merge admin-defined custom property types (app config "customProperties",
 * validated server-side by CustomPropertiesService) into the property registry.
 *
 * @param properties the rfcProps.properties registry to extend
 * @param fieldOrder the rfcProps.fieldOrder list to extend
 * @param customProperties sanitized entries from the initial state
 */
export function applyCustomProperties(properties: Record<string, object>, fieldOrder: string[], customProperties: CustomPropertyConfig[]) {
	if (!Array.isArray(customProperties)) {
		return
	}

	customProperties.forEach((custom) => {
		const name = typeof custom?.name === 'string' ? custom.name.toLowerCase() : ''
		if (!name.startsWith('x-') || properties[name]) {
			return
		}

		const model: CustomPropertyModel = {
			readableName: custom.label,
			icon: custom.icon || 'icon-detailed-name',
			force: custom.force === 'select' ? 'select' : 'text',
			multiple: custom.multiple === true,
			primary: custom.primary === true,
		}

		if (Array.isArray(custom.options) && custom.options.length > 0) {
			model.options = custom.options
			if (model.force === 'text') {
				// options on a text property are TYPE choices: preselect the
				// first one like the builtin tel/email/adr defaults do
				model.defaultValue = { value: '', type: [custom.options[0].id] }
			}
		}

		properties[name] = model
		fieldOrder.push(name)
	})
}
