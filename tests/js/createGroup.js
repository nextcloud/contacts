const { Builder, By, Key, until } = require('selenium-webdriver')
const { expect } = require('chai')
const path = require('path')

const Config = require('../config')

const { fetchAllCards /*, sleep */ } = require('./testUtilities')

/* eslint-disable object-shorthand */
/* object-shorthand must be disabled for user interactions because they should be composable. (see clearContacts()) */
function UserInteractions(driver) {
	return {
		login: async function() {
			await driver.get(path.join(Config.NextcloudBaseUrl, '/login'))
			const loginForm = await driver.findElement(By.name('login'))
			await loginForm.findElement(By.name('user')).sendKeys(Config.Username)
			await loginForm.findElement(By.name('password')).sendKeys(Config.Password)
			await loginForm.findElement(By.css('input[type="submit"]')).click()

			const url = await driver.getCurrentUrl()

			if (!url.match(/\/apps\/dashboard\/?/)) {
				throw new Error('Login failed!')
			}
		},

		clearContacts: async function() {
			await driver.get(path.join(Config.NextcloudBaseUrl, '/apps/contacts/All contacts'))

			for (const title of await this.getAddressbookTitles()) {
				await this.deleteAddressbook(title)
			}
		},

		getAddressbookTitles: async function() {
			const settingsButton = await driver.wait(until.elementLocated(By.css('#app-settings-header button')))
			if (await settingsButton.isDisplayed()) {
				await settingsButton.click()
				await settingsButton.click()
			} else {
				await settingsButton.click()
			}

			return Promise.all(
				(await driver.wait(until.elementsLocated(By.css('#addressbook-list li .icon-shared'))))
			    .map((element) => element.findElement(By.xpath('./parent::li/span')).getAttribute('title'))
			)
		},

		deleteAddressbook: async function(title) {
			const settingsButton = await driver.wait(until.elementLocated(By.css('#app-settings-header button')))
			await settingsButton.click()

			const addressbookMenuButton = await driver.wait(
				until.elementLocated(By.css('#addressbook-list li *[title="' + title + '"] ~ .action-item button'))
			)
			await addressbookMenuButton.click()

			const actionIcon = await driver.wait(until.elementLocated(By.css('.popover .action-button .icon-delete')))
			await actionIcon.findElement(By.xpath('./parent::button')).click()

			const confirmationButton = await driver.wait(until.elementLocated(By.css('.oc-dialog button.primary')))

			await confirmationButton.click()
		},

		createContact: async function(fields) {
			await driver.wait(until.elementLocated(By.css('#new-contact-button')))

			await driver.findElement(By.css('#new-contact-button')).click()

			await driver.wait(until.elementLocated(By.css('#contact-fullname')))
			await driver.findElement(By.css('#contact-fullname')).click()
			await driver.findElement(By.css('#contact-fullname')).sendKeys(fields.fullname)

			await driver.wait(until.stalenessOf(driver.findElement(By.css('.contact-header__actions .icon-error'))))
		},

		addContactToGroup: async function(groupName) {
			const groupSelector = await driver.findElement(By.css('.property--groups input.multiselect__input'))
			await groupSelector.click()
			await groupSelector.sendKeys(groupName, Key.ENTER)

			await driver.wait(until.elementLocated(By.css('.app-navigation-entry a[href="/apps/contacts/' + groupName + '"]')))

			try {
				// wait until contact has been submitted to server
				await driver.wait(until.elementLocated(By.css('.contact-header__actions .icon-loading-small')), 1000)
				await driver.wait(until.stalenessOf(driver.findElement(By.css('.contact-header__actions .icon-loading-small'))))
			} catch (e) {
				// synchronization timing can be quite unpredictable
			}
		},

		getGroupContacts: async function(groupName) {
			const contactGroup = await driver.wait(
				until.elementLocated(
					By.css('.app-navigation-entry a[href="/apps/contacts/' + groupName + '"]')
				)
			)
			await contactGroup.click()

			await driver.wait(until.elementLocated(By.css('#contacts-list')))

			const titles = await Promise.all(
				(await driver.findElements(By.css('#contacts-list .app-content-list-item-line-one')))
				  .map((element) => element.getText())
			)

			return titles.filter((title) => title.trim() !== '')
		},
	}
}
/* eslint-enable object-shorthand */

