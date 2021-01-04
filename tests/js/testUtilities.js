
const axios = require('axios')
const https = require('https')
const xml2js = require('xml2js')
const ICAL = require('ical.js')

const Config = require('../config')

module.exports = {
	sleep: (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms))
	},

	fetchAllCards: async() => {
		const davClient = axios.create({
			httpsAgent: new https.Agent({ rejectUnauthorized: false }),
			baseURL: Config.NextcloudBaseUrl,
			headers: {
				'Content-Type': 'application/xml',
			},
			auth: {
		    username: Config.Username,
		    password: Config.Password,
		  },
		})

		const requestBody = new xml2js.Builder().buildObject({
			'x0:propfind': {
				$: {
					'xmlns:x0': 'DAV:',
				},
				'x0:prop': {
					'x3:address-data': {
						$: {
							'xmlns:x3': 'urn:ietf:params:xml:ns:carddav',
						},
					},
				},
			},
		})

		const requestData = {
			method: 'PROPFIND',
			url: '/remote.php/dav/addressbooks/users/zlajo/contacts/',
			data: requestBody,
		}

		return davClient.request(requestData)
			.then(response => xml2js.parseStringPromise(response.data))
			.then(xml => xml['d:multistatus']['d:response'])
			.then(items => items.map(item => ICAL.parse(item['d:propstat'][0]['d:prop'][0]['card:address-data'][0])))
			.then(items => items.filter(item => item.length > 0))
			.then(items => items.map(jCal => new ICAL.Component(jCal)))
	},
}