describe('Contact Groups', () => {
	const driver = new Builder().forBrowser('firefox').build()

	before(async() => {
		await UserInteractions(driver).login()
	})

	beforeEach(async() => {
		await UserInteractions(driver).clearContacts()
	})

	after(async() => {
		await UserInteractions(driver).clearContacts()

		driver.quit()
	})

	it('should create contact with single newly created contact group', async() => {
		await driver.get(path.join(Config.NextcloudBaseUrl, '/apps/contacts/All contacts'))

		await UserInteractions(driver).createContact({ fullname: 'Anton Aichinger' })
		await UserInteractions(driver).addContactToGroup('A')

		expect(await UserInteractions(driver).getGroupContacts('A')).to.have.members(['Anton Aichinger'])

		const cards = await fetchAllCards()
		const contactCard = cards.find(c => c.getFirstPropertyValue('fn') === 'Anton Aichinger')
		const contactCategories = contactCard.getFirstProperty('categories').getValues()
		expect(contactCategories).to.have.members(['A'])
	})

	it('should create contact with two newly created contact groups', async() => {
		await driver.get(path.join(Config.NextcloudBaseUrl, '/apps/contacts/All contacts'))

		await UserInteractions(driver).createContact({ fullname: 'Anton Aichinger' })
		await UserInteractions(driver).addContactToGroup('A')
		await UserInteractions(driver).addContactToGroup('AA')

		expect(await UserInteractions(driver).getGroupContacts('A')).to.have.members(['Anton Aichinger'])
		expect(await UserInteractions(driver).getGroupContacts('AA')).to.have.members(['Anton Aichinger'])

		const cards = await fetchAllCards()
		const contactCard = cards.find(c => c.getFirstPropertyValue('fn') === 'Anton Aichinger')
		const contactCategories = contactCard.getFirstProperty('categories').getValues()
		expect(contactCategories).to.have.members(['A', 'AA'])
	})

	it('should create two contacts with three partialy overlapping contact groups', async() => {
		await driver.get(path.join(Config.NextcloudBaseUrl, '/apps/contacts/All contacts'))

		await UserInteractions(driver).createContact({ fullname: 'Anton Aichinger' })
		await UserInteractions(driver).addContactToGroup('A')
		await UserInteractions(driver).addContactToGroup('AB')

		await UserInteractions(driver).createContact({ fullname: 'Bernd Bauer' })
		await UserInteractions(driver).addContactToGroup('B')
		await UserInteractions(driver).addContactToGroup('AB')

		expect(await UserInteractions(driver).getGroupContacts('A')).to.have.members(['Anton Aichinger'])
		expect(await UserInteractions(driver).getGroupContacts('AB')).to.have.members(['Anton Aichinger', 'Bernd Bauer'])
		expect(await UserInteractions(driver).getGroupContacts('B')).to.have.members(['Bernd Bauer'])

		const cards = await fetchAllCards()

		const contactCardA = cards.find(c => c.getFirstPropertyValue('fn') === 'Anton Aichinger')
		const contactCategoriesA = contactCardA.getFirstProperty('categories').getValues()
		expect(contactCategoriesA).to.have.members(['A', 'AB'])

		const contactCardB = cards.find(c => c.getFirstPropertyValue('fn') === 'Bernd Bauer')
		const contactCategoriesB = contactCardB.getFirstProperty('categories').getValues()
		expect(contactCategoriesB).to.have.members(['B', 'AB'])
	})
})
